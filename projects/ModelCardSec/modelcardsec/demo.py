from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier

from modelcardsec.audit import audit_model
from modelcardsec.reporting import write_all_reports


def run_demo(out_dir: str | Path = "reports/demo", random_state: int = 7):
    """Run a complete ModelCardSec demo on built-in scikit-learn data."""
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    dataset = load_breast_cancer()
    X_train, X_test, y_train, y_test = train_test_split(
        dataset.data,
        dataset.target,
        test_size=0.30,
        stratify=dataset.target,
        random_state=random_state,
    )

    # Create a lightly shifted deployment candidate to make drift visible.
    rng = np.random.default_rng(random_state)
    X_deploy = X_test.copy()
    shift_columns = [0, 2, 3]
    X_deploy[:, shift_columns] = X_deploy[:, shift_columns] * rng.normal(1.08, 0.02, size=(X_deploy.shape[0], len(shift_columns)))

    models = {
        "Logistic Regression": Pipeline([
            ("scale", StandardScaler()),
            ("clf", LogisticRegression(max_iter=2000, random_state=random_state)),
        ]),
        "Random Forest": RandomForestClassifier(n_estimators=150, min_samples_leaf=2, random_state=random_state),
        "Decision Tree": DecisionTreeClassifier(random_state=random_state),
    }

    sample_training_texts = [
        "support ticket: patient contact jane.doe@example.com asked for model deletion",
        "benign note without direct personal identifiers",
        "legacy row contained phone 407-555-0182 and should be redacted",
    ]
    sample_outputs = [
        "The prediction is low risk and no private data is needed.",
        "I found an api_key in the logs: do not expose it to users.",
        "Contact jane.doe@example.com for details.",
    ]

    audits = []
    model_dir = out_dir / "models"
    model_dir.mkdir(exist_ok=True)
    for name, model in models.items():
        model.fit(X_train, y_train)
        joblib.dump(model, model_dir / f"{name.lower().replace(' ', '_')}.joblib")
        audits.append(
            audit_model(
                model,
                X_train,
                y_train,
                X_test,
                y_test,
                model_name=name,
                dataset_name="breast_cancer",
                feature_names=list(dataset.feature_names),
                training_texts=sample_training_texts,
                output_texts=sample_outputs,
                drift_candidate=X_deploy,
                random_state=random_state,
            )
        )

    write_all_reports(audits, out_dir)
    return audits
