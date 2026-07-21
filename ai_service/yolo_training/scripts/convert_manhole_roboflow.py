"""
convert_manhole_roboflow.py

Filters the Roboflow manhole dataset down to only the 'Uncovered' class,
remaps it onto our class ID 2 (open_manhole), and merges it into the same
dataset/images and dataset/labels folders that convert_rdd2022_to_yolo.py
already populated with pothole/crack/manhole data.

Roboflow's 4 classes: Broken(0), Good(1), Lose(2), Uncovered(3)
Only Uncovered maps to our open_manhole (class 2) — see project notes for
why Broken/Lose are excluded rather than merged in (different visual
signature from an actually-missing cover).

Pulls from ALL THREE of Roboflow's splits (train/valid/test) since we're
doing our own train/val split later across the combined merged dataset,
not relying on Roboflow's pre-made split.

Images with NO Uncovered instance are skipped entirely (not kept as
background/negative examples, to keep this merge simple).

USAGE:
    python3 convert_manhole_roboflow.py
"""

import shutil
from pathlib import Path

ROBOFLOW_CLASS_ID_UNCOVERED = 3
OUR_CLASS_ID_OPEN_MANHOLE = 2

BASE_DIR = Path(__file__).parent.parent
RAW_MANHOLE_DIR = BASE_DIR / "raw_data" / "manhole_roboflow"
SPLITS = ["train", "valid", "test"]

OUT_IMAGES_DIR = BASE_DIR / "dataset" / "images"
OUT_LABELS_DIR = BASE_DIR / "dataset" / "labels"


def filter_and_remap_label_file(label_path: Path) -> list[str]:
    """
    Reads a Roboflow label file, keeps only lines for the Uncovered class,
    remaps them to our class ID, and returns the resulting lines.
    Returns an empty list if the image had no Uncovered instances.
    """
    kept_lines = []
    with open(label_path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            parts = line.split()
            class_id = int(parts[0])
            if class_id == ROBOFLOW_CLASS_ID_UNCOVERED:
                remapped_line = f"{OUR_CLASS_ID_OPEN_MANHOLE} {' '.join(parts[1:])}"
                kept_lines.append(remapped_line)
    return kept_lines


def convert_all():
    OUT_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    OUT_LABELS_DIR.mkdir(parents=True, exist_ok=True)

    total_images_kept = 0
    total_images_skipped_no_uncovered = 0
    total_uncovered_instances = 0
    name_collisions = 0

    for split in SPLITS:
        labels_dir = RAW_MANHOLE_DIR / split / "labels"
        images_dir = RAW_MANHOLE_DIR / split / "images"

        if not labels_dir.exists():
            print(f"  [SKIP] {split}/ not found — skipping this split.")
            continue

        label_files = sorted(labels_dir.glob("*.txt"))
        print(f"Processing {split}/: {len(label_files)} label files found.")

        for label_path in label_files:
            kept_lines = filter_and_remap_label_file(label_path)

            if not kept_lines:
                total_images_skipped_no_uncovered += 1
                continue

            # Find the matching image (could be .jpg, .jpeg, .png)
            image_stem = label_path.stem
            matching_images = list(images_dir.glob(f"{image_stem}.*"))
            if not matching_images:
                print(f"  [WARN] No matching image found for {label_path.name} — skipping.")
                continue
            src_image_path = matching_images[0]

            dest_image_path = OUT_IMAGES_DIR / src_image_path.name
            dest_label_path = OUT_LABELS_DIR / f"{image_stem}.txt"

            if dest_image_path.exists() or dest_label_path.exists():
                print(f"  [WARN] Name collision with existing file: {src_image_path.name} — skipping to avoid overwrite.")
                name_collisions += 1
                continue

            shutil.copy2(src_image_path, dest_image_path)
            with open(dest_label_path, "w") as f:
                f.write("\n".join(kept_lines) + "\n")

            total_images_kept += 1
            total_uncovered_instances += len(kept_lines)

    print(f"\nDone.")
    print(f"  Images kept (had >=1 Uncovered instance): {total_images_kept}")
    print(f"  Images skipped (no Uncovered instance): {total_images_skipped_no_uncovered}")
    print(f"  Total Uncovered instances added: {total_uncovered_instances}")
    if name_collisions:
        print(f"  WARNING: {name_collisions} filename collisions with existing dataset files were skipped — investigate these manually.")


if __name__ == "__main__":
    convert_all()