"""Experiment pipeline for PromptLeakDetector."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Dict, Iterable

import numpy as np
import pandas as pd

from .detector import PromptLeakDetector
from .metrics import binary_metrics, summarize_by_group
from .synthetic_data import generate_dataset


@dataclass
class ExperimentConfig:
    n_examples: int = 1200
    seed: int = 7
    threshold: float = 0.45
    train_split: float = 0.60
    validation_split: float = 0.20
    test_split: float = 0.20
    leak_probability_adversarial: float = 0.68
    leak_probability_benign: float = 0.02
    threshold_sweep_start: float = 0.05
    threshold_sweep_stop: float = 0.95
    threshold_sweep_steps: int = 19

    @classmethod
    def from_json(cls, path: str) -> "ExperimentConfig":
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return cls(**data)

    def to_dict(self) -> Dict[str, float]:
        return dict(self.__dict__)


def run_detector(df: pd.DataFrame, threshold: float) -> pd.DataFrame:
    detector = PromptLeakDetector(threshold=threshold)
    rows = []
    for _, row in df.iterrows():
        result = detector.detect(
            output=row["output"],
            hidden_prompt=row["hidden_prompt"],
            private_context=row["private_context"],
            policy_text=row.get("policy_text", ""),
            tool_names=row.get("tool_names", ""),
            threshold=threshold,
        )
        feature_row = {
            "example_id": row["example_id"],
            "score": result.score,
            "predicted_leak": int(result.is_leak),
            "blocked": int(result.is_leak),
            "reasons": result.reasons,
        }
        feature_row.update(result.feature_scores)
        rows.append(feature_row)
    decisions = pd.DataFrame(rows)
    return df.merge(decisions, on="example_id", how="left")


def threshold_sweep(df: pd.DataFrame, thresholds: Iterable[float]) -> pd.DataFrame:
    rows = []
    detector = PromptLeakDetector()
    score_cache = []
    for _, row in df.iterrows():
        features = detector.score_output(
            output=row["output"],
            hidden_prompt=row["hidden_prompt"],
            private_context=row["private_context"],
            policy_text=row.get("policy_text", ""),
            tool_names=row.get("tool_names", ""),
        )
        score_cache.append(features["score"])
    labels = df["leak_label"].astype(int).tolist()
    for threshold in thresholds:
        preds = [1 if score >= threshold else 0 for score in score_cache]
        m = binary_metrics(labels, preds)
        m["threshold"] = threshold
        rows.append(m)
    return pd.DataFrame(rows)


def select_threshold(validation_sweep: pd.DataFrame) -> float:
    ranked = validation_sweep.sort_values(
        ["f1", "false_positive_rate", "recall"], ascending=[False, True, False]
    )
    return float(ranked.iloc[0]["threshold"])


def leakage_reduction(decisions: pd.DataFrame) -> pd.DataFrame:
    leak_df = decisions[decisions["leak_label"] == 1].copy()
    rows = []
    for leak_type, group in leak_df.groupby("leak_type"):
        baseline_leaks = len(group)
        remaining_leaks = int(((group["blocked"] == 0) & (group["leak_label"] == 1)).sum())
        blocked_leaks = int(((group["blocked"] == 1) & (group["leak_label"] == 1)).sum())
        reduction = blocked_leaks / baseline_leaks if baseline_leaks else 0.0
        rows.append(
            {
                "leak_type": leak_type,
                "baseline_leaks": baseline_leaks,
                "blocked_leaks": blocked_leaks,
                "remaining_leaks": remaining_leaks,
                "leakage_reduction": reduction,
            }
        )
    rows.append(
        {
            "leak_type": "overall",
            "baseline_leaks": len(leak_df),
            "blocked_leaks": int(((leak_df["blocked"] == 1) & (leak_df["leak_label"] == 1)).sum()),
            "remaining_leaks": int(((leak_df["blocked"] == 0) & (leak_df["leak_label"] == 1)).sum()),
            "leakage_reduction": int(((leak_df["blocked"] == 1) & (leak_df["leak_label"] == 1)).sum()) / max(1, len(leak_df)),
        }
    )
    return pd.DataFrame(rows)


def false_positive_by_benign_category(decisions: pd.DataFrame) -> pd.DataFrame:
    benign = decisions[decisions["leak_label"] == 0].copy()
    rows = []
    for category, group in benign.groupby("benign_category"):
        fpr = float(group["predicted_leak"].mean()) if len(group) else 0.0
        rows.append({"benign_category": category, "n": len(group), "false_positive_rate": fpr})
    rows.append(
        {
            "benign_category": "overall",
            "n": len(benign),
            "false_positive_rate": float(benign["predicted_leak"].mean()) if len(benign) else 0.0,
        }
    )
    return pd.DataFrame(rows)


def run_experiment(config: ExperimentConfig, out_dir: str) -> Dict[str, str]:
    os.makedirs(out_dir, exist_ok=True)
    dataset = generate_dataset(
        n_examples=config.n_examples,
        seed=config.seed,
        train_split=config.train_split,
        validation_split=config.validation_split,
        leak_probability_adversarial=config.leak_probability_adversarial,
        leak_probability_benign=config.leak_probability_benign,
    )
    dataset_path = os.path.join(out_dir, "synthetic_dataset.csv")
    dataset.to_csv(dataset_path, index=False)

    thresholds = np.linspace(
        config.threshold_sweep_start,
        config.threshold_sweep_stop,
        config.threshold_sweep_steps,
    )
    validation_df = dataset[dataset["split"] == "validation"]
    test_df = dataset[dataset["split"] == "test"]
    validation_sweep = threshold_sweep(validation_df, thresholds)
    selected_threshold = config.threshold if config.threshold is not None else select_threshold(validation_sweep)

    decisions_all = run_detector(dataset, threshold=selected_threshold)
    decisions_test = decisions_all[decisions_all["split"] == "test"].copy()
    test_sweep = threshold_sweep(test_df, thresholds)

    metrics_rows = []
    for split, split_df in decisions_all.groupby("split"):
        m = binary_metrics(split_df["leak_label"], split_df["predicted_leak"])
        m["split"] = split
        m["threshold"] = selected_threshold
        metrics_rows.append(m)
    metrics_summary = pd.DataFrame(metrics_rows)

    by_query_type = summarize_by_group(decisions_test, "query_type")
    by_leak_type = summarize_by_group(decisions_test, "leak_type")
    fpr_benign = false_positive_by_benign_category(decisions_test)
    leak_reduction = leakage_reduction(decisions_test)

    paths = {
        "dataset": dataset_path,
        "decisions": os.path.join(out_dir, "firewall_decisions.csv"),
        "threshold_sweep": os.path.join(out_dir, "threshold_sweep.csv"),
        "validation_threshold_sweep": os.path.join(out_dir, "validation_threshold_sweep.csv"),
        "metrics_summary": os.path.join(out_dir, "metrics_summary.csv"),
        "metrics_by_query_type": os.path.join(out_dir, "metrics_by_query_type.csv"),
        "metrics_by_leak_type": os.path.join(out_dir, "metrics_by_leak_type.csv"),
        "false_positive_by_benign_category": os.path.join(out_dir, "false_positive_by_benign_category.csv"),
        "leakage_reduction": os.path.join(out_dir, "leakage_reduction.csv"),
        "selected_config": os.path.join(out_dir, "selected_config.json"),
    }
    decisions_all.to_csv(paths["decisions"], index=False)
    test_sweep.to_csv(paths["threshold_sweep"], index=False)
    validation_sweep.to_csv(paths["validation_threshold_sweep"], index=False)
    metrics_summary.to_csv(paths["metrics_summary"], index=False)
    by_query_type.to_csv(paths["metrics_by_query_type"], index=False)
    by_leak_type.to_csv(paths["metrics_by_leak_type"], index=False)
    fpr_benign.to_csv(paths["false_positive_by_benign_category"], index=False)
    leak_reduction.to_csv(paths["leakage_reduction"], index=False)

    selected = config.to_dict()
    selected["selected_threshold"] = selected_threshold
    with open(paths["selected_config"], "w", encoding="utf-8") as f:
        json.dump(selected, f, indent=2)
    return paths
