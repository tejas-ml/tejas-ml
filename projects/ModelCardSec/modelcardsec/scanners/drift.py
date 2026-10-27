from __future__ import annotations

import numpy as np

from modelcardsec.metrics import clamp_score, population_stability_index
from modelcardsec.risk import ScannerResult


def scan_drift(X_reference, X_candidate, feature_names: list[str] | None = None) -> ScannerResult:
    X_reference = np.asarray(X_reference, dtype=float)
    X_candidate = np.asarray(X_candidate, dtype=float)
    if X_reference.ndim != 2 or X_candidate.ndim != 2:
        return ScannerResult(
            name="drift",
            risk_score=0.0,
            status="not_applicable",
            findings=["Drift scanner expects two 2D tabular matrices."],
            recommendations=["Provide reference and candidate deployment feature matrices."],
        )
    if X_reference.shape[1] != X_candidate.shape[1]:
        raise ValueError("Reference and candidate matrices must have the same number of features.")
    feature_names = feature_names or [f"feature_{i}" for i in range(X_reference.shape[1])]
    psi_by_feature = {}
    for idx, name in enumerate(feature_names):
        psi_by_feature[name] = population_stability_index(X_reference[:, idx], X_candidate[:, idx])
    max_psi = max(psi_by_feature.values()) if psi_by_feature else 0.0
    mean_psi = float(np.mean(list(psi_by_feature.values()))) if psi_by_feature else 0.0
    risk_score = clamp_score(max_psi * 200.0)
    top_features = sorted(psi_by_feature.items(), key=lambda item: item[1], reverse=True)[:5]
    findings = [
        f"Maximum feature PSI: {max_psi:.3f}.",
        f"Mean feature PSI: {mean_psi:.3f}.",
        "Top drifted features: " + ", ".join([f"{k}={v:.3f}" for k, v in top_features]),
    ]
    recommendations = []
    if max_psi >= 0.25:
        recommendations.append("Treat this as a large drift signal; retrain or add monitoring before deployment.")
    elif max_psi >= 0.10:
        recommendations.append("Review moderate drift and evaluate model performance on the shifted slice.")
    else:
        recommendations.append("Keep drift thresholds tied to deployment-specific business and safety impact.")
    return ScannerResult(
        name="drift",
        risk_score=risk_score,
        metrics={"max_psi": float(max_psi), "mean_psi": mean_psi, "psi_by_feature": psi_by_feature},
        findings=findings,
        recommendations=recommendations,
    )
