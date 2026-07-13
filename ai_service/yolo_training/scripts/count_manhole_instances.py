"""
count_manhole_instances.py

Quick diagnostic: counts exactly how many D50 (manhole cover) instances
exist in the raw RDD2022 India XML annotations, and how many distinct
images contain at least one. This determines whether the India subset's
"unofficial" D50 labels are numerous enough to use directly, instead of
(or alongside) a separate non-India manhole dataset.
"""

import xml.etree.ElementTree as ET
from pathlib import Path
from collections import Counter

BASE_DIR = Path(__file__).parent.parent
RAW_XML_DIR = BASE_DIR / "raw_data" / "RDD2022_India" / "India" / "train" / "annotations" / "xmls"

class_counts = Counter()
images_with_d50 = []

for xml_path in sorted(RAW_XML_DIR.glob("*.xml")):
    tree = ET.parse(xml_path)
    root = tree.getroot()
    has_d50 = False
    for obj in root.findall("object"):
        name = obj.find("name").text
        class_counts[name] += 1
        if name == "D50":
            has_d50 = True
    if has_d50:
        images_with_d50.append(xml_path.stem)

print("All class codes found in the raw data, with counts:")
for code, count in class_counts.most_common():
    print(f"  {code}: {count}")

print(f"\nD50 (manhole cover) total instances: {class_counts.get('D50', 0)}")
print(f"Images containing at least one D50: {len(images_with_d50)}")