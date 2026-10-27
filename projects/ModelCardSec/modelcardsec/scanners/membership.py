from __future__ import annotations

import numpy as np

from modelcardsec.metrics import clamp_score, safe_roc_auc
from modelcardsec.risk import ScannerResult


def _confidence_scores(model, X) -> np.ndarray:
    if hasattr(model, "predict_proba"):
        probas = model.predict_proba(X)
        return np.max(probas, axis=1)
    if hasattr(model, "decision_function"):
        scores = np.asarray(model.decision_function(X))
        if scores.ndim > 1:
            scores = np.max(scores, axis=1)
        return 1.0 / (1.0 + np.exp(-scores))
    preds = model.predict(X)
    return np.ones(len(preds)) * 0.5


def scan_membership_inference(model, X_train, X_test) -> ScannerResult:
    """Run a simple confidence-threshold membership-inference proxy.

    The attack scores examples by model confidence and evaluates how well those
    scores separate training examples from held-out examples. This is not a
    full shadow-model attack; it is a fast canary for overconfidence leakage.
    """
    train_conf = _confidence_scores(model, X_train)
    test_conf = _confidence_scores(model, X_test)
    labels = np.r_[np.ones(len(train_conf)), np.zeros(len(test_conf))]
    scores = np.r_[train_conf, test_conf]
    auc = safe_roc_auc(labels, scores)
    advantage = abs(auc - 0.5) * 2.0
    gap = float(np.mean(train_conf) - np.mean(test_conf))
    risk_score = clamp_score(advantage * 100.0)

    findings = [
        f"Confidence-based membership AUC: {auc:.3f}.",
        f"Membership advantage proxy: {advantage:.3f}.",
        f"Train-test mean confidence gap: {gap:.3f}.",
    ]
    recommendations = []
    if risk_score >= 40:
        recommendations.append("Investigate overfitting and confidence leakage with stronger membership-inference attacks.")
        recommendations.append("Consider regularization, confidence clipping, privacy-preserving training, or output limiting.")
    else:
        recommendations.append("Continue tracking confidence gaps for each model release.")

    return ScannerResult(
        name="membership",
        risk_score=risk_score,
        metrics={
            "membership_auc": float(auc),
            "membership_advantage": float(advantage),
            "train_confidence_mean": float(np.mean(train_conf)),
            "test_confidence_mean": float(np.mean(test_conf)),
            "confidence_gap": gap,
        },
        findings=findings,
        recommendations=recommendations,
    )
