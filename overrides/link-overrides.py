# Automatic restore from originals/ if it exists
# Backup of original files before overriding
# Symlinking files from overrides/ into site-packages
# Handles multiple packages and subfolders
# Logging of actions


import os
import shutil
from pathlib import Path

# === CONFIG ===
overrides_root = Path(__file__).parent / "code"
originals_root = Path(__file__).parent / "originals"

# Adjust Python version/site-packages path as needed
site_packages_root = Path(
    "/root/.local/share/virtualenvs/rdm-venv/lib/python3.12/site-packages")


def restore_originals():
    """Restore original files from originals/ to site-packages if originals exist."""
    if not originals_root.exists():
        print(f"No originals found to restore")
        return
    for root, dirs, files in os.walk(originals_root):
        rel_root = Path(root).relative_to(originals_root)
        for file in files:
            original_file = Path(root) / file
            target_file = site_packages_root / rel_root / file

            # Ensure target directory exists
            target_file.parent.mkdir(parents=True, exist_ok=True)

            # Remove existing file or symlink
            if target_file.exists() or target_file.is_symlink():
                target_file.unlink()

            # Copy back original
            shutil.copy2(original_file, target_file)
            print(f"Restored original: {target_file}")


def link_overrides():
    """Symlink overrides into site-packages, backing up originals first."""
    if not overrides_root.exists():
        print("No overrides found.")
        return

    for root, dirs, files in os.walk(overrides_root):
        rel_root = Path(root).relative_to(overrides_root)
        for file in files:
            override_file = Path(root) / file
            target_file = site_packages_root / rel_root / file
            original_file = originals_root / rel_root / file

            # Ensure parent dirs exist
            target_file.parent.mkdir(parents=True, exist_ok=True)
            original_file.parent.mkdir(parents=True, exist_ok=True)

            # Backup original if it exists and not already backed up
            if target_file.exists() and not original_file.exists():
                shutil.copy2(target_file, original_file)
                print(f"Backed up original: {target_file} -> {original_file}")

            # Remove existing file/symlink and create symlink to override
            if target_file.exists() or target_file.is_symlink():
                target_file.unlink()
            os.symlink(override_file.resolve(), target_file)
            print(f"Linked override: {override_file} -> {target_file}")


if __name__ == "__main__":
    # Step 1: Restore any originals if they exist
    restore_originals()

    # Step 2: Link overrides into site-packages
    link_overrides()

    print("Overrides applied successfully.")


# Usage

# Put your overrides in app/overrides/ using the same package structure as site-packages.

# Run the script before starting your app:
# python link_overrides.py

# How it behaves

# First run: backs up originals, symlinks overrides.
# Subsequent runs: restores originals first, then applies current overrides.
# If you remove a file from overrides/: original file is restored automatically on the next run.
# Works for single files, multiple files, nested subpackages, and relative imports.
