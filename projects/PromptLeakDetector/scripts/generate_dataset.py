#!/usr/bin/env python3
"""Generate the synthetic PromptLeakDetector dataset."""

import argparse
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from promptleakdetector.synthetic_data import save_dataset


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="runs/example/synthetic_dataset.csv")
    parser.add_argument("--n", type=int, default=1200)
    parser.add_argument("--seed", type=int, default=7)
    args = parser.parse_args()
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    df = save_dataset(args.out, n_examples=args.n, seed=args.seed)
    print(f"wrote {len(df)} examples to {args.out}")


if __name__ == "__main__":
    main()
