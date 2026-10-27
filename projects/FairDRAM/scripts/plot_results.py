#!/usr/bin/env python3
"""Create the paper-style main figure and result panels."""
from __future__ import annotations

import argparse
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


METRICS = [
    ("cpu_slowdown", "Panel A: CPU slowdown\n(lower is better)", "Slowdown vs. CPU-alone"),
    ("ai_throughput_loss_pct", "Panel B: Accelerator throughput loss\n(lower is better)", "Throughput loss (%)"),
    ("jain_fairness", "Panel C: Fairness\n(higher is better)", "Jain fairness"),
]

SCHED_COLORS = {
    "FRFCFS": "#6B7280",
    "FairDRAM": "#2563EB",
}


def metric_filename(metric: str) -> str:
    if metric == "cpu_slowdown":
        return "figure1"
    if metric == "ai_throughput_loss_pct":
        return "figure2"
    if metric == "jain_fairness":
        return "figure3"
    return metric


def grouped_bar(ax, df: pd.DataFrame, metric: str, title: str, ylabel: str) -> None:
    scheds = list(df["scheduler"].drop_duplicates())
    mixes = list(df["mix"].drop_duplicates())
    width = 0.8 / max(1, len(scheds))
    x = list(range(len(mixes)))
    for i, sched in enumerate(scheds):
        vals = []
        for mix in mixes:
            sub = df[(df["mix"] == mix) & (df["scheduler"] == sched)]
            vals.append(float(sub[metric].iloc[0]) if not sub.empty else 0.0)
        pos = [v - 0.4 + width / 2 + i * width for v in x]
        ax.bar(pos, vals, width=width, label=sched, color=SCHED_COLORS.get(sched))
    ax.set_xticks(x)
    ax.set_xticklabels(mixes, rotation=30, ha="right")
    ax.set_title(title)
    ax.set_ylabel(ylabel)
    ax.grid(axis="y", alpha=0.25, linestyle="--")
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)


def plot_single_metric(summary: Path, out: Path, metric: str, title: str, ylabel: str) -> None:
    df = pd.read_csv(summary)
    fig, ax = plt.subplots(figsize=(7.8, 4.8), constrained_layout=True)
    grouped_bar(ax, df, metric, title, ylabel)
    ax.legend(loc="best", frameon=False)
    stem = metric_filename(metric)
    fig.savefig(out / f"{stem}.png", dpi=250)
    fig.savefig(out / f"{stem}.pdf")
    legacy_stems = {
        "figure1": "panel_a_cpu_slowdown",
        "figure2": "panel_b_ai_throughput_loss",
        "figure3": "panel_c_fairness",
    }
    legacy = legacy_stems.get(stem)
    if legacy is not None:
        fig.savefig(out / f"{legacy}.png", dpi=250)
        fig.savefig(out / f"{legacy}.pdf")
    plt.close(fig)


def plot_panels(summary: Path, out: Path) -> None:
    df = pd.read_csv(summary)
    plt.style.use("seaborn-v0_8-whitegrid")
    fig, axes = plt.subplots(1, 3, figsize=(15, 4.8), constrained_layout=True)
    for ax, (metric, title, ylabel) in zip(axes, METRICS):
        grouped_bar(ax, df, metric, title, ylabel)
    axes[0].legend(loc="best")
    fig.suptitle("FairDRAM: QoS-aware scheduling for CPU-AI co-execution", fontsize=14)
    fig.savefig(out / "result_panels.png", dpi=250)
    fig.savefig(out / "result_panels.pdf")
    plt.close(fig)
    for metric, title, ylabel in METRICS:
        plot_single_metric(summary, out, metric, title, ylabel)


def plot_main_figure(out: Path) -> None:
    plt.style.use("seaborn-v0_8-whitegrid")
    fig, ax = plt.subplots(figsize=(10, 5.4), constrained_layout=True)
    ax.set_axis_off()

    boxes = {
        "cpu": (0.05, 0.62, 0.20, 0.18, "Latency-sensitive\nCPU cores\nsource_id = 0"),
        "ai": (0.05, 0.20, 0.20, 0.18, "AI accelerator /\nstreaming core\nsource_id = 1"),
        "queue": (0.36, 0.39, 0.22, 0.24, "Read / write\nrequest queues"),
        "sched": (0.66, 0.39, 0.27, 0.24, "FairDRAM scheduler\n1. ready command\n2. urgent CPU tail\n3. row locality\n4. FCFS"),
        "dram": (0.66, 0.08, 0.27, 0.17, "DDR4 DRAM\nchannel, ranks, banks"),
    }
    for x, y, w, h, text in boxes.values():
        rect = plt.Rectangle((x, y), w, h, fill=False, linewidth=1.6)
        ax.add_patch(rect)
        ax.text(x + w / 2, y + h / 2, text, ha="center", va="center", fontsize=11)

    def arrow(src, dst, label=""):
        sx, sy, sw, sh, _ = boxes[src]
        dx, dy, dw, dh, _ = boxes[dst]
        start = (sx + sw, sy + sh / 2)
        end = (dx, dy + dh / 2)
        ax.annotate("", xy=end, xytext=start, arrowprops={"arrowstyle": "->", "lw": 1.6})
        if label:
            ax.text((start[0] + end[0]) / 2, (start[1] + end[1]) / 2 + 0.04, label, ha="center", fontsize=9)

    arrow("cpu", "queue", "sparse latency-critical requests")
    arrow("ai", "queue", "bandwidth-flooding requests")
    arrow("queue", "sched", "classify + rank")
    ax.annotate("", xy=(0.795, 0.25), xytext=(0.795, 0.39), arrowprops={"arrowstyle": "->", "lw": 1.6})
    ax.text(0.83, 0.31, "DRAM commands", ha="left", fontsize=9)
    ax.text(0.5, 0.93, "Main Figure: CPU + AI share one DRAM controller", ha="center", fontsize=15, weight="bold")
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    fig.savefig(out / "main_figure.png", dpi=250)
    fig.savefig(out / "main_figure.pdf")
    plt.close(fig)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--summary", type=Path, default=Path("results/summary.csv"))
    parser.add_argument("--out", type=Path, default=Path("figures"))
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    plot_main_figure(args.out)
    plot_panels(args.summary, args.out)
    print(f"Wrote figures to {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
