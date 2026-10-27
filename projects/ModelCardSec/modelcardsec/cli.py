from __future__ import annotations

import argparse
from pathlib import Path

from modelcardsec.audit import run_from_config
from modelcardsec.demo import run_demo


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generate automated ML security model cards.")
    sub = parser.add_subparsers(dest="command", required=True)

    demo = sub.add_parser("demo", help="Run the built-in reproducible demo.")
    demo.add_argument("--out", default="reports/demo", help="Output directory for reports and figures.")
    demo.add_argument("--random-state", type=int, default=7)

    audit = sub.add_parser("audit", help="Run an audit from a YAML config.")
    audit.add_argument("--config", required=True, help="Path to YAML config.")
    audit.add_argument("--out", default=None, help="Output directory override.")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.command == "demo":
        run_demo(Path(args.out), random_state=args.random_state)
        print(f"ModelCardSec demo written to {args.out}")
        return 0
    if args.command == "audit":
        run_from_config(args.config, out_dir=args.out)
        print(f"ModelCardSec audit written to {args.out or 'configured output directory'}")
        return 0
    parser.error("Unknown command")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
