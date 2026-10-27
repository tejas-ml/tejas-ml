#!/usr/bin/env python3
"""Collect paper figures as figure1..N.png and result tables as table1..N.csv.

Output goes to a single folder so every paper asset lives together.
"""

import argparse
import os
import shutil

# Source figure -> figureN.png (figure1 is the architecture/main figure).
FIGURE_SOURCES = [
    ("main.png", "figure1.png"),
    ("figure2_detection_f1.png", "figure2.png"),
    ("figure3_false_positive_rate.png", "figure3.png"),
    ("figure4_leakage_reduction.png", "figure4.png"),
]

# Result CSV -> tableN.csv. Order defines table numbering.
TABLE_SOURCES = [
    "metrics_summary.csv",
    "metrics_by_leak_type.csv",
    "metrics_by_query_type.csv",
    "false_positive_by_benign_category.csv",
    "leakage_reduction.csv",
]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--run", default="runs/example", help="Run directory with CSVs + figures/")
    parser.add_argument("--out", default="results", help="Destination folder for all assets")
    args = parser.parse_args()

    fig_src_dir = os.path.join(args.run, "figures")
    os.makedirs(args.out, exist_ok=True)

    for src, dst in FIGURE_SOURCES:
        dst_path = os.path.join(args.out, dst)
        shutil.copyfile(os.path.join(fig_src_dir, src), dst_path)
        print(f"figure: {dst_path}")

    for i, csv_name in enumerate(TABLE_SOURCES, start=1):
        dst_path = os.path.join(args.out, f"table{i}.csv")
        shutil.copyfile(os.path.join(args.run, csv_name), dst_path)
        print(f"table:  {dst_path}")


if __name__ == "__main__":
    main()
