"""JS/CSS Webpack bundles for rdm-app."""

from invenio_assets.webpack import WebpackThemeBundle

theme = WebpackThemeBundle(
    __name__,
    "assets",
    default="semantic-ui",
    themes={
        "semantic-ui": dict(
            entry={
                # Add your webpack entrypoints
            },
            dependencies={
                # Override invenio-app-rdm's tinymce version
                "tinymce": "^8.3.2",
                # New packages used by react-invenio-forms RichEditor
                "marked": "^4.3.0",
                "dompurify": "^3.0.0",
                "browser-image-compression": "^2.0.0",
            },
        ),
    },
)
