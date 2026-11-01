#!/usr/bin/env python3
"""Static checks only. This does not verify math, runtime behavior, or learning."""
import argparse
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

class Inspect(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = []
        self.script_count = 0
        self.offline_scripts = 0
        self.in_button = False
        self.button_text = ""
        self.buttons = []
        self.in_title = False
        self.title = ""
        self.in_style = False
        self.styles = []
        self.in_script = False
        self.script_texts = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        self.tags.append((tag, a))
        if a.get("style"):
            self.styles.append(a["style"])
        if tag == "style":
            self.in_style = True
        if tag == "script":
            self.script_count += 1
            self.offline_scripts += "data-offline" in a
            self.in_script = True
        if tag == "button":
            self.in_button = True
            self.button_text = ""
        if tag == "title":
            self.in_title = True
    def handle_endtag(self, tag):
        if tag == "button":
            self.buttons.append(self.button_text.strip())
            self.in_button = False
        if tag == "title":
            self.in_title = False
        if tag == "style":
            self.in_style = False
        if tag == "script":
            self.in_script = False
    def handle_data(self, data):
        if self.in_button:
            self.button_text += data
        if self.in_title:
            self.title += data
        if self.in_style:
            self.styles.append(data)
        if self.in_script:
            self.script_texts.append(data)

def inspect(path):
    raw = path.read_text(encoding="utf-8")
    p = Inspect()
    p.feed(raw)
    errors, notes = [], []
    if not re.search(r"<!doctype\s+html", raw, re.I):
        errors.append("Missing HTML doctype.")
    if not p.title.strip():
        errors.append("Missing nonempty title.")
    if not any(t == "meta" and a.get("name", "").lower() == "viewport" for t, a in p.tags):
        errors.append("Missing responsive viewport meta.")
    if not any(t == "meta" and a.get("charset", "").lower() in ("utf-8", "utf8") for t, a in p.tags):
        errors.append("Missing UTF-8 charset meta.")
    if p.offline_scripts < 1:
        errors.append("No inline app scripts marked data-offline.")
    if not any(a.get("id") == "download-html" for _, a in p.tags):
        errors.append("Missing download-html control.")
    for tag, attrs in p.tags:
        if tag in ("input", "textarea", "select"):
            errors.append("Found an input control; default lesson contract uses choice buttons only.")
        if tag == "base":
            errors.append("base tag can break portable offline output.")
        if tag == "script" and attrs.get("src"):
            errors.append("External or adjacent script dependency: " + attrs["src"])
        if tag == "link" and "stylesheet" in attrs.get("rel", ""):
            errors.append("External or adjacent stylesheet dependency.")
        for key in ("src", "poster"):
            value = attrs.get(key, "")
            if value and not value.startswith(("data:", "#")):
                if not (tag == "script" and key == "src"):
                    errors.append("Nonembedded resource: " + value[:150])
    if any(re.fullmatch(r"(下一步|下一题|继续|next)", b, re.I) for b in p.buttons):
        errors.append("Found a required-looking Next/Continue button; inspect the navigation contract.")
    css = "\n".join(p.styles)
    if re.search(r"@import\b", css, re.I):
        errors.append("CSS @import is not allowed in the offline deliverable.")
    for value in re.findall(r"url\(\s*['\"]?([^)'\"\s]+)", css, re.I):
        if not value.startswith(("data:", "#")):
            errors.append("Nonembedded CSS resource: " + value[:150])
    if "prefers-reduced-motion" not in raw:
        errors.append("Missing reduced-motion handling.")
    if re.search(r"(?:/workspace/|/root/\.codex|C:\\\\Users\\\\)", raw):
        errors.append("Found author-environment absolute path in deliverable.")
    if re.search(r"\b(fetch|XMLHttpRequest|WebSocket)\s*\(", raw):
        notes.append("Inspect network calls; offline operation may depend on a service.")
    if p.script_count != p.offline_scripts:
        notes.append("Some scripts lack data-offline; ensure download retains every required script.")
    if re.search(r"<\s*/\s*(?:head|body|html)\b", "\n".join(p.script_texts), re.I):
        errors.append("Literal document-end tag inside JavaScript can be rewritten by hosting/preview injection; use DOM serialization or split tag sequences.")
    notes.append("Not verified here: mathematical correctness, dynamic DOM, timers, animations, accessibility, actual exported-file reopening, student understanding.")
    return {
        "file": str(path),
        "bytes": path.stat().st_size,
        "static_pass": not errors,
        "inline_offline_scripts": p.offline_scripts,
        "errors": sorted(set(errors)),
        "notes": notes,
    }

def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("html", type=Path)
    args = ap.parse_args()
    try:
        report = inspect(args.html.resolve())
    except (OSError, UnicodeError) as e:
        print(json.dumps({"static_pass": False, "error": str(e)}, ensure_ascii=False))
        return 2
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["static_pass"] else 1

if __name__ == "__main__":
    sys.exit(main())
