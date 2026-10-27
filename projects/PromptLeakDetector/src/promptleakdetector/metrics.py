"""Metric helpers for PromptLeakDetector experiments."""

from __future__ import annotations

from typing import Dict

import pandas as pd


def binary_metrics(y_true, y_pred) -> Dict[str, float]:
    y_true = list(map(int, y_true))
    y_pred = list(map(int, y_pred))
    tp = sum(1 for y, p in zip(y_true, y_pred) if y == 1 and p == 1)
    tn = sum(1 for y, p in zip(y_true, y_pred) if y == 0 and p == 0)
    fp = sum(1 for y, p in zip(y_true, y_pred) if y == 0 and p == 1)
    fn = sum(1 for y, p in zip(y_true, y_pred) if y == 1 and p == 0)
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    accuracy = (tp + tn) / max(1, len(y_true))
    fpr = fp / (fp + tn) if fp + tn else 0.0
    fnr = fn / (fn + tp) if fn + tp else 0.0
    return {
        "n": len(y_true),
        "tp": tp,
        "tn": tn,
        "fp": fp,
        "fn": fn,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "accuracy": accuracy,
        "false_positive_rate": fpr,
        "false_negative_rate": fnr,
    }


def summarize_by_group(df: pd.DataFrame, group_col: str) -> pd.DataFrame:
    rows = []
    for group, g in df.groupby(group_col):
        m = binary_metrics(g["leak_label"], g["predicted_leak"])
        m[group_col] = group
        rows.append(m)
    return pd.DataFrame(rows)
