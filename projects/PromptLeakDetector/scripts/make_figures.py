#!/usr/bin/env python3
"""Create paper figures from PromptLeakDetector experiment outputs."""

import argparse
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from promptleakdetector.plotting import make_all_figures


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="runs/example")
    args = parser.parse_args()
    paths = make_all_figures(args.out)
    for key, value in paths.items():
        print(f"{key}: {value}")


if __name__ == "__main__":
    main()
