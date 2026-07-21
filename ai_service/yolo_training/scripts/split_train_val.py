"""
split_train_val.py

Splits the combined dataset/images + dataset/labels into train/ and val/
subfolders in the layout ultralytics expects:

    dataset/train/images/, dataset/train/labels/
    dataset/val/images/,   dataset/val/labels/

IMPORTANT: this is a STRATIFIED split, not a plain random shuffle.
open_manhole is by far the thinnest class (317 images vs thousands for
pothole/crack). A naive random split risks the validation set ending up
with too few (or by bad luck, zero) manhole examples, making it
impossible to tell if the model actually learned that class. So images
are split into two buckets — "contains at least one open_manhole
instance" and "does not" — and each bucket is split independently at the
same ratio, then combined. This guarantees both train and val get a
proportional share of the rare class.

Files are MOVED (not copied) from the flat images/labels folders into
train/val subfolders, to avoid doubling disk usage on ~8000 images.

USAGE:
    python3 split_train_val.py
"""

import random
import shutil
from pathlib import Path

VAL_FRACTION = 0.15  # 85% train / 15% val
RANDOM_SEED = 42       # fixed seed = reproducible split every time this runs
OUR_CLASS_ID_OPEN_MANHOLE = 2

BASE_DIR = Path(__file__).parent.parent
DATASET_DIR = BASE_DIR / "dataset"
IMAGES_DIR = DATASET_DIR / "images"
LABELS_DIR = DATASET_DIR / "labels"

TRAIN_IMAGES_DIR = DATASET_DIR / "train" / "images"
TRAIN_LABELS_DIR = DATASET_DIR / "train" / "labels"
VAL_IMAGES_DIR = DATASET_DIR / "val" / "images"
VAL_LABELS_DIR = DATASET_DIR / "val" / "labels"


def label_contains_manhole(label_path: Path) -> bool:
    if not label_path.exists():
        return False
    with open(label_path) as f:
        for line in f:
            line = line.strip()
            if line and int(line.split()[0]) == OUR_CLASS_ID_OPEN_MANHOLE:
                return True
    return False


def split_bucket(image_paths: list[Path], val_fraction: float, rng: random.Random) -> tuple[list, list]:
    """Shuffles and splits a list of image paths into (train, val)."""
    shuffled = image_paths[:]
    rng.shuffle(shuffled)
    val_count = max(1, round(len(shuffled) * val_fraction)) if len(shuffled) > 1 else 0
    val_set = shuffled[:val_count]
    train_set = shuffled[val_count:]
    return train_set, val_set


def move_pair(image_path: Path, dest_images_dir: Path, dest_labels_dir: Path):
    label_path = LABELS_DIR / f"{image_path.stem}.txt"
    shutil.move(str(image_path), str(dest_images_dir / image_path.name))
    if label_path.exists():
        shutil.move(str(label_path), str(dest_labels_dir / label_path.name))


def run_split():
    for d in [TRAIN_IMAGES_DIR, TRAIN_LABELS_DIR, VAL_IMAGES_DIR, VAL_LABELS_DIR]:
        d.mkdir(parents=True, exist_ok=True)

    all_images = sorted(IMAGES_DIR.glob("*"))
    if not all_images:
        raise FileNotFoundError(
            f"No images found in {IMAGES_DIR}. Run the conversion scripts first."
        )

    manhole_bucket = []
    other_bucket = []
    for img_path in all_images:
        label_path = LABELS_DIR / f"{img_path.stem}.txt"
        if label_contains_manhole(label_path):
            manhole_bucket.append(img_path)
        else:
            other_bucket.append(img_path)

    print(f"Total images: {len(all_images)}")
    print(f"  Manhole-containing bucket: {len(manhole_bucket)}")
    print(f"  Other bucket (pothole/crack/background): {len(other_bucket)}")

    rng = random.Random(RANDOM_SEED)
    manhole_train, manhole_val = split_bucket(manhole_bucket, VAL_FRACTION, rng)
    other_train, other_val = split_bucket(other_bucket, VAL_FRACTION, rng)

    train_images = manhole_train + other_train
    val_images = manhole_val + other_val

    for img_path in train_images:
        move_pair(img_path, TRAIN_IMAGES_DIR, TRAIN_LABELS_DIR)
    for img_path in val_images:
        move_pair(img_path, VAL_IMAGES_DIR, VAL_LABELS_DIR)

    print(f"\nSplit complete.")
    print(f"  Train: {len(train_images)} images ({len(manhole_train)} with manhole)")
    print(f"  Val:   {len(val_images)} images ({len(manhole_val)} with manhole)")
    print(f"\nTrain images: {TRAIN_IMAGES_DIR}")
    print(f"Val images:   {VAL_IMAGES_DIR}")


if __name__ == "__main__":
    run_split()