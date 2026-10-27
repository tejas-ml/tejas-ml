from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

import numpy as np
from sklearn.metrics import brier_score_loss, roc_auc_score


@dataclass
class CalibrationMetrics:
    ece: float
    brier: float | None


def _as_numpy(values) -> np.ndarray:
    return np.asarray(values)


def expected_calibration_error(y_true, probas, n_bins: int = 15) -> CalibrationMetrics:
    """Compute multiclass ECE from predicted probabilities.

    ECE is the weighted average absolute gap between confidence and accuracy
    over confidence bins. This implementation supports binary and multiclass
    classifiers that expose `predict_proba`.
    """
    y_true = _as_numpy(y_true)
    probas = _as_numpy(probas)
    if probas.ndim == 1:
        probas = np.vstack([1.0 - probas, probas]).T

    confidences = np.max(probas, axis=1)
    predictions = np.argmax(probas, axis=1)
    accuracies = predictions == y_true

    bin_edges = np.linspace(0.0, 1.0, n_bins + 1)
    ece = 0.0
    for lower, upper in zip(bin_edges[:-1], bin_edges[1:]):
        in_bin = (confidences > lower) & (confidences <= upper)
        if not np.any(in_bin):
            continue
        bin_accuracy = np.mean(accuracies[in_bin])
        bin_confidence = np.mean(confidences[in_bin])
        ece += np.mean(in_bin) * abs(bin_accuracy - bin_confidence)

    brier = None
    labels = np.unique(y_true)
    if len(labels) == 2:
        positive = labels.max()
        if probas.shape[1] == 2:
            brier = float(brier_score_loss((y_true == positive).astype(int), probas[:, 1]))

    return CalibrationMetrics(ece=float(ece), brier=brier)


def safe_roc_auc(labels: Iterable[int], scores: Iterable[float]) -> float:
    """Return ROC-AUC when both classes are present; otherwise return 0.5."""
    labels = np.asarray(list(labels))
    scores = np.asarray(list(scores))
    if len(np.unique(labels)) < 2:
        return 0.5
    try:
        return float(roc_auc_score(labels, scores))
    except ValueError:
        return 0.5


def population_stability_index(expected, actual, bins: int = 10) -> float:
    """Compute PSI for one continuous feature.

    A value under 0.1 is usually treated as small drift, 0.1-0.25 as moderate,
    and above 0.25 as large drift. Thresholds are heuristics and should be
    tuned per deployment context.
    """
    expected = np.asarray(expected, dtype=float)
    actual = np.asarray(actual, dtype=float)
    quantiles = np.linspace(0, 1, bins + 1)
    breakpoints = np.unique(np.quantile(expected, quantiles))
    if len(breakpoints) < 3:
        breakpoints = np.linspace(min(expected.min(), actual.min()), max(expected.max(), actual.max()), bins + 1)
    expected_counts, _ = np.histogram(expected, bins=breakpoints)
    actual_counts, _ = np.histogram(actual, bins=breakpoints)
    expected_pct = np.clip(expected_counts / max(1, expected_counts.sum()), 1e-6, None)
    actual_pct = np.clip(actual_counts / max(1, actual_counts.sum()), 1e-6, None)
    return float(np.sum((actual_pct - expected_pct) * np.log(actual_pct / expected_pct)))


def clamp_score(value: float) -> float:
    """Clamp a risk score to the [0, 100] interval."""
    if np.isnan(value) or np.isinf(value):
        return 0.0
    return float(max(0.0, min(100.0, value)))
