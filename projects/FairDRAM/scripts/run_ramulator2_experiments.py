#!/usr/bin/env python3
"""Run FairDRAM experiments on a patched Ramulator 2.x checkout."""
from __future__ import annotations

import argparse
import csv
import json
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List

try:
    import yaml
except ImportError as exc:
    raise SystemExit("Missing dependency: pip install pyyaml") from exc


STAT_RE_TEMPLATE = r"(?:^|\n)\s*{name}\s*:\s*([0-9.+\-eE]+)"


@dataclass
class RunSpec:
    name: str
    mix: str
    scheduler: str
    traces: List[Path]
    cpu_trace: str
    ai_trace: str
    mode: str  # cpu_alone, ai_alone, mixed


def make_config(traces: List[Path], scheduler: str, num_expected_insts: int) -> Dict:
    sched = {"impl": scheduler}
    if scheduler == "FairDRAM":
        sched.update(
            {
                "cpu_source_ids": "0",
                "cpu_low_queue_threshold": 4,
                "age_gap_threshold": 128,
                "cpu_quota_pct": 70,
                "epoch_len": 1024,
            }
        )
    return {
        "Frontend": {
            "impl": "SimpleO3",
            "clock_ratio": 8,
            "num_expected_insts": num_expected_insts,
            "traces": [str(p) for p in traces],
            "ipc": 4,
            "inst_window_depth": 128,
            "llc_latency": 47,
            "llc_capacity_per_core": "2MB",
            "llc_associativity": 8,
            "llc_num_mshr_per_core": 16,
        },
        "Translation": {"impl": "RandomTranslation", "max_addr": 2147483648},
        "MemorySystem": {
            "impl": "GenericDRAM",
            "clock_ratio": 3,
            "DRAM": {
                "impl": "DDR4",
                "org": {"preset": "DDR4_8Gb_x8", "channel": 1, "rank": 2},
                "timing": {"preset": "DDR4_2400R"},
            },
            "Controller": {
                "impl": "Generic",
                "Scheduler": sched,
                "RefreshManager": {"impl": "AllBank"},
                "RowPolicy": {"impl": "ClosedRowPolicy", "cap": 4},
                "plugins": [],
            },
            "AddrMapper": {"impl": "RoBaRaCoCh"},
        },
    }


def parse_stat(text: str, name: str) -> float:
    pat = re.compile(STAT_RE_TEMPLATE.format(name=re.escape(name)))
    m = pat.search(text)
    if not m:
        raise KeyError(f"stat not found: {name}")
    return float(m.group(1))


def run_one(exe: Path, cfg_path: Path, out_path: Path) -> str:
    with out_path.open("w") as out:
        proc = subprocess.run([str(exe), "-f", str(cfg_path)], stdout=out, stderr=subprocess.STDOUT, text=True)
    text = out_path.read_text(errors="replace")
    if proc.returncode != 0:
        raise RuntimeError(f"Ramulator failed for {cfg_path}; see {out_path}\n{text[-2000:]}")
    return text


def read_mixes(path: Path) -> List[Dict[str, str]]:
    with path.open() as f:
        return list(csv.DictReader(f))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ramulator2", type=Path, required=True, help="Path to ramulator2 executable")
    parser.add_argument("--traces", type=Path, default=Path("traces"))
    parser.add_argument("--out", type=Path, default=Path("results"))
    parser.add_argument("--insts", type=int, default=50000)
    parser.add_argument("--schedulers", nargs="+", default=["FRFCFS", "FairDRAM"])
    parser.add_argument("--limit-mixes", type=int, default=0, help="Run first N mixes only; 0 means all")
    args = parser.parse_args()

    exe = args.ramulator2.resolve()
    if not exe.exists():
        raise SystemExit(f"ramulator2 executable not found: {exe}")
    args.out.mkdir(parents=True, exist_ok=True)
    cfg_dir = args.out / "configs"
    log_dir = args.out / "logs"
    cfg_dir.mkdir(exist_ok=True)
    log_dir.mkdir(exist_ok=True)

    mixes = read_mixes(args.traces / "mixes.csv")
    if args.limit_mixes:
        mixes = mixes[: args.limit_mixes]

    rows = []
    for mix in mixes:
        mix_name = mix["mix"]
        cpu_trace = args.traces / mix["cpu_trace"]
        ai_trace = args.traces / mix["ai_trace"]

        isolated: Dict[str, float] = {}
        for mode, trace, stat_core in [
            ("cpu_alone", cpu_trace, 0),
            ("ai_alone", ai_trace, 0),
        ]:
            cfg = make_config([trace], "FRFCFS", args.insts)
            cfg_path = cfg_dir / f"{mix_name}_{mode}.yaml"
            cfg_path.write_text(yaml.safe_dump(cfg, sort_keys=False))
            log_path = log_dir / f"{mix_name}_{mode}.log"
            print(f"RUN {mix_name} {mode}")
            text = run_one(exe, cfg_path, log_path)
            isolated[mode] = parse_stat(text, f"cycles_recorded_core_{stat_core}")

        for scheduler in args.schedulers:
            cfg = make_config([cpu_trace, ai_trace], scheduler, args.insts)
            cfg_path = cfg_dir / f"{mix_name}_mixed_{scheduler}.yaml"
            cfg_path.write_text(yaml.safe_dump(cfg, sort_keys=False))
            log_path = log_dir / f"{mix_name}_mixed_{scheduler}.log"
            print(f"RUN {mix_name} mixed {scheduler}")
            text = run_one(exe, cfg_path, log_path)
            cpu_cycles = parse_stat(text, "cycles_recorded_core_0")
            ai_cycles = parse_stat(text, "cycles_recorded_core_1")
            cpu_norm = isolated["cpu_alone"] / cpu_cycles
            ai_norm = isolated["ai_alone"] / ai_cycles
            fairness = (cpu_norm + ai_norm) ** 2 / (2.0 * (cpu_norm**2 + ai_norm**2))
            rows.append(
                {
                    "mix": mix_name,
                    "scheduler": scheduler,
                    "cpu_alone_cycles": isolated["cpu_alone"],
                    "ai_alone_cycles": isolated["ai_alone"],
                    "cpu_mixed_cycles": cpu_cycles,
                    "ai_mixed_cycles": ai_cycles,
                    "cpu_slowdown": cpu_cycles / isolated["cpu_alone"],
                    "ai_throughput_loss_pct": 100.0 * (1.0 - isolated["ai_alone"] / ai_cycles),
                    "jain_fairness": fairness,
                    "cpu_norm_throughput": cpu_norm,
                    "ai_norm_throughput": ai_norm,
                }
            )

    csv_path = args.out / "summary.csv"
    with csv_path.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    (args.out / "summary.json").write_text(json.dumps(rows, indent=2))
    print(f"Wrote {csv_path}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyError as exc:
        print(f"Could not parse Ramulator stat: {exc}", file=sys.stderr)
        print("Check the matching log in results/logs and adjust parse_stat() if your Ramulator branch renamed stats.", file=sys.stderr)
        raise
