#!/usr/bin/env python3
"""Generate an illustrative summary.csv without Ramulator.

Use this only to test the plotting pipeline or draft a talk figure. Do not use
these synthetic numbers as experimental results in a paper.
"""
from __future__ import annotations

import argparse
import csv
from pathlib import Path

MIXES = [
    "sparse_stream",
    "sparse_random",
    "graph_stream",
    "graph_writeheavy",
    "bursty_stream",
    "bursty_random",
]

ILLUSTRATIVE_RESULTS = {
    "sparse_stream": {"FRFCFS": (2.45, 4.0), "FairDRAM": (1.63, 3.4)},
    "sparse_random": {"FRFCFS": (2.88, 2.0), "FairDRAM": (1.86, 1.8)},
    "graph_stream": {"FRFCFS": (2.39, 3.1), "FairDRAM": (1.61, 2.8)},
    "graph_writeheavy": {"FRFCFS": (3.12, 4.6), "FairDRAM": (2.08, 4.0)},
    "bursty_stream": {"FRFCFS": (2.91, 5.0), "FairDRAM": (1.97, 4.5)},
    "bursty_random": {"FRFCFS": (2.95, 1.9), "FairDRAM": (1.92, 1.7)},
}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", type=Path, default=Path("results"))
    parser.add_argument(
        "--seed",
        type=int,
        default=3,
        help="Accepted for compatibility; outputs are deterministic.",
    )
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    rows = []
    for mix in MIXES:
        base_cpu, base_ai_loss = ILLUSTRATIVE_RESULTS[mix]["FRFCFS"]
        fair_cpu, fair_ai_loss = ILLUSTRATIVE_RESULTS[mix]["FairDRAM"]
        for scheduler, cpu_slowdown, ai_loss in [
            ("FRFCFS", base_cpu, base_ai_loss),
            ("FairDRAM", fair_cpu, fair_ai_loss),
        ]:
            cpu_norm = 1.0 / cpu_slowdown
            ai_norm = max(0.01, 1.0 - ai_loss / 100.0)
            fairness = (cpu_norm + ai_norm) ** 2 / (2.0 * (cpu_norm**2 + ai_norm**2))
            rows.append(
                {
                    "mix": mix,
                    "scheduler": scheduler,
                    "cpu_alone_cycles": 100000,
                    "ai_alone_cycles": 80000,
                    "cpu_mixed_cycles": 100000 * cpu_slowdown,
                    "ai_mixed_cycles": 80000 / ai_norm,
                    "cpu_slowdown": cpu_slowdown,
                    "ai_throughput_loss_pct": ai_loss,
                    "jain_fairness": fairness,
                    "cpu_norm_throughput": cpu_norm,
                    "ai_norm_throughput": ai_norm,
                }
            )
    out = args.out / "summary.csv"
    with out.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote illustrative data to {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
