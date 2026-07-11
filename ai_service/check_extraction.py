import json

with open("data/index/irc_guidelines_meta.json") as f:
    meta = json.load(f)

for entry in meta:
    if entry["source_file"] in ("irc.gov.in.116.2014.pdf", "irc.gov.in.034.2011.pdf"):
        print(f"--- {entry['source_file']} (chunk {entry['chunk_index']}) ---")
        print(entry["text"])
        print(f"(word count: {len(entry['text'].split())})")
        print()