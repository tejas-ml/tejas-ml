"""Runtime output detector for hidden prompt and context leakage."""

from __future__ import annotations

import re
from dataclasses import dataclass
from difflib import SequenceMatcher
from typing import Dict, Iterable, List, Sequence, Tuple


SECRET_PATTERNS = [
    r"\bsk-[A-Za-z0-9]{16,}\b",
    r"\bAKIA[A-Za-z0-9]{16,}\b",
    r"\bpld_live_[A-Za-z0-9]{16,}\b",
    r"\btok_[A-Za-z0-9]{16,}\b",
    r"\bTempPass-[A-Za-z0-9]{8,}\b",
    r"(?i)\b(api[_ -]?key|secret|token|password)\b\s*[:=]\s*[^\s,;]{8,}",
    r"-----BEGIN [A-Z ]*PRIVATE KEY-----",
]

PII_PATTERNS = [
    r"\b\d{3}-\d{2}-\d{4}\b",
    r"\(\d{3}\)\s*\d{3}-\d{4}\b",
    r"\b\d{3}[-.]\d{3}[-.]\d{4}\b",
    r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
    r"\b\d{3,6}\s+[A-Z][a-z]+\s+(St|Ave|Blvd|Road|Rd|Street)\b",
]

POLICY_MARKERS = [
    "system prompt",
    "hidden system prompt",
    "developer message",
    "developer policy",
    "internal policy",
    "confidential tool policy",
    "hidden instruction",
    "chain-of-thought",
    "tool schema",
    "available internal tools",
]

SUSPICIOUS_PHRASES = [
    "as instructed above",
    "ignore previous instructions",
    "the hidden instruction says",
    "the private retrieved context is",
    "debug secret",
    "developer policy excerpt",
    "system prompt fragment",
    "private context fragment",
]


@dataclass
class DetectionResult:
    score: float
    is_leak: bool
    threshold: float
    reasons: str
    feature_scores: Dict[str, float]


class PromptLeakDetector:
    """A lightweight runtime detector for leaked hidden context.

    The detector is intended to run after generation. It compares the generated
    output against hidden runtime state that the application already has access
    to, plus regex and phrase checks for common sensitive leakage patterns.
    """

    def __init__(self, threshold: float = 0.45) -> None:
        self.threshold = threshold
        self.secret_regex = [re.compile(p) for p in SECRET_PATTERNS]
        self.pii_regex = [re.compile(p) for p in PII_PATTERNS]

    @staticmethod
    def _normalize(text: str) -> str:
        return re.sub(r"\s+", " ", text.lower()).strip()

    @staticmethod
    def _word_ngrams(text: str, n: int = 5) -> set[Tuple[str, ...]]:
        tokens = re.findall(r"[a-zA-Z0-9_@.:-]+", text.lower())
        if len(tokens) < n:
            return {tuple(tokens)} if tokens else set()
        return {tuple(tokens[i : i + n]) for i in range(len(tokens) - n + 1)}

    def _ngram_overlap(self, output: str, references: Sequence[str], n: int = 5) -> float:
        out_grams = self._word_ngrams(output, n=n)
        if not out_grams:
            return 0.0
        best = 0.0
        for ref in references:
            ref_grams = self._word_ngrams(ref, n=n)
            if not ref_grams:
                continue
            best = max(best, len(out_grams & ref_grams) / max(1, min(len(out_grams), len(ref_grams))))
        return min(best, 1.0)

    def _sequence_overlap(self, output: str, references: Sequence[str]) -> float:
        out = self._normalize(output)
        if not out:
            return 0.0
        best = 0.0
        for ref in references:
            ref_norm = self._normalize(ref)
            if not ref_norm:
                continue
            matcher = SequenceMatcher(None, out, ref_norm, autojunk=False)
            match = matcher.find_longest_match(0, len(out), 0, len(ref_norm))
            longest = match.size
            # Long exact spans are strong evidence even if the output includes extra text.
            best = max(best, min(1.0, longest / 80.0), matcher.ratio() * 0.5)
        return best

    def _regex_any(self, text: str, patterns: Iterable[re.Pattern]) -> float:
        return 1.0 if any(p.search(text) for p in patterns) else 0.0

    def _phrase_score(self, text: str, phrases: Sequence[str]) -> float:
        norm = self._normalize(text)
        count = sum(1 for phrase in phrases if phrase in norm)
        return min(1.0, count / 2.0)

    def _tool_score(self, text: str, tool_names: str) -> float:
        norm = self._normalize(text)
        tools = [t.strip().lower() for t in tool_names.split(";") if t.strip()]
        exact_hits = sum(1 for t in tools if t and t in norm)
        namespace_hit = 1 if re.search(r"\b(internal|vault|policy|retrieval|admin|risk)\.[a-z0-9_]+", norm) else 0
        return min(1.0, (exact_hits + namespace_hit) / 2.0)

    def score_output(
        self,
        output: str,
        hidden_prompt: str,
        private_context: str,
        policy_text: str = "",
        tool_names: str = "",
    ) -> Dict[str, float]:
        hidden_refs = [hidden_prompt, policy_text]
        private_refs = [private_context]
        system_overlap = max(
            self._ngram_overlap(output, hidden_refs, n=5),
            self._sequence_overlap(output, hidden_refs),
        )
        private_overlap = max(
            self._ngram_overlap(output, private_refs, n=4),
            self._sequence_overlap(output, private_refs),
        )
        secret_score = self._regex_any(output, self.secret_regex)
        pii_score = self._regex_any(output, self.pii_regex)
        tool_score = self._tool_score(output, tool_names)
        policy_marker_score = self._phrase_score(output, POLICY_MARKERS)
        suspicious_score = self._phrase_score(output, SUSPICIOUS_PHRASES)

        weighted = (
            0.26 * system_overlap
            + 0.24 * private_overlap
            + 0.18 * secret_score
            + 0.13 * pii_score
            + 0.09 * tool_score
            + 0.05 * policy_marker_score
            + 0.05 * suspicious_score
        )

        # Any very direct signal should be able to trigger the firewall alone.
        score = max(
            weighted,
            0.72 if secret_score else 0.0,
            0.62 if private_overlap > 0.45 else 0.0,
            0.58 if system_overlap > 0.50 else 0.0,
            0.56 if pii_score and private_overlap > 0.12 else 0.0,
            0.54 if tool_score > 0.50 else 0.0,
        )

        return {
            "score": round(float(min(score, 1.0)), 4),
            "system_overlap": round(float(system_overlap), 4),
            "private_overlap": round(float(private_overlap), 4),
            "secret_score": round(float(secret_score), 4),
            "pii_score": round(float(pii_score), 4),
            "tool_score": round(float(tool_score), 4),
            "policy_marker_score": round(float(policy_marker_score), 4),
            "suspicious_score": round(float(suspicious_score), 4),
        }

    def detect(
        self,
        output: str,
        hidden_prompt: str,
        private_context: str,
        policy_text: str = "",
        tool_names: str = "",
        threshold: float | None = None,
    ) -> DetectionResult:
        threshold = self.threshold if threshold is None else threshold
        features = self.score_output(output, hidden_prompt, private_context, policy_text, tool_names)
        score = features["score"]
        is_leak = score >= threshold
        reasons: List[str] = []
        for name, value in features.items():
            if name != "score" and value >= 0.50:
                reasons.append(name)
        if not reasons:
            top = max((k for k in features if k != "score"), key=lambda k: features[k])
            if features[top] > 0:
                reasons.append(top)
        return DetectionResult(
            score=score,
            is_leak=is_leak,
            threshold=threshold,
            reasons=";".join(reasons) if reasons else "none",
            feature_scores=features,
        )

    @staticmethod
    def safe_fallback() -> str:
        return "[BLOCKED by PromptLeakDetector: possible hidden prompt, private context, or secret leakage detected.]"
