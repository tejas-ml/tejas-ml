from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from jinja2 import Environment, PackageLoader, select_autoescape
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from reportlab.lib import colors

from modelcardsec.risk import ModelAudit, model_audit_to_record, risk_band


def audits_to_dataframe(audits: Iterable[ModelAudit]) -> pd.DataFrame:
    return pd.DataFrame([model_audit_to_record(audit) for audit in audits])


def write_json(audits: list[ModelAudit], out_dir: Path) -> Path:
    serializable = []
    for audit in audits:
        serializable.append({
            "model_name": audit.model_name,
            "dataset_name": audit.dataset_name,
            "aggregate_risk": audit.aggregate_risk,
            "attack_success_proxy": audit.attack_success_proxy,
            "metadata": audit.metadata,
            "scanner_results": {
                key: {
                    "name": result.name,
                    "risk_score": result.risk_score,
                    "status": result.status,
                    "metrics": result.metrics,
                    "findings": result.findings,
                    "recommendations": result.recommendations,
                }
                for key, result in audit.scanner_results.items()
            },
        })
    path = out_dir / "modelcardsec_results.json"
    path.write_text(json.dumps(serializable, indent=2), encoding="utf-8")
    return path


def write_markdown_report(audits: list[ModelAudit], out_dir: Path) -> Path:
    df = audits_to_dataframe(audits)
    lines = [
        "# ModelCardSec Security Model Card",
        "",
        f"Generated: {datetime.now(timezone.utc).isoformat()}",
        "",
        "## Executive summary",
        "",
        "This report summarizes automated security and privacy checks for candidate machine-learning models.",
        "Scores are normalized from 0 to 100, where higher means more deployment risk.",
        "",
        df.to_markdown(index=False),
        "",
        "## Scanner details",
        "",
    ]
    for audit in audits:
        lines.extend([
            f"### {audit.model_name}",
            "",
            f"Aggregate risk: **{audit.aggregate_risk:.2f} ({risk_band(audit.aggregate_risk)})**",
            "",
        ])
        for key, result in audit.scanner_results.items():
            lines.extend([
                f"#### {key.replace('_', ' ').title()}",
                f"Risk score: {result.risk_score:.2f}; status: {result.status}",
                "",
                "Findings:",
            ])
            lines.extend([f"- {item}" for item in result.findings])
            lines.append("")
            lines.append("Recommendations:")
            lines.extend([f"- {item}" for item in result.recommendations])
            lines.append("")
    path = out_dir / "modelcardsec_report.md"
    path.write_text("\n".join(lines), encoding="utf-8")
    return path


def write_html_report(audits: list[ModelAudit], out_dir: Path) -> Path:
    env = Environment(loader=PackageLoader("modelcardsec", "templates"), autoescape=select_autoescape())
    template = env.get_template("report.html.j2")
    df = audits_to_dataframe(audits)
    html = template.render(
        generated_at=datetime.now(timezone.utc).isoformat(),
        audits=audits,
        summary_table=df.to_html(index=False, classes="summary-table", float_format=lambda x: f"{x:.3f}"),
        risk_band=risk_band,
    )
    path = out_dir / "modelcardsec_report.html"
    path.write_text(html, encoding="utf-8")
    return path


def write_pdf_report(audits: list[ModelAudit], out_dir: Path) -> Path:
    path = out_dir / "modelcardsec_report.pdf"
    doc = SimpleDocTemplate(str(path), pagesize=letter)
    styles = getSampleStyleSheet()
    story = [Paragraph("ModelCardSec Security Model Card", styles["Title"]), Spacer(1, 12)]
    story.append(Paragraph(f"Generated: {datetime.now(timezone.utc).isoformat()}", styles["Normal"]))
    story.append(Spacer(1, 12))
    df = audits_to_dataframe(audits)
    cols = ["model", "aggregate_risk", "risk_band", "attack_success_proxy"]
    table_data = [cols] + [[str(row[col]) for col in cols] for _, row in df.iterrows()]
    table = Table(table_data, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.extend([table, Spacer(1, 14)])
    for audit in audits:
        story.append(Paragraph(f"{audit.model_name}: aggregate risk {audit.aggregate_risk:.2f} ({risk_band(audit.aggregate_risk)})", styles["Heading2"]))
        for key, result in audit.scanner_results.items():
            story.append(Paragraph(f"{key.replace('_', ' ').title()} - risk {result.risk_score:.2f}, status {result.status}", styles["Heading3"]))
            for finding in result.findings[:3]:
                story.append(Paragraph(f"Finding: {finding}", styles["BodyText"]))
            for recommendation in result.recommendations[:2]:
                story.append(Paragraph(f"Recommendation: {recommendation}", styles["BodyText"]))
            story.append(Spacer(1, 6))
    doc.build(story)
    return path


def write_figures(audits: list[ModelAudit], out_dir: Path) -> dict[str, Path]:
    df = audits_to_dataframe(audits)
    paths: dict[str, Path] = {}

    plt.figure(figsize=(7, 4))
    plt.bar(df["model"], df["aggregate_risk"])
    plt.ylabel("Aggregate risk score")
    plt.ylim(0, 100)
    plt.title("Panel A: Risk scores across models")
    plt.xticks(rotation=20, ha="right")
    plt.tight_layout()
    path = out_dir / "panel_a_risk_scores.png"
    plt.savefig(path, dpi=220)
    plt.close()
    paths["panel_a"] = path

    automated_minutes = sum(a.metadata.get("runtime_seconds", 0.0) for a in audits) / 60.0
    manual_minutes = len(audits) * 45.0
    plt.figure(figsize=(5.5, 4))
    plt.bar(["Automated", "Manual checklist"], [automated_minutes, manual_minutes])
    plt.ylabel("Audit time (minutes)")
    plt.title("Panel B: Time saved vs manual audit")
    plt.tight_layout()
    path = out_dir / "panel_b_time_saved.png"
    plt.savefig(path, dpi=220)
    plt.close()
    paths["panel_b"] = path

    plt.figure(figsize=(5.5, 4))
    plt.scatter(df["aggregate_risk"], df["attack_success_proxy"])
    for _, row in df.iterrows():
        plt.annotate(row["model"], (row["aggregate_risk"], row["attack_success_proxy"]), textcoords="offset points", xytext=(4, 4))
    if len(df) > 1:
        coeff = np.polyfit(df["aggregate_risk"], df["attack_success_proxy"], deg=1)
        xs = np.linspace(df["aggregate_risk"].min(), df["aggregate_risk"].max(), 100)
        plt.plot(xs, coeff[0] * xs + coeff[1])
    plt.xlabel("Aggregate risk score")
    plt.ylabel("Attack success proxy")
    plt.title("Panel C: Risk score vs attack success")
    plt.tight_layout()
    path = out_dir / "panel_c_risk_vs_attack.png"
    plt.savefig(path, dpi=220)
    plt.close()
    paths["panel_c"] = path
    return paths


def write_all_reports(audits: list[ModelAudit], out_dir: str | Path) -> dict[str, Path]:
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    df = audits_to_dataframe(audits)
    csv_path = out_dir / "metrics_summary.csv"
    df.to_csv(csv_path, index=False)
    paths = {
        "csv": csv_path,
        "json": write_json(audits, out_dir),
        "markdown": write_markdown_report(audits, out_dir),
        "html": write_html_report(audits, out_dir),
        "pdf": write_pdf_report(audits, out_dir),
    }
    paths.update(write_figures(audits, out_dir))
    return paths
