from __future__ import annotations

import time
from pathlib import Path
from typing import Iterable

import joblib
import numpy as np
import pandas as pd
import yaml
from sklearn.datasets import load_breast_cancer, load_iris, load_wine
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier

from modelcardsec.risk import ModelAudit, aggregate_risk
from modelcardsec.scanners import (
    scan_calibration,
    scan_drift,
    scan_membership_inference,
    scan_pii_leakage,
    scan_robustness,
    scan_unsafe_outputs,
)


def _load_builtin_dataset(name: str):
    name = name.lower()
    if name == "breast_cancer":
        bunch = load_breast_cancer()
    elif name == "iris":
        bunch = load_iris()
    elif name == "wine":
        bunch = load_wine()
    else:
        raise ValueError(f"Unsupported built-in dataset: {name}")
    return bunch.data, bunch.target, list(bunch.feature_names), name


def load_dataset_from_config(config: dict):
    data_config = config.get("dataset", {})
    if data_config.get("path"):
        path = Path(data_config["path"])
        target = data_config.get("target")
        if not target:
            raise ValueError("CSV dataset config requires dataset.target")
        frame = pd.read_csv(path)
        y = frame[target].to_numpy()
        X = frame.drop(columns=[target]).select_dtypes(include=[np.number]).to_numpy()
        feature_names = list(frame.drop(columns=[target]).select_dtypes(include=[np.number]).columns)
        return X, y, feature_names, path.stem
    return _load_builtin_dataset(data_config.get("name", "breast_cancer"))


def build_model(kind: str, random_state: int = 7):
    kind = kind.lower()
    if kind in {"logistic_regression", "logreg"}:
        return Pipeline([
            ("scale", StandardScaler()),
            ("clf", LogisticRegression(max_iter=2000, random_state=random_state)),
        ])
    if kind in {"random_forest", "rf"}:
        return RandomForestClassifier(n_estimators=120, min_samples_leaf=2, random_state=random_state)
    if kind in {"decision_tree", "tree"}:
        return DecisionTreeClassifier(max_depth=None, random_state=random_state)
    raise ValueError(f"Unsupported model kind: {kind}")


def audit_model(
    model,
    X_train,
    y_train,
    X_test,
    y_test,
    *,
    model_name: str,
    dataset_name: str,
    feature_names: list[str] | None = None,
    training_texts: Iterable[str] | None = None,
    output_texts: Iterable[str] | None = None,
    drift_candidate=None,
    random_state: int = 7,
) -> ModelAudit:
    start = time.perf_counter()
    drift_candidate = X_test if drift_candidate is None else drift_candidate
    scanner_results = {
        "robustness": scan_robustness(model, X_test, y_test, random_state=random_state),
        "membership": scan_membership_inference(model, X_train, X_test),
        "calibration": scan_calibration(model, X_test, y_test),
        "pii": scan_pii_leakage(training_texts=training_texts, output_texts=output_texts),
        "unsafe_outputs": scan_unsafe_outputs(output_texts=output_texts),
        "drift": scan_drift(X_train, drift_candidate, feature_names=feature_names),
    }
    agg = aggregate_risk(scanner_results)
    robustness_flip = scanner_results["robustness"].metrics.get("flip_rate", 0.0)
    membership_adv = scanner_results["membership"].metrics.get("membership_advantage", 0.0)
    attack_success_proxy = float(np.round(max(robustness_flip, membership_adv), 4))
    runtime = time.perf_counter() - start
    return ModelAudit(
        model_name=model_name,
        dataset_name=dataset_name,
        aggregate_risk=agg,
        attack_success_proxy=attack_success_proxy,
        scanner_results=scanner_results,
        metadata={"runtime_seconds": runtime},
    )


def run_from_config(config_path: str | Path, out_dir: str | Path | None = None) -> list[ModelAudit]:
    from modelcardsec.reporting import write_all_reports

    config_path = Path(config_path)
    config = yaml.safe_load(config_path.read_text(encoding="utf-8"))
    random_state = int(config.get("random_state", 7))
    X, y, feature_names, dataset_name = load_dataset_from_config(config)
    test_size = float(config.get("test_size", 0.30))
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, stratify=y, random_state=random_state
    )
    training_texts = config.get("training_texts", [])
    output_texts = config.get("output_texts", [])
    model_configs = config.get("models", [{"name": "logistic_regression"}, {"name": "random_forest"}])
    audits: list[ModelAudit] = []
    model_dir = Path(out_dir or config.get("out_dir", "reports/config_run")) / "models"
    model_dir.mkdir(parents=True, exist_ok=True)
    for item in model_configs:
        kind = item.get("name", "logistic_regression")
        display_name = item.get("display_name", kind)
        model = build_model(kind, random_state=random_state)
        model.fit(X_train, y_train)
        joblib.dump(model, model_dir / f"{display_name.replace(' ', '_').lower()}.joblib")
        audits.append(
            audit_model(
                model,
                X_train,
                y_train,
                X_test,
                y_test,
                model_name=display_name,
                dataset_name=dataset_name,
                feature_names=feature_names,
                training_texts=training_texts,
                output_texts=output_texts,
                random_state=random_state,
            )
        )
    write_all_reports(audits, Path(out_dir or config.get("out_dir", "reports/config_run")))
    return audits
