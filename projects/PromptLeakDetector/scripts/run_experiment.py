#!/usr/bin/env python3
"""Run PromptLeakDetector metrics over a generated synthetic dataset."""

import argparse
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from promptleakdetector.experiment import ExperimentConfig, run_experiment


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default="configs/run_config.json")
    parser.add_argument("--out", default="runs/example")
    parser.add_argument("--n", type=int, default=None)
    parser.add_argument("--seed", type=int, default=None)
    parser.add_argument("--threshold", type=float, default=None)
    args = parser.parse_args()

    config = ExperimentConfig.from_json(args.config)
    if args.n is not None:
        config.n_examples = args.n
    if args.seed is not None:
        config.seed = args.seed
    if args.threshold is not None:
        config.threshold = args.threshold

    paths = run_experiment(config, args.out)
    for key, value in paths.items():
        print(f"{key}: {value}")


if __name__ == "__main__":
    main()
