# -*- coding: utf-8 -*-
#
# Copyright (C) 2021-2025 CERN.
#
# Marshmallow-Utils is free software; you can redistribute it and/or modify
# it under the terms of the MIT License; see LICENSE file for more details.

"""HTML utilities."""

import html

import bleach
from bleach.css_sanitizer import CSSSanitizer
from ftfy import fix_text

#: Unwanted unicode characters
UNWANTED_CHARS = {
    # Zero-width space
    "\u200b",
}


#: Allowed tags used for html sanitizing by bleach.
ALLOWED_HTML_TAGS = [
    "a",
    "abbr",
    "acronym",
    "b",
    "blockquote",
    "br",
    "code",
    "col",
    "colgroup",
    "div",
    "table",
    "tbody",
    "tfoot",
    "thead",
    "td",
    "th",
    "tr",
    "em",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "i",
    "img",
    "li",
    "ol",
    "p",
    "pre",
    "s",
    "span",
    "strike",
    "strong",
    "sub",
    "sup",
    "u",
    "ul",
]


# NOTE: These attributes are taken from the OWASP XSS Safe Sinks section:
# https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html#safe-sinks
#: Base allowed attributes dict (used as fallback inside the callable below).
_ALLOWED_HTML_ATTRS_BASE = {
    "a": ["href", "title", "name", "target", "rel", "rev", "alt"],
    "div": ["dir", "lang"],
    "span": ["dir", "lang"],
    "p": ["dir", "lang"],
    "abbr": ["title", "lang", "dir"],
    "acronym": ["title", "lang", "dir"],
    # Tables (we allow style)
    "table": ["style"],
    "tbody": ["style"],
    "thead": ["style"],
    "tfoot": ["style"],
    "td": ["style", "colspan", "rowspan", "nowrap"],
    "th": ["style", "colspan", "rowspan", "nowrap"],
    "tr": ["style"],
    "col": ["style", "span"],
    "colgroup": ["style", "span"],
}

#: Allowed data: URI media types for img src.
#: Only raster image types — SVG excluded (can contain executable JS).
ALLOWED_DATA_IMAGE_TYPES = (
    "data:image/png;",
    "data:image/jpeg;",
    "data:image/gif;",
    "data:image/webp;",
)


def _allowed_html_attrs(tag, name, value):
    """Callable for bleach attributes — allows standard attrs and img src.

    bleach accepts either a dict or a callable ``(tag, name, value) -> bool``
    for its ``attributes`` parameter. Using a callable here lets us apply
    value-level checks on img src without losing the per-tag allowlist for
    all other elements.
    """
    if name in _ALLOWED_HTML_ATTRS_BASE.get(tag, []):
        return True
    if tag == "img":
        if name in ("alt", "width", "height", "style", "class"):
            return True
        if name == "src":
            # Allow absolute URLs, relative paths, and safe raster base64 data
            # URIs. SVG is intentionally excluded — it can embed executable JS.
            return (
                value.startswith(("http://", "https://", "/"))
                or value.startswith(ALLOWED_DATA_IMAGE_TYPES)
            )
    return False


#: Allowed attributes used for html sanitizing by bleach.
#: This is a callable so img src values can be validated (not just the name).
ALLOWED_HTML_ATTRS = _allowed_html_attrs

ALLOWED_CSS_STYLES = [
    # Layout / sizing
    "width",
    "height",
    "max-width",
    "min-width",
    "max-height",
    "min-height",
    "float",
    # Margin / padding
    "margin",
    "margin-top",
    "margin-right",
    "margin-bottom",
    "margin-left",
    "padding",
    "padding-top",
    "padding-right",
    "padding-bottom",
    "padding-left",
    # Border
    "border",
    "border-width",
    "border-style",
    "border-color",
    "border-radius",
    "border-collapse",
    "border-spacing",
    # Background
    "background",
    "background-color",
    # Text / font
    "color",
    "text-align",
    "vertical-align",
    "font-size",
    "font-weight",
    "font-style",
]


def strip_html(value):
    """Strip all HTML from text and remove unwanted unicode characters."""
    # Disallow all HTML tags and attributes
    value = sanitize_html(value, tags=[], attrs=[])
    # If value has already escaped HTML then return the unescaped value
    return html.unescape(value)


def sanitize_html(value, tags=None, attrs=None, css_styles=None):
    """Sanitizes HTML using the bleach library.

    The default list of allowed tags and attributes is defined by
    ``ALLOWED_HTML_TAGS`` and ``ALLOWED_HTML_ATTRS``.

    You can override the defaults like this:

    .. code-block:: python

        class MySchema(Schema):
            html = fields.SanitizedHTML(tags=['a'], attrs={'a': ['href']})

    :param tags: List of allowed tags.
    :param attrs: Dictionary of allowed attributes per tag.
    """
    value = sanitize_unicode(value)

    if tags is None:
        tags = ALLOWED_HTML_TAGS

    if attrs is None:
        attrs = ALLOWED_HTML_ATTRS

    if css_styles is None:
        css_styles = ALLOWED_CSS_STYLES

    # NOTE: bleach 6 checks `protocols` independently of the `attributes`
    # callable — a data: URI is stripped by the protocol filter even when the
    # callable returns True. We explicitly allow "data" here so that the
    # fine-grained src value check in ALLOWED_HTML_ATTRS actually takes effect.
    return bleach.clean(
        value,
        tags=tags,
        attributes=attrs,
        protocols=frozenset({"http", "https", "mailto", "data"}),
        css_sanitizer=CSSSanitizer(css_styles),
        strip=True,
    ).strip()


def is_valid_xml_char(char):
    """Check if a character is valid based on the XML specification."""
    codepoint = ord(char)
    return (
        0x20 <= codepoint <= 0xD7FF
        or codepoint in (0x9, 0xA, 0xD)
        or 0xE000 <= codepoint <= 0xFFFD
        or 0x10000 <= codepoint <= 0x10FFFF
    )


def sanitize_unicode(value, unwanted_chars=None):
    """Sanitize and fix problematic unicode characters."""
    value = fix_text(value.strip())
    # NOTE: This `join` might be ineffiecient... There's a solution with a
    # large compiled regex lying around, but needs a lot of tweaking.
    value = "".join(filter(is_valid_xml_char, value))

    if unwanted_chars is None:
        unwanted_chars = UNWANTED_CHARS

    for char in unwanted_chars:
        value = value.replace(char, "")
    return value
