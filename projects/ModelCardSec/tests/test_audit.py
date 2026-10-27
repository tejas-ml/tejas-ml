from sklearn.datasets import load_iris
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from modelcardsec.audit import audit_model


def test_audit_model_runs():
    data = load_iris()
    X_train, X_test, y_train, y_test = train_test_split(
        data.data, data.target, random_state=7, stratify=data.target
    )
    model = Pipeline([("scale", StandardScaler()), ("clf", LogisticRegression(max_iter=500))])
    model.fit(X_train, y_train)
    audit = audit_model(
        model,
        X_train,
        y_train,
        X_test,
        y_test,
        model_name="logreg",
        dataset_name="iris",
        feature_names=list(data.feature_names),
    )
    assert audit.aggregate_risk >= 0
    assert "robustness" in audit.scanner_results
