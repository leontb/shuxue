#!/usr/bin/env python3
"""Copy the self-contained starter to an empty folder and build its index.html."""
import argparse
from pathlib import Path
import shutil
import subprocess
import sys


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', required=True, type=Path, help='New or empty lesson directory.')
    args = parser.parse_args()
    source = Path(__file__).resolve().parents[1] / 'assets'
    target = args.out.expanduser().resolve()
    if not source.is_dir():
        parser.error('The bundled assets directory is missing.')
    if target == source or source in target.parents:
        parser.error('Choose a destination outside assets.')
    if target.exists() and (not target.is_dir() or any(target.iterdir())):
        parser.error('Destination must be a new or empty directory; existing work will not be overwritten.')
    shutil.copytree(source, target, dirs_exist_ok=True, ignore=shutil.ignore_patterns('__pycache__', '*.pyc', 'index.html'))
    subprocess.run([sys.executable, str(target / 'build.py')], check=True)
    print('Edit lesson.js for the new problem; then rerun build.py.')


if __name__ == '__main__':
    main()
