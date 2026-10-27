# Manual audit checklist baseline

Use this checklist as the baseline for comparing ModelCardSec against a manual audit.
The demo estimates 45 minutes per model for a human to collect, run, and document these checks.
Adjust this estimate for your study participants or class project environment.

## Model and dataset metadata

- Dataset name, source, license, and intended use
- Model architecture or estimator type
- Training/test split procedure
- Known sensitive features or protected attributes
- Known deployment constraints

## Security and privacy checks

1. Robustness to input perturbations
2. Membership-inference exposure
3. Probability calibration
4. PII patterns in training data and generated outputs
5. Unsafe outputs or unsafe tool/action suggestions
6. Covariate drift between training and deployment samples

## Required evidence

- Metric values
- Risk threshold used
- Finding statement
- Recommendation or mitigation
- Reproducibility command
- Code version and config version
