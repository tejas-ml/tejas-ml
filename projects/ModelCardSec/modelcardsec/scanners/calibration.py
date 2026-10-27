from __future__ import annotations

from modelcardsec.metrics import clamp_score, expected_calibration_error
from modelcardsec.risk import ScannerResult


def scan_calibration(model, X_test, y_test, n_bins: int = 15) -> ScannerResult:
    if not hasattr(model, "predict_proba"):
        return ScannerResult(
            name="calibration",
            risk_score=0.0,
            status="not_applicable",
            findings=["Model does not expose predict_proba; calibration scanner skipped."],
            recommendations=["Expose calibrated probabilities if downstream systems use confidence scores."],
        )
    probas = model.predict_proba(X_test)
    metrics = expected_calibration_error(y_test, probas, n_bins=n_bins)
    risk_score = clamp_score(metrics.ece * 250.0)
    findings = [f"Expected calibration error: {metrics.ece:.3f}."]
    if metrics.brier is not None:
        findings.append(f"Brier score: {metrics.brier:.3f}.")
    recommendations = []
    if risk_score >= 40:
        recommendations.append("Calibrate the model with Platt scaling, isotonic regression, or temperature scaling.")
        recommendations.append("Avoid using raw confidence as a security decision threshold until calibrated.")
    else:
        recommendations.append("Keep calibration in release gates, especially after retraining or data drift.")

    return ScannerResult(
        name="calibration",
        risk_score=risk_score,
        metrics={"ece": metrics.ece, "brier": metrics.brier},
        findings=findings,
        recommendations=recommendations,
    )
