import numpy as np

from modelcardsec.metrics import expected_calibration_error, population_stability_index, safe_roc_auc


def test_expected_calibration_error_range():
    y = np.array([0, 1, 1, 0])
    p = np.array([[0.8, 0.2], [0.2, 0.8], [0.4, 0.6], [0.6, 0.4]])
    metrics = expected_calibration_error(y, p, n_bins=4)
    assert 0 <= metrics.ece <= 1
    assert metrics.brier is not None


def test_safe_roc_auc_single_class_returns_random():
    assert safe_roc_auc([1, 1, 1], [0.1, 0.2, 0.3]) == 0.5


def test_population_stability_index_nonnegative():
    rng = np.random.default_rng(7)
    a = rng.normal(size=200)
    b = rng.normal(loc=0.5, size=200)
    assert population_stability_index(a, b) >= 0
