"""Figure generation for PromptLeakDetector."""

from __future__ import annotations

import os
from typing import Dict

import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch
import pandas as pd


def _save(fig, path: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    fig.savefig(path, dpi=300, bbox_inches="tight")
    plt.close(fig)


def make_main_figure(path: str) -> None:
    fig, ax = plt.subplots(figsize=(12, 5.8))
    ax.set_axis_off()
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 6)

    def box(x, y, w, h, title, subtitle=""):
        patch = FancyBboxPatch(
            (x, y), w, h,
            boxstyle="round,pad=0.04,rounding_size=0.15",
            linewidth=1.6,
            edgecolor="black",
            facecolor="white",
        )
        ax.add_patch(patch)
        ax.text(x + w / 2, y + h * 0.62, title, ha="center", va="center", fontsize=12, fontweight="bold")
        if subtitle:
            ax.text(x + w / 2, y + h * 0.30, subtitle, ha="center", va="center", fontsize=9)

    def arrow(x1, y1, x2, y2):
        ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2), arrowstyle="-|>", mutation_scale=16, linewidth=1.5))

    # Inputs to the LLM app.
    box(0.55, 4.15, 2.15, 0.80, "User query", "benign or adversarial")
    box(0.55, 3.05, 2.15, 0.80, "Hidden prompt", "system/developer rules")
    box(0.55, 1.95, 2.15, 0.80, "Private context", "retrieved docs + PII")
    box(0.55, 0.85, 2.15, 0.80, "Internal tools", "names + schemas")

    # Runtime pipeline.
    box(4.05, 2.25, 1.95, 1.10, "LLM app", "generates output")
    box(6.95, 2.02, 2.35, 1.55, "PromptLeakDetector", "overlap + regex +\npolicy/tool signals")
    box(10.25, 3.35, 1.05, 0.80, "Safe", "release")
    box(10.25, 1.45, 1.05, 0.80, "Leak", "block")

    arrow(2.70, 4.55, 4.05, 3.16)
    arrow(2.70, 3.45, 4.05, 3.03)
    arrow(2.70, 2.35, 4.05, 2.80)
    arrow(2.70, 1.25, 4.05, 2.45)
    arrow(6.00, 2.80, 6.95, 2.80)
    arrow(9.30, 3.12, 10.25, 3.75)
    arrow(9.30, 2.47, 10.25, 1.85)

    ax.text(4.55, 4.55, "Hidden state is never\nintended for the user", fontsize=11, ha="center")
    ax.text(8.10, 4.55, "Runtime firewall checks output\nbefore release", fontsize=11, ha="center")
    ax.text(6.00, 0.30, "Goal: reduce system prompt, secret, PII, policy, tool-name, and private-context leakage", fontsize=11, ha="center")
    ax.set_title("PromptLeakDetector: Runtime Output Firewall for LLM Applications", fontsize=15, fontweight="bold", pad=12)
    _save(fig, path)


def plot_f1_threshold(threshold_sweep_csv: str, path: str) -> None:
    df = pd.read_csv(threshold_sweep_csv)
    best = df.sort_values("f1", ascending=False).iloc[0]
    fig, ax = plt.subplots(figsize=(7, 4.2))
    ax.plot(df["threshold"], df["f1"], marker="o", label="F1")
    ax.plot(df["threshold"], df["precision"], marker="s", linestyle="--", label="Precision")
    ax.plot(df["threshold"], df["recall"], marker="^", linestyle=":", label="Recall")
    ax.axvline(best["threshold"], linestyle="--", linewidth=1)
    ax.text(best["threshold"], max(df["f1"]) * 0.82, f"best F1={best['f1']:.2f}\nthreshold={best['threshold']:.2f}", fontsize=9)
    ax.set_xlabel("Detector threshold")
    ax.set_ylabel("Score")
    ax.set_ylim(0, 1.05)
    ax.set_title("Panel A: Leak detection performance")
    ax.grid(True, alpha=0.25)
    ax.legend(frameon=False)
    _save(fig, path)


def plot_false_positive_rate(fpr_csv: str, path: str) -> None:
    df = pd.read_csv(fpr_csv)
    df = df[df["benign_category"] != "overall"].copy()
    df = df.sort_values("false_positive_rate", ascending=False)
    labels = [x.replace("_", " ") for x in df["benign_category"]]
    fig, ax = plt.subplots(figsize=(7, 4.2))
    ax.bar(labels, df["false_positive_rate"])
    ax.set_ylabel("False positive rate")
    ax.set_ylim(0, max(0.12, float(df["false_positive_rate"].max()) + 0.05) if len(df) else 0.12)
    ax.set_title("Panel B: False positives on non-leaking outputs")
    ax.grid(axis="y", alpha=0.25)
    ax.tick_params(axis="x", rotation=20)
    for i, value in enumerate(df["false_positive_rate"]):
        ax.text(i, value + 0.005, f"{value:.2%}", ha="center", va="bottom", fontsize=9)
    _save(fig, path)


def plot_leakage_reduction(reduction_csv: str, path: str) -> None:
    df = pd.read_csv(reduction_csv)
    df = df[df["leak_type"] != "overall"].copy()
    order = ["system_prompt", "private_context", "secret", "pii", "tool_name", "policy_text", "mixed"]
    df["sort_order"] = df["leak_type"].apply(lambda x: order.index(x) if x in order else 999)
    df = df.sort_values("sort_order")
    labels = [x.replace("_", " ") for x in df["leak_type"]]
    fig, ax = plt.subplots(figsize=(8, 4.2))
    ax.bar(labels, df["leakage_reduction"])
    ax.set_ylabel("Leakage reduction")
    ax.set_ylim(0, 1.05)
    ax.set_title("Panel C: Leakage reduction after runtime detector")
    ax.grid(axis="y", alpha=0.25)
    ax.tick_params(axis="x", rotation=25)
    for i, value in enumerate(df["leakage_reduction"]):
        ax.text(i, min(1.0, value + 0.03), f"{value:.0%}", ha="center", va="bottom", fontsize=9)
    _save(fig, path)


def make_all_figures(out_dir: str) -> Dict[str, str]:
    fig_dir = os.path.join(out_dir, "figures")
    os.makedirs(fig_dir, exist_ok=True)
    paths = {
        "main": os.path.join(fig_dir, "main.png"),
        "f1": os.path.join(fig_dir, "figure2_detection_f1.png"),
        "fpr": os.path.join(fig_dir, "figure3_false_positive_rate.png"),
        "reduction": os.path.join(fig_dir, "figure4_leakage_reduction.png"),
    }
    make_main_figure(paths["main"])
    plot_f1_threshold(os.path.join(out_dir, "threshold_sweep.csv"), paths["f1"])
    plot_false_positive_rate(os.path.join(out_dir, "false_positive_by_benign_category.csv"), paths["fpr"])
    plot_leakage_reduction(os.path.join(out_dir, "leakage_reduction.csv"), paths["reduction"])
    return paths
