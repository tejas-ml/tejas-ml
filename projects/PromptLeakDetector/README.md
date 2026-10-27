# PromptLeakDetector

**Runtime Detection of System Prompt and Context Leakage in LLM Applications**

PromptLeakDetector is a small, runnable research prototype for studying whether a lightweight runtime detector can identify LLM outputs that leak hidden system prompts, private context, PII, internal tool names, API keys, or policy text.

![PromptLeakDetector architecture](headline.png)

The repository is designed to support a short paper with one main architecture figure and three result panels:

- **Main figure:** LLM app with hidden prompt/private context -> output -> PromptLeakDetector -> safe or blocked response.
- **Panel A:** Leak detection F1 across thresholds.
- **Panel B:** False positive rate on benign responses.
- **Panel C:** Leakage reduction after adding the detector.

## Repository layout

```text
PromptLeakDetector/
  README.md
  requirements.txt
  run_all.py
  configs/run_config.json
  src/promptleakdetector/
    __init__.py
    synthetic_data.py
    detector.py
    metrics.py
    experiment.py
    plotting.py
  scripts/
    generate_dataset.py
    run_experiment.py
    make_figures.py
  paper_assets/
    main.txt
  runs/
    example/                 # created after running the pipeline
```

## Quick start

```bash
cd PromptLeakDetector
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run_all.py --config configs/run_config.json --out runs/example
```

After running, the key outputs are:

```text
runs/example/synthetic_dataset.csv
runs/example/firewall_decisions.csv
runs/example/threshold_sweep.csv
runs/example/metrics_summary.csv
runs/example/figures/main.png
runs/example/figures/figure2_detection_f1.png
runs/example/figures/figure3_false_positive_rate.png
runs/example/figures/figure4_leakage_reduction.png
```

## What the experiment does

1. Creates synthetic LLM applications with hidden system prompts, private documents, internal tool names, policy fragments, PII, and generated secrets.
2. Creates benign and adversarial user queries.
3. Simulates model outputs, including benign answers, safe refusals, and several leak classes.
4. Runs PromptLeakDetector over each output.
5. Sweeps the detector threshold and reports precision, recall, F1, accuracy, and false positive rate.
6. Applies the detector as a runtime firewall and estimates leakage reduction.
7. Generates all paper-ready figures.

## Method summary

PromptLeakDetector is a hybrid detector. It uses runtime access to the hidden application context and scores an output using:

- fuzzy overlap with hidden system prompt fragments,
- fuzzy overlap with private context fragments,
- regex matches for API keys, tokens, passwords, SSH/private-key fragments, and cloud-style credentials,
- regex matches for PII patterns such as SSNs, phone numbers, and emails,
- internal tool namespace matches,
- policy/system prompt leakage markers,
- suspicious phrases such as `as instructed above`, `hidden instructions`, or `developer message`.

The detector is intentionally simple so the experiment is easy to reproduce and the paper can focus on the privacy/security signal.

## Re-running with different sizes

```bash
python run_all.py --n 2000 --seed 42 --threshold 0.45 --out runs/large_seed42
```

Useful flags:

- `--n`: number of synthetic responses to create.
- `--seed`: random seed.
- `--threshold`: runtime block threshold.
- `--out`: output directory.

## Figure mapping for a paper

- `main.png`: system architecture.
- `figure2_detection_f1.png`: Panel A, threshold sweep F1.
- `figure3_false_positive_rate.png`: Panel B, false positive rate on benign response types.
- `figure4_leakage_reduction.png`: Panel C, leak reduction by leakage category.

## Notes and limitations

This is a synthetic benchmark. It is useful for prototyping the experimental pipeline, producing figures, and demonstrating the detector idea. For a stronger paper, add real outputs from multiple LLMs, paraphrased leakage attacks, and human-reviewed leak labels.
