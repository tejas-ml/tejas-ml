#!/usr/bin/env python3
"""Install the FairDRAM scheduler into a Ramulator 2.x source tree."""
from __future__ import annotations

import argparse
from pathlib import Path
import shutil
import subprocess
import sys


SCHED_REL = Path("src/dram_controller/impl/scheduler/fairdram_scheduler.cpp")
CMAKE_REL = Path("src/dram_controller/CMakeLists.txt")


def patch_cmake(cmake_path: Path) -> bool:
    text = cmake_path.read_text()
    needle = "impl/scheduler/fairdram_scheduler.cpp"
    if needle in text:
        return False
    anchor = "impl/scheduler/generic_scheduler.cpp"
    if anchor not in text:
        raise RuntimeError(f"Could not find CMake anchor: {anchor}")
    text = text.replace(anchor, f"{anchor}\n  {needle}")
    cmake_path.write_text(text)
    return True


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("ramulator2_root", type=Path, help="Path to cloned CMU-SAFARI/ramulator2")
    parser.add_argument("--build", action="store_true", help="Run cmake/make after patching")
    parser.add_argument("--jobs", type=int, default=8, help="Parallel build jobs")
    args = parser.parse_args()

    root = args.ramulator2_root.resolve()
    if not (root / "src" / "dram_controller").exists():
        raise SystemExit(f"Not a Ramulator2 root: {root}")

    src = Path(__file__).resolve().with_name("fairdram_scheduler.cpp")
    dst = root / SCHED_REL
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)
    changed = patch_cmake(root / CMAKE_REL)

    print(f"Installed {dst}")
    print("Patched CMakeLists.txt" if changed else "CMakeLists.txt already patched")

    if args.build:
        build = root / "build"
        build.mkdir(exist_ok=True)
        subprocess.run(["cmake", ".."], cwd=build, check=True)
        subprocess.run(["make", f"-j{args.jobs}"], cwd=build, check=True)
        exe = build / "ramulator2"
        if exe.exists():
            shutil.copy2(exe, root / "ramulator2")
            print(f"Built executable: {root / 'ramulator2'}")
        else:
            print("Build finished, but build/ramulator2 was not found.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
