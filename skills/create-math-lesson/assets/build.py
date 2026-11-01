#!/usr/bin/env python3
"""Build the lesson next to this script, using only Python's standard library."""
from __future__ import annotations
import argparse
import re
from pathlib import Path


def build(output: Path | None = None) -> Path:
    source = Path(__file__).resolve().parent
    target = (output or source / 'index.html').resolve()
    shell = (source / 'shell.html').read_text(encoding='utf-8')
    css = (source / 'style.css').read_text(encoding='utf-8')
    if '</style' in css.lower():
        raise ValueError('An inline stylesheet must not contain a closing style tag.')
    scripts = []
    for name in ('controller.js', 'lesson.js', 'engine.js', 'download.js'):
        content = (source / name).read_text(encoding='utf-8')
        dangerous = re.search(r'<\s*/\s*(script|body|html|head)\b', content, re.I)
        if dangerous:
            raise ValueError(f'{name}: literal closing {dangerous.group(1).lower()} tag inside JavaScript is unsafe for embedding or host rewriting; use DOM serialization or split the tag sequence.')
        scripts.append('<script data-offline="script">\n' + content + '\n</script>')
    for marker in ('{{CSS}}', '{{SCRIPTS}}'):
        if shell.count(marker) != 1:
            raise ValueError(f'shell.html must contain {marker} exactly once.')
    html = shell.replace('{{CSS}}', css).replace('{{SCRIPTS}}', '\n'.join(scripts))
    if target in [source / name for name in ('shell.html', 'style.css', 'controller.js', 'lesson.js', 'engine.js', 'download.js', 'build.py')]:
        raise ValueError('Refusing to overwrite a source file.')
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(html, encoding='utf-8')
    return target


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', type=Path, help='Output HTML path; defaults to index.html next to build.py.')
    args = parser.parse_args()
    result = build(args.out)
    print(result)
