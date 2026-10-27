#!/usr/bin/env python3
"""Generate synthetic SimpleO3 traces for CPU + AI co-execution studies.

SimpleO3 trace format used by Ramulator 2.x:
  <bubble_count> <load_addr> [store_addr]

The traces are intentionally larger than the LLC so most accesses reach DRAM.
"""
from __future__ import annotations

import argparse
import random
from pathlib import Path

LINE = 64


WORKLOADS = {
    "cpu_sparse": {"kind": "cpu", "bubble": (18, 42), "write_prob": 0.02, "pattern": "random", "base": 0x1000_0000},
    "cpu_graph": {"kind": "cpu", "bubble": (4, 16), "write_prob": 0.05, "pattern": "random", "base": 0x1800_0000},
    "cpu_bursty": {"kind": "cpu", "bubble": (0, 48), "write_prob": 0.04, "pattern": "bursty", "base": 0x2000_0000},
    "ai_stream": {"kind": "ai", "bubble": (0, 1), "write_prob": 0.01, "pattern": "stream", "base": 0x8000_0000},
    "ai_random": {"kind": "ai", "bubble": (0, 2), "write_prob": 0.03, "pattern": "random", "base": 0x9000_0000},
    "ai_writeheavy": {"kind": "ai", "bubble": (0, 1), "write_prob": 0.25, "pattern": "stream", "base": 0xA000_0000},
}


MIXES = [
    ("sparse_stream", "cpu_sparse", "ai_stream"),
    ("sparse_random", "cpu_sparse", "ai_random"),
    ("graph_stream", "cpu_graph", "ai_stream"),
    ("graph_writeheavy", "cpu_graph", "ai_writeheavy"),
    ("bursty_stream", "cpu_bursty", "ai_stream"),
    ("bursty_random", "cpu_bursty", "ai_random"),
]


def make_addr(i: int, spec: dict, rng: random.Random, working_set_lines: int) -> int:
    base = spec["base"]
    pattern = spec["pattern"]
    if pattern == "stream":
        line = i % working_set_lines
    elif pattern == "bursty":
        if (i // 128) % 4 == 0:
            line = i % 4096
        else:
            line = rng.randrange(working_set_lines)
    else:
        line = rng.randrange(working_set_lines)
    return base + line * LINE


def emit_trace(path: Path, name: str, insts: int, seed: int, working_set_mb: int) -> None:
    spec = WORKLOADS[name]
    rng = random.Random(seed)
    working_set_lines = (working_set_mb * 1024 * 1024) // LINE
    b0, b1 = spec["bubble"]
    with path.open("w") as f:
        for i in range(insts):
            bubble = rng.randint(b0, b1)
            load_addr = make_addr(i, spec, rng, working_set_lines)
            if rng.random() < spec["write_prob"]:
                store_addr = make_addr(i + 17, spec, rng, working_set_lines)
                f.write(f"{bubble} {load_addr} {store_addr}\n")
            else:
                f.write(f"{bubble} {load_addr}\n")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", type=Path, default=Path("traces"))
    parser.add_argument("--insts", type=int, default=50000)
    parser.add_argument("--working-set-mb", type=int, default=128)
    parser.add_argument("--seed", type=int, default=7)
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    for idx, name in enumerate(WORKLOADS):
        emit_trace(args.out / f"{name}.trace", name, args.insts, args.seed + idx, args.working_set_mb)

    with (args.out / "mixes.csv").open("w") as f:
        f.write("mix,cpu_trace,ai_trace\n")
        for mix, cpu, ai in MIXES:
            f.write(f"{mix},{cpu}.trace,{ai}.trace\n")

    print(f"Wrote {len(WORKLOADS)} traces and mixes.csv to {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
