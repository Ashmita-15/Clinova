#!/usr/bin/env python3
"""Patch XGBoost OpenMP on macOS without Homebrew libomp.

The xgboost 2.1.x wheel for Intel Mac links against @rpath/libomp.dylib with
LC_RPATH set to /usr/local/opt/libomp/lib (Homebrew). On macOS 12, installing
libomp via Homebrew often forces a source build. scikit-learn already ships a
compatible libomp in sklearn/.dylibs; this script copies it beside libxgboost
and adds @loader_path so the loader can find it.
"""
from __future__ import annotations

import platform
import shutil
import subprocess
import sys
from pathlib import Path


def _run(cmd: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, capture_output=True, text=True, check=False)


def main() -> int:
    if platform.system() != "Darwin":
        print("fix_libomp: not macOS, nothing to do")
        return 0

    try:
        import sklearn
        import xgboost
    except ImportError as exc:
        print(f"fix_libomp: install scikit-learn and xgboost first ({exc})")
        return 1

    xgb_lib = Path(xgboost.__file__).resolve().parent / "lib" / "libxgboost.dylib"
    sklearn_omp = Path(sklearn.__file__).resolve().parent / ".dylibs" / "libomp.dylib"
    target_omp = xgb_lib.parent / "libomp.dylib"

    if not xgb_lib.is_file():
        print(f"fix_libomp: missing {xgb_lib}")
        return 1
    if not sklearn_omp.is_file():
        print(f"fix_libomp: missing {sklearn_omp}")
        return 1

    if not target_omp.exists() or target_omp.stat().st_mtime < sklearn_omp.stat().st_mtime:
        shutil.copy2(sklearn_omp, target_omp)
        print(f"fix_libomp: installed {target_omp}")

    otool = _run(["otool", "-l", str(xgb_lib)])
    if otool.returncode != 0:
        print(otool.stderr.strip())
        return otool.returncode

    if "@loader_path" not in otool.stdout:
        patch = _run(["install_name_tool", "-add_rpath", "@loader_path", str(xgb_lib)])
        if patch.returncode != 0 and "would duplicate" not in patch.stderr.lower():
            print(patch.stderr.strip() or patch.stdout.strip())
            return patch.returncode
        print("fix_libomp: added @loader_path rpath to libxgboost.dylib")

    verify = subprocess.run(
        [sys.executable, "-c", "import xgboost; print(xgboost.__version__)"],
        capture_output=True,
        text=True,
        check=False,
    )
    if verify.returncode != 0:
        print(verify.stderr.strip())
        return verify.returncode

    print(f"fix_libomp: xgboost {verify.stdout.strip()} loads successfully")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
