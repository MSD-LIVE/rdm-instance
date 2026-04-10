# TinyMCE 8 Upgrade Notes — InvenioRDM 13

## Goal

Upgrade `react-invenio-forms` (forked from invenio) from TinyMCE 6 to TinyMCE 8, adding:
- Markdown import (file upload + paste dialog)
- Base64 image compression for description field (no file backend)
- Image resize handles and advanced border/style options
- Source field readonly in image dialog

---

## Environment

- InvenioRDM 13, Python 3.12, pipenv
- virtualenv: `/root/.local/share/virtualenvs/rdm-venv`
- `react-invenio-forms` fork: `/workspaces/rdm-instance/react-invenio-forms`
- `rdm-app`: `/workspaces/rdm-instance/rdm-app`
- Overrides: `/workspaces/rdm-instance/overrides/`
- Webpack assets: `/root/.local/share/virtualenvs/rdm-venv/var/instance/assets/`
- Static served files: `/root/.local/share/virtualenvs/rdm-venv/var/instance/static/dist/`
- `~/.npmrc` has `legacy-peer-deps=true`

---

## Build Commands

### Full build
  Used when setting up fresh or after Python/config changes:
  - First-time setup or after invenio-cli install
  - After changing any webpack.py files
  - If the symlink gets broken

  ```bash
  cd /workspaces/rdm-instance/react-invenio-forms
  npm run build && npm run prelink-dist
  cd /workspaces/rdm-instance/rdm-app
  invenio-cli assets build                             # runs npm install — overwrites symlink
  invenio-cli assets install ../react-invenio-forms    # restores symlink to our fork
  pipenv run invenio webpack build                     # REQUIRED — re-bundles against fork
                                                       # after assets build overwrites symlink
  ```

### Day-to-day

  Use when you change `RichEditor.js`- no `webpack.py` changes

  ```bash
  cd /workspaces/rdm-instance/react-invenio-forms
  npm run build && npm run prelink-dist
  cd /workspaces/rdm-instance/rdm-app
  pipenv run invenio webpack build
  ```

  > **Important:** After every `npm run build`, always run `npm run prelink-dist`.
  > It creates `dist/package.json` which is required for webpack to resolve the package.
  > `npm run build` alone deletes and recreates `dist/` without it.

  invenio-rdm docs recommends use of invenio-client assets watch (below commands)

    invenio-cli assets watch-module --link ../react-invenio-forms   # Terminal 1
    invenio-cli assets watch                                         # Terminal 2

  but this didn't work for me consistently

---

## Running the App

1. **VS Code Run Config: "RDM App Debugger"** — starts Flask backend at https://localhost:5000
2. Watch commands (`assets watch`, `assets watch-module`) exit with code 1 and don't work — use manual rebuild instead.

---

## Key Architecture Facts

- Linked into webpack via: `invenio-cli assets install ../react-invenio-forms` which creates a symlink:
  `node_modules/react-invenio-forms → .../react-invenio-forms/dist`
- `invenio-cli assets build` runs `npm install` internally, which **overwrites the symlink** with the published npm version.
   You must run `assets install` + `webpack build` after it every time.
- TinyMCE skin CSS files are copied to `/static/dist/js/skins/` via CopyPlugin entries in `webpack.py`.

---

## Files Modified

### 1. `/workspaces/rdm-instance/react-invenio-forms/src/lib/forms/RichEditor.js`

New imports added:
```js
import "tinymce/plugins/advlist";
import "tinymce/plugins/autolink";
import "tinymce/plugins/charmap";
import "tinymce/plugins/searchreplace";
import "tinymce/plugins/visualblocks";
import "tinymce/plugins/fullscreen";
import "tinymce/plugins/insertdatetime";
import "tinymce/plugins/media";
import { marked } from "marked";
import DOMPurify from "dompurify";
import imageCompression from "browser-image-compression";
```

> **Note:** `anchor` was intentionally NOT added — importing it without listing it in `plugins:[]`
> causes `e.replace is not a function` error in TinyMCE 8.
> `help` was also removed — it loads i18n files from dynamic URLs not served by InvenioRDM.

New config options:
```js
license_key: "gpl",            // in init config
toolbar_mode: "wrap",
image_advtab: true,           // enables border/style tab in image dialog
paste_data_images: true,      // allows paste of images
images_upload_handler: this.imagesBase64UploadHandler,  // base64 for description field
```

Updated `toolbar` string: added `markdownimport`, `underline`, `strikethrough`

New `<Editor>` prop (**REQUIRED** for TinyMCE 8 — `init` config alone is not enough):
```jsx
<Editor licenseKey="gpl" ... />
```

New plugins in `plugins:[]` array:
`advlist`, `autolink`, `charmap`, `fullscreen`, `insertdatetime`, `media`, `searchreplace`, `visualblocks`

New methods:
- `imagesBase64UploadHandler` — compresses image to 200KB, returns base64 data URL (used when `attachFilesEnabled=false`, i.e. description field)
- `imagesUploadHandler` — unchanged original server upload with progress bar (used when `attachFilesEnabled=true`)
- `registerMarkdownButton`, `convertMarkdownToHTML`, `openMarkdownDialog`, `uploadMarkdownFile`, `pasteMarkdownText` — full markdown import feature
- `OpenWindow` event handler in `setup` — makes Source field readonly in image dialog

---

### 2. `/workspaces/rdm-instance/react-invenio-forms/package.json`

- `peerDependencies.tinymce`: `^8.3.2`
- `devDependencies.tinymce`: `^8.3.2`
- Added to both: `marked: ^4.3.0`, `dompurify: ^3.0.0`, `browser-image-compression: ^2.0.0`

---

### 3. `/workspaces/rdm-instance/rdm-app/site/rdm_app/webpack.py`

Added `dependencies` dict:
```python
dependencies={
    "tinymce": "^8.3.2",
    "marked": "^4.3.0",
    "dompurify": "^3.0.0",
    "browser-image-compression": "^2.0.0",
},
```

---

### 4. `/workspaces/rdm-instance/overrides/code/invenio_app_rdm/theme/webpack.py`

- Bumped `tinymce` dependency to `^8.3.2`
- Added to `copy[]` list (TinyMCE 8 requests non-minified files that TinyMCE 6 didn't):
```python
{"from": "../node_modules/tinymce/skins/ui/oxide/skin.css",     "to": "../../static/dist/js/skins/ui/oxide"},
{"from": "../node_modules/tinymce/skins/ui/oxide/content.css",  "to": "../../static/dist/js/skins/ui/oxide"},
```

---

### 5. Four other override webpack.py files — each only bumps tinymce to `^8.3.2`

These exist because all 5 packages declared `tinymce: "^6.7.2"` causing a `pywebpack MergeConflictError`.

- `/workspaces/rdm-instance/overrides/code/invenio_rdm_records/webpack.py`
- `/workspaces/rdm-instance/overrides/code/invenio_administration/webpack.py`
- `/workspaces/rdm-instance/overrides/code/invenio_communities/webpack.py`
- `/workspaces/rdm-instance/overrides/code/invenio_requests/webpack.py`

---

### 6. `/workspaces/rdm-instance/overrides/code/marshmallow_utils/html.py` (new file)

Clean copy of the installed `marshmallow_utils/html.py` with changes applied directly (no monkey-patching):
- `"img"` added to `ALLOWED_HTML_TAGS`
- `ALLOWED_HTML_ATTRS` changed from a dict to callable `_allowed_html_attrs` — enables value-level checks on img `src`
- `ALLOWED_DATA_IMAGE_TYPES` constant declared (raster only: png/jpeg/gif/webp — SVG excluded)
- `protocols=frozenset({"http", "https", "mailto", "data"})` added to `bleach.clean()`
- `ALLOWED_CSS_STYLES` expanded from 10 properties to 36 — covers all CSS that TinyMCE 8 advanced features produce

Symlinked into site-packages via `python3 overrides/link-overrides.py`.

**`ALLOWED_CSS_STYLES` (full list):**
```python
ALLOWED_CSS_STYLES = [
    # Layout / sizing
    "width", "height", "max-width", "min-width", "max-height", "min-height",
    "float",
    # Margin / padding
    "margin", "margin-top", "margin-right", "margin-bottom", "margin-left",
    "padding", "padding-top", "padding-right", "padding-bottom", "padding-left",
    # Border
    "border", "border-width", "border-style", "border-color", "border-radius",
    "border-collapse", "border-spacing",
    # Background
    "background", "background-color",
    # Text / font
    "color", "text-align", "vertical-align",
    "font-size", "font-weight", "font-style",
]
```

> **Why this matters:** `bleach`'s `CSSSanitizer` strips any CSS property not in this list. The original list (10 items) was missing `border`, `border-style`, `border-color`, `background-color`, `color`, `float`, etc. — so image borders and table/cell background colors set via TinyMCE's advanced dialogs were silently removed on save.

> **Important:** The override alone is not sufficient — see `invenio.cfg` below.

---

### 7. `/workspaces/rdm-instance/rdm-app/invenio.cfg`

Added import at the top:
```python
from marshmallow_utils.html import ALLOWED_HTML_TAGS, ALLOWED_HTML_ATTRS
```

**Why this is required:** `invenio_rdm_records` ships its own `SanitizedHTML` subclass
(`invenio_rdm_records/services/schemas/fields.py`) that reads `ALLOWED_HTML_TAGS` and
`ALLOWED_HTML_ATTRS` from **Flask config** at request time:

```python
return current_app.config["ALLOWED_HTML_TAGS"]   # KeyError if not set!
return current_app.config["ALLOWED_HTML_ATTRS"]
```

If these keys are absent from Flask config, every save of a record description raises a
`KeyError` and the image (and all HTML) is lost. The import in `invenio.cfg` assigns them
as Flask config variables. Because `invenio.cfg` imports from our overridden
`marshmallow_utils/html.py`, the values supplied to Flask config already include `img` and
the data-URI-aware `ALLOWED_HTML_ATTRS` callable — no separate monkey-patching needed.

---

### 8. `/workspaces/rdm-instance/rdm-app/templates/semantic-ui/invenio_app_rdm/records/macros/detail.html` (new file)

Template override of `invenio_app_rdm`'s detail macros. The only change is in `show_add_descriptions`:

```diff
- {{ desc_text | sanitize_html() | safe }}
+ {{ desc_text | safe }}
```
(applied in both the `notes` branch and the default branch of the macro)

**Why this is required:** Additional descriptions go through a redundant second sanitization
at render time via the `sanitize_html()` Jinja filter, even though the content was already
sanitized by marshmallow on save. The main description uses `{{ description | safe }}` with
no filter. This asymmetry is a bug in `invenio-app-rdm` — the filter call strips `data:`
image URIs at display time regardless of what was stored.

This template override mirrors the exact PR that will be submitted to `invenio/invenio-app-rdm`.
When that PR merges and you upgrade, simply delete this file.



## TinyMCE 8 Breaking Changes vs TinyMCE 6

| Issue | Cause | Fix |
|---|---|---|
| Editor stays `visibility:hidden` | `skin.css` (non-minified) not in copy list; TinyMCE 8 requests it, 6 didn't | Add `skin.css` to `copy[]` in override `webpack.py` |
| `content.css` 404 in iframe | `content.css` not in copy list | Add `content.css` to `copy[]` in override `webpack.py` |
| "Editor disabled" popup | TinyMCE 8 fetches `licensekeymanager/plugin.js` dynamically; `init` config alone not enough | Add `licenseKey="gpl"` prop directly on `<Editor>` component |
| `e.replace is not a function` | Importing a plugin (`anchor`) without listing it in `plugins:[]` causes conflict during CSS collection | Only import plugins that are also listed in `plugins:[]` |
| `help` plugin 404 | Loads i18n files from dynamic URLs not served by InvenioRDM | Remove `help` from imports and `plugins:[]` |
| `pywebpack MergeConflictError` | 5 packages all declare `tinymce: "^6.7.2"` conflicting with `^8.3.2` | Create override `webpack.py` for each package bumping to `^8.3.2` |
| Images lost on save (after override) | `invenio_rdm_records` `SanitizedHTML` reads `ALLOWED_HTML_TAGS`/`ALLOWED_HTML_ATTRS` from Flask config — `KeyError` if absent | Import them from `marshmallow_utils.html` in `invenio.cfg` so Flask config gets the updated values |
| Images stripped in additional descriptions (render) | `show_add_descriptions` macro applies `\| sanitize_html()` at render time — redundant double-sanitization strips `data:` URIs; main description uses `\| safe` with no filter | Override `detail.html` template: replace `\| sanitize_html() \| safe` with `\| safe` (content already sanitized by marshmallow on save) |
| Image borders / table background colors stripped on save | `ALLOWED_CSS_STYLES` in `marshmallow_utils/html.py` too narrow (10 items) — missing `border`, `background-color`, `color`, `float`, etc.; `CSSSanitizer` silently removes any property not in the list | Expand `ALLOWED_CSS_STYLES` to 36 properties covering all TinyMCE 8 advanced styling output |

---

## Contributing Back to InvenioRDM

### PR to `invenio/react-invenio-forms`
- All `RichEditor.js` changes
- `package.json` tinymce bump and new deps
- `licenseKey="gpl"` prop on `<Editor>`

### PR to `invenio/invenio-app-rdm`
- `webpack.py`: bump tinymce to `^8.3.2`
- `webpack.py`: add `skin.css` and `content.css` to copy list
- `records/macros/detail.html`: remove redundant `| sanitize_html()` from `show_add_descriptions` macro — content is already sanitized by marshmallow on save; the filter causes double-sanitization that strips `data:` image URIs at render time. Main description already uses `| safe` without the filter.

### PRs to 4 other repos (each `webpack.py` tinymce version bump only)
- `invenio/invenio-rdm-records`
- `invenio/invenio-administration`
- `invenio/invenio-communities`
- `invenio/invenio-requests`

### PR to `invenio/invenio-rdm-records`
- Consider upstreaming the `SanitizedHTML` subclass change: set `ALLOWED_HTML_TAGS`/`ALLOWED_HTML_ATTRS` defaults from `marshmallow_utils.html` so instances without explicit Flask config don't get a `KeyError`. Or document that operators who customise these must set them in `invenio.cfg`.

### PR to `inveniosoftware/marshmallow-utils` (html sanitization)

 - "img" added to ALLOWED_HTML_TAGS
 - _ALLOWED_HTML_ATTRS_BASE dict kept for all existing tags; ALLOWED_HTML_ATTRS is now the callable _allowed_html_attrs handling img src value-level checks
 - Declares ALLOWED_DATA_IMAGE_TYPES constant
 - protocols=frozenset({"http", "https", "mailto", "data"}) added to bleach.clean()
 - ALLOWED_CSS_STYLES expanded to 36 properties (border, background-color, color, float, margin, padding, font etc.) — original 10-item list predated TinyMCE's advanced styling features and caused silent stripping of image borders and table background colors on save
 - NOTE: allows image/png, image/jpeg, image/gif, image/webp — not data:text/html, data:image/svg+xml, etc.
 - **Why `protocols` must be set explicitly (bleach 6 design):**
   bleach applies two independent filters to URL-type attributes (`href`, `src`, etc.):
   1. The `attributes` callable/dict — controls whether the attribute *name* (and optionally value) is allowed at all.
   2. The `protocols` allowlist — controls which URL *schemes* are permitted, applied separately after the attribute filter passes.

   Both filters must pass for the attribute to survive. In bleach 6 the default `protocols` set is
   `{"ftp", "http", "https", "mailto"}` — `"data"` is not included. So even when your `attributes`
   callable returns `True` for an img `src` containing a `data:image/png;base64,...` value, bleach
   strips the src anyway because `"data"` is not in `protocols`. The two filters are not coordinated —
   there is no way to say "trust my callable and skip the protocol check". You must add `"data"` to
   `protocols` explicitly. This is documented behaviour (not a bug), but it is easy to miss because
   the callable alone looks sufficient — values appear to be checked, but scheme-level filtering
   silently overrides the result.


> Open a tracking issue on `invenio/invenio-rdm` titled "TinyMCE 8 upgrade" linking all PRs.
> The `react-invenio-forms` PR is the root — reference it from all others.
