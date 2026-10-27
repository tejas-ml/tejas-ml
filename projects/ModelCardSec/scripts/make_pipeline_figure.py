from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch


def add_box(ax, xy, text, width=1.75, height=0.7):
    box = FancyBboxPatch(
        xy,
        width,
        height,
        boxstyle="round,pad=0.04,rounding_size=0.06",
        linewidth=1.4,
        edgecolor="black",
        facecolor="white",
    )
    ax.add_patch(box)
    ax.text(xy[0] + width / 2, xy[1] + height / 2, text, ha="center", va="center", fontsize=10)


def add_arrow(ax, start, end):
    arrow = FancyArrowPatch(start, end, arrowstyle="-|>", mutation_scale=14, linewidth=1.3, color="black")
    ax.add_patch(arrow)


def make_pipeline_figure(path: str | Path):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fig, ax = plt.subplots(figsize=(10, 3.4))
    ax.set_axis_off()
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 3.2)

    add_box(ax, (0.25, 1.35), "Model\n+ Dataset")
    add_arrow(ax, (2.0, 1.7), (2.55, 1.7))

    add_box(ax, (2.65, 1.35), "Security\nScanner", width=1.7)
    scanner_labels = ["Robustness", "Membership", "Calibration", "PII", "Unsafe", "Drift"]
    for i, label in enumerate(scanner_labels):
        ax.text(3.5, 1.08 - i * 0.18, label, ha="center", va="center", fontsize=7)

    add_arrow(ax, (4.35, 1.7), (4.95, 1.7))
    add_box(ax, (5.05, 1.35), "Risk Metrics\n0-100 Scores")
    add_arrow(ax, (6.8, 1.7), (7.35, 1.7))
    add_box(ax, (7.45, 1.35), "Security\nModel Card", width=1.95)

    ax.text(1.12, 2.55, "Inputs", ha="center", fontsize=11, fontweight="bold")
    ax.text(3.50, 2.55, "Automated tests", ha="center", fontsize=11, fontweight="bold")
    ax.text(5.93, 2.55, "Evidence", ha="center", fontsize=11, fontweight="bold")
    ax.text(8.43, 2.55, "Report", ha="center", fontsize=11, fontweight="bold")

    ax.text(5.0, 0.20, "ModelCardSec generates Markdown, HTML, PDF, CSV/JSON metrics, and paper-ready result panels.",
            ha="center", fontsize=9)
    fig.tight_layout()
    fig.savefig(path, dpi=240, bbox_inches="tight")
    plt.close(fig)


if __name__ == "__main__":
    make_pipeline_figure("paper/figures/main_pipeline.png")
