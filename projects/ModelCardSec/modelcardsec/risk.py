from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import numpy as np


DEFAULT_WEIGHTS = {
    "robustness": 0.22,
    "membership": 0.20,
    "calibration": 0.14,
    "pii": 0.16,
    "unsafe_outputs": 0.14,
    "drift": 0.14,
}


@dataclass
class ScannerResult:
    name: str
    risk_score: float
    status: str = "ok"
    metrics: dict[str, Any] = field(default_factory=dict)
    findings: list[str] = field(default_factory=list)
    recommendations: list[str] = field(default_factory=list)


@dataclass
class ModelAudit:
    model_name: str
    dataset_name: str
    aggregate_risk: float
    attack_success_proxy: float
    scanner_results: dict[str, ScannerResult]
    metadata: dict[str, Any] = field(default_factory=dict)


def aggregate_risk(scanner_results: dict[str, ScannerResult], weights: dict[str, float] | None = None) -> float:
    weights = weights or DEFAULT_WEIGHTS
    total_weight = 0.0
    weighted_score = 0.0
    for key, result in scanner_results.items():
        if result.status == "not_applicable":
            continue
        weight = weights.get(key, 0.0)
        total_weight += weight
        weighted_score += weight * result.risk_score
    if total_weight <= 0:
        return 0.0
    return float(np.round(weighted_score / total_weight, 2))


def risk_band(score: float) -> str:
    if score >= 70:
        return "High"
    if score >= 40:
        return "Medium"
    return "Low"


def model_audit_to_record(audit: ModelAudit) -> dict[str, Any]:
    record: dict[str, Any] = {
        "model": audit.model_name,
        "dataset": audit.dataset_name,
        "aggregate_risk": audit.aggregate_risk,
        "risk_band": risk_band(audit.aggregate_risk),
        "attack_success_proxy": audit.attack_success_proxy,
    }
    for key, result in audit.scanner_results.items():
        record[f"{key}_risk"] = result.risk_score
        record[f"{key}_status"] = result.status
    return record
