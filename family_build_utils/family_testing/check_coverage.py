import sys
import jsonpickle
from collections import defaultdict
from pathlib import Path

json_dir = Path(sys.argv[1])

counts = defaultdict(lambda: 0)
fragments = defaultdict(lambda: 0)
total = 0

for file in json_dir.iterdir():

    if not str(file).endswith('json'):
        continue

    total += 1

    matches = jsonpickle.decode(file.read_text())['hits']

    seen = set()

    for match in matches:
        hit_id = match['hitId']
        if hit_id not in seen:
            seen.add(hit_id)
            counts[hit_id] += 1
            if '*' in hit_id:
                fragments[hit_id] += 1

with open('family_counts.csv', 'w') as fc:
    for family_id in counts:
        if total == counts[family_id]:
            continue
        print(family_id, counts[family_id], file=fc)

with open('family_fragment_counts.csv', 'w') as ffc:
    for family_id in fragments:
        print(family_id, fragments[family_id], file=ffc)
