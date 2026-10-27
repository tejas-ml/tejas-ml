#!/usr/bin/env python3
"""One-command runner for PromptLeakDetector.

Example:
    python run_all.py --config configs/run_config.json --out runs/example
"""

from __future__ import annotations

import argparse
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from promptleakdetector.experiment import ExperimentConfig, run_experiment
from promptleakdetector.plotting import make_all_figures


def main() -> None:
    parser = argparse.ArgumentParser(description="Run PromptLeakDetector synthetic benchmark and make figures.")
    parser.add_argument("--config", default="configs/run_config.json", help="Path to JSON config.")
    parser.add_argument("--out", default="runs/example", help="Output directory.")
    parser.add_argument("--n", type=int, default=None, help="Override number of synthetic examples.")
    parser.add_argument("--seed", type=int, default=None, help="Override random seed.")
    parser.add_argument("--threshold", type=float, default=None, help="Override detector threshold.")
    args = parser.parse_args()

    config = ExperimentConfig.from_json(args.config)
    if args.n is not None:
        config.n_examples = args.n
    if args.seed is not None:
        config.seed = args.seed
    if args.threshold is not None:
        config.threshold = args.threshold

    print("[1/2] Running synthetic experiment...")
    paths = run_experiment(config, args.out)
    print("[2/2] Creating figures...")
    figure_paths = make_all_figures(args.out)

    print("\nDone. Key outputs:")
    for key in ["dataset", "decisions", "threshold_sweep", "metrics_summary", "leakage_reduction"]:
        print(f"  {key}: {paths[key]}")
    for key, value in figure_paths.items():
        print(f"  figure_{key}: {value}")


if __name__ == "__main__":
    main()
