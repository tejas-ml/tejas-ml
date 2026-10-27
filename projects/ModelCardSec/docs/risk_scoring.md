# Risk scoring notes

ModelCardSec normalizes each scanner to a 0-100 risk score.

| Scanner | Default score intuition |
|---|---|
| Robustness | Prediction flip rate plus accuracy drop under perturbation |
| Membership | Confidence-based train/test separability advantage |
| Calibration | Expected calibration error scaled to risk |
| PII | Count of PII-like patterns in samples and outputs |
| Unsafe outputs | Share of outputs with unsafe keyword/policy hits |
| Drift | Maximum population stability index across features |

The aggregate score is a weighted mean over applicable scanners. Scanners marked `not_applicable` are excluded from the denominator.

These thresholds are research defaults. A production deployment should calibrate thresholds to the system's impact level, threat model, and governance requirements.
