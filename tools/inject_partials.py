#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Injecte partials/site-head.html et partials/footer.html dans chaque page HTML du site.
À lancer depuis la racine du dépôt :
    python3 tools/inject_partials.py

Après modification des partials, relancer ce script pour mettre à jour toutes les pages.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PARTIALS = ROOT / "partials"

# data-active-nav pour surligner l'entrée courante (voir script.js initActiveNav)
ACTIVE_NAV: dict[str, str] = {
    "index.html": "home",
    "services.html": "services",
    "fai.html": "fai",
    "telephonie-ip.html": "telephonie",
    "operateur-mobile.html": "mobile",
    "wifi-hotels.html": "wifi",
    "blog.html": "blog",
    "quiz.html": "quiz",
    "mentions-legales.html": "",
    "infogerance.html": "services",
    "reseaux.html": "services",
    "cybersecurite.html": "services",
    "conception-web.html": "services",
    "centrale-achat.html": "services",
    "depannage.html": "services",
    "dsi-externalise.html": "services",
    "support.html": "services",
    "maintenance.html": "services",
}


def read_partial(name: str) -> str:
    return (PARTIALS / name).read_text(encoding="utf-8")


def replace_head(content: str, head_html: str) -> str:
    m = re.search(r"<div\s+class=\"scroll-progress\"[^>]*>", content)
    if not m:
        raise ValueError("scroll-progress introuvable")
    start = m.start()
    hstart = content.find('<header class="header"', start)
    if hstart == -1:
        raise ValueError("header introuvable après scroll-progress")
    hend = content.find("</header>", hstart)
    if hend == -1:
        raise ValueError("</header> introuvable")
    hend += len("</header>")
    return content[:start] + head_html.rstrip() + "\n" + content[hend:]


def replace_footer(content: str, footer_html: str) -> str:
    m = re.search(r'<footer\s+class="footer"[\s\S]*?</footer>', content)
    if not m:
        raise ValueError("footer introuvable")
    return content[: m.start()] + footer_html.rstrip() + "\n" + content[m.end() :]


def inject_body_active_nav(content: str, filename: str) -> str:
    nav = ACTIVE_NAV.get(filename, "services")

    def repl(match: re.Match[str]) -> str:
        attrs = match.group(1)
        attrs = re.sub(r"\sdata-active-nav=\"[^\"]*\"", "", attrs)
        if nav:
            return f"<body{attrs} data-active-nav=\"{nav}\">"
        return f"<body{attrs}>"

    return re.sub(r"<body([^>]*)>", repl, content, count=1)


def strip_duplicate_mobile_menu_script(content: str) -> str:
    """Supprime les blocs inline dupliqués // Mobile Menu Toggle après script.js."""
    pattern = re.compile(
        r"\s*<script>\s*//\s*Mobile Menu Toggle[\s\S]*?</script>\s*(?=<button class=\"back-to-top\"|<script src=\"script.js\"|$)",
        re.MULTILINE,
    )
    return pattern.sub("\n", content)


def main() -> None:
    head_html = read_partial("site-head.html")
    footer_html = read_partial("footer.html")
    for path in sorted(ROOT.glob("*.html")):
        if path.parent != ROOT:
            continue
        text = path.read_text(encoding="utf-8")
        try:
            text = replace_head(text, head_html)
            text = replace_footer(text, footer_html)
            text = inject_body_active_nav(text, path.name)
            text = strip_duplicate_mobile_menu_script(text)
        except ValueError as e:
            print(f"SKIP {path.name}: {e}")
            continue
        path.write_text(text, encoding="utf-8")
        print("OK", path.name)


if __name__ == "__main__":
    main()
