from __future__ import annotations

import numpy as np
from sklearn.metrics import accuracy_score

from modelcardsec.metrics import clamp_score
from modelcardsec.risk import ScannerResult


def scan_robustness(model, X_test, y_test, noise_scale: float = 0.25, random_state: int = 7) -> ScannerResult:
    """Estimate sensitivity to adversarial-style random feature perturbations.

    The scanner uses Gaussian perturbations scaled by each feature's empirical
    standard deviation. This is intentionally lightweight so it runs in a demo;
    replace it with PGD/FGSM/domain attacks for serious red-team use.
    """
    X_test = np.asarray(X_test, dtype=float)
    y_test = np.asarray(y_test)
    rng = np.random.default_rng(random_state)

    baseline_pred = model.predict(X_test)
    baseline_acc = accuracy_score(y_test, baseline_pred)
    std = np.std(X_test, axis=0)
    std = np.where(std == 0, 1.0, std)
    perturbation = rng.normal(0.0, noise_scale, size=X_test.shape) * std
    X_noisy = X_test + perturbation
    noisy_pred = model.predict(X_noisy)
    noisy_acc = accuracy_score(y_test, noisy_pred)
    flip_rate = float(np.mean(baseline_pred != noisy_pred))
    accuracy_drop = float(max(0.0, baseline_acc - noisy_acc))

    # Large prediction instability and large accuracy drops are deployment risks.
    risk_score = clamp_score((flip_rate * 70.0) + (accuracy_drop * 200.0))
    findings = [
        f"Baseline accuracy: {baseline_acc:.3f}.",
        f"Noisy-input accuracy: {noisy_acc:.3f}.",
        f"Prediction flip rate under perturbation: {flip_rate:.3f}.",
    ]
    recommendations = []
    if risk_score >= 40:
        recommendations.append("Add robustness evaluation with domain-specific perturbations before deployment.")
        recommendations.append("Consider adversarial training, input validation, or abstention for high-uncertainty regions.")
    else:
        recommendations.append("Keep robustness checks in continuous evaluation as the data distribution changes.")

    return ScannerResult(
        name="robustness",
        risk_score=risk_score,
        metrics={
            "baseline_accuracy": float(baseline_acc),
            "noisy_accuracy": float(noisy_acc),
            "accuracy_drop": accuracy_drop,
            "flip_rate": flip_rate,
        },
        findings=findings,
        recommendations=recommendations,
    )
