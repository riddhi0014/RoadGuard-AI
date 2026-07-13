"""
convert_rdd2022_to_yolo.py

Converts RDD2022's India subset from Pascal VOC XML annotations to YOLO
.txt label format, remapping RDD2022's original damage codes onto our
2 target classes:

    D00, D10, D20 (longitudinal/transverse/alligator crack) -> crack   (class 0)
    D40 (pothole)                                            -> pothole (class 1)

Any other class code encountered (there shouldn't be any in the India
subset, but RDD2022 has had inconsistent class sets across releases) is
skipped with a warning printed, rather than silently dropped or crashing.

Images with zero relevant objects (either truly no damage, or only
objects of a class we're not using) still get an empty .txt label file
written — this is standard YOLO practice, since "no objects here" is
useful negative/background training signal, not something to discard.

USAGE:
    python3 convert_rdd2022_to_yolo.py

Reads from:  raw_data/RDD2022_India/India/train/{images,annotations/xmls}
Writes to:   dataset/images/  and  dataset/labels/
             (flat, no train/val split yet — that's a separate script)
"""

import shutil
import xml.etree.ElementTree as ET
from pathlib import Path

# --- Class mapping ---
# Our final class IDs (must match what we'll use in data.yaml later):
#   0 = pothole
#   1 = crack
#   2 = open_manhole
CLASS_ID_POTHOLE = 0
CLASS_ID_CRACK = 1
CLASS_ID_OPEN_MANHOLE = 2

RDD_CODE_TO_CLASS_ID = {
    "D00": CLASS_ID_CRACK,   # longitudinal crack
    "D10": CLASS_ID_CRACK,   # transverse crack
    "D20": CLASS_ID_CRACK,   # alligator crack
    "D40": CLASS_ID_POTHOLE,
    "D50": CLASS_ID_OPEN_MANHOLE,  # only 28 instances in India subset — kept as a
                                    # supplementary in-domain source, not the primary
                                    # source for this class (see manhole dataset merge)
}

BASE_DIR = Path(__file__).parent.parent
RAW_IMAGES_DIR = BASE_DIR / "raw_data" / "RDD2022_India" / "India" / "train" / "images"
RAW_XML_DIR = BASE_DIR / "raw_data" / "RDD2022_India" / "India" / "train" / "annotations" / "xmls"

OUT_IMAGES_DIR = BASE_DIR / "dataset" / "images"
OUT_LABELS_DIR = BASE_DIR / "dataset" / "labels"


def convert_bbox_to_yolo(xmin, ymin, xmax, ymax, img_width, img_height):
    """
    Pascal VOC gives absolute pixel corners (xmin, ymin, xmax, ymax).
    YOLO wants normalized (0-1) center coordinates + width/height.
    """
    x_center = (xmin + xmax) / 2.0 / img_width
    y_center = (ymin + ymax) / 2.0 / img_height
    width = (xmax - xmin) / img_width
    height = (ymax - ymin) / img_height
    return x_center, y_center, width, height


def convert_one_xml(xml_path: Path) -> tuple[list, str]:
    """
    Parses one XML file. Returns (list of YOLO-format label lines, image_filename).
    """
    tree = ET.parse(xml_path)
    root = tree.getroot()

    filename_elem = root.find("filename")
    if filename_elem is None or not filename_elem.text:
        raise ValueError(f"{xml_path} has no <filename> tag — can't match it to an image.")
    image_filename = filename_elem.text

    size_elem = root.find("size")
    img_width = int(size_elem.find("width").text)
    img_height = int(size_elem.find("height").text)

    label_lines = []
    for obj in root.findall("object"):
        name = obj.find("name").text
        if name not in RDD_CODE_TO_CLASS_ID:
            print(f"  [SKIP] Unrecognized class '{name}' in {xml_path.name} — not one of D00/D10/D20/D40/D50.")
            continue

        class_id = RDD_CODE_TO_CLASS_ID[name]
        bndbox = obj.find("bndbox")
        xmin = float(bndbox.find("xmin").text)
        ymin = float(bndbox.find("ymin").text)
        xmax = float(bndbox.find("xmax").text)
        ymax = float(bndbox.find("ymax").text)

        x_center, y_center, width, height = convert_bbox_to_yolo(xmin, ymin, xmax, ymax, img_width, img_height)
        label_lines.append(f"{class_id} {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}")

    return label_lines, image_filename


def convert_all():
    if not RAW_XML_DIR.exists():
        raise FileNotFoundError(
            f"Expected annotations at {RAW_XML_DIR} — check the raw_data folder structure."
        )

    OUT_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    OUT_LABELS_DIR.mkdir(parents=True, exist_ok=True)

    xml_files = sorted(RAW_XML_DIR.glob("*.xml"))
    print(f"Found {len(xml_files)} XML annotation files.")

    converted_count = 0
    total_pothole = 0
    total_crack = 0
    total_manhole = 0
    skipped_missing_image = 0

    for xml_path in xml_files:
        label_lines, image_filename = convert_one_xml(xml_path)

        src_image_path = RAW_IMAGES_DIR / image_filename
        if not src_image_path.exists():
            print(f"  [SKIP] {image_filename} referenced in {xml_path.name} but not found in images/ — skipping.")
            skipped_missing_image += 1
            continue

        # Copy the image across (keeps original filename)
        shutil.copy2(src_image_path, OUT_IMAGES_DIR / image_filename)

        # Write the label file (same basename, .txt extension), even if empty
        label_filename = Path(image_filename).stem + ".txt"
        with open(OUT_LABELS_DIR / label_filename, "w") as f:
            f.write("\n".join(label_lines))
            if label_lines:
                f.write("\n")

        total_pothole += sum(1 for line in label_lines if line.startswith(f"{CLASS_ID_POTHOLE} "))
        total_crack += sum(1 for line in label_lines if line.startswith(f"{CLASS_ID_CRACK} "))
        total_manhole += sum(1 for line in label_lines if line.startswith(f"{CLASS_ID_OPEN_MANHOLE} "))
        converted_count += 1

    print(f"\nConverted {converted_count} images.")
    print(f"  Total pothole instances: {total_pothole}")
    print(f"  Total crack instances (D00+D10+D20 merged): {total_crack}")
    print(f"  Total open_manhole instances (D50, in-domain supplement only): {total_manhole}")
    if skipped_missing_image:
        print(f"  Skipped {skipped_missing_image} XML files with no matching image file.")
    print(f"\nImages written to: {OUT_IMAGES_DIR}")
    print(f"Labels written to: {OUT_LABELS_DIR}")


if __name__ == "__main__":
    convert_all()