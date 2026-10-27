# Figure captions

**Figure 1: PromptLeakDetector architecture.** An LLM application combines a user query with hidden system/developer instructions, private retrieval context, and internal tool metadata. PromptLeakDetector runs after generation as a runtime output firewall. It scores the output using hidden-context overlap, secret/PII regexes, internal tool indicators, and policy-leakage phrases. Outputs below threshold are released; outputs above threshold are blocked.

**Figure 2: Leak detection performance.** Precision, recall, and F1 score across output-blocking thresholds on the synthetic test split. The detector maintains high precision at moderate thresholds while recall decreases when the detector is made more conservative.

**Figure 3: False positive rate on benign responses.** False positive rate for non-leaking output categories. Benign examples containing fake secret placeholders are intentionally included as hard negatives.

**Figure 4: Leakage reduction.** Fraction of leaking outputs blocked by PromptLeakDetector for each leakage category. Paraphrased system-prompt and policy leaks are harder than direct secret or private-context repetition.
