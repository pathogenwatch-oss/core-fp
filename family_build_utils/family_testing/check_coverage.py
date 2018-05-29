import sys
import jsonpickle
from collections import defaultdict
from pathlib import Path

json_dir = Path(sys.argv[1])

total_matches = defaultdict(lambda: 0)
total_fragments = defaultdict(lambda: 0)
assembly_with_complete = defaultdict(lambda: 0)
assembly_only_fragment = defaultdict(lambda: 0)
assembly_with_paralogue = defaultdict(lambda: 0)
total = 0

for file in json_dir.iterdir():

    if not str(file).endswith('json'):
        continue

    total += 1

    matches = jsonpickle.decode(file.read_text())['hits']

    seen = set()
    seen_fragments = set()

    paralogues = dict()

    for match in matches:

        hit_id = match['hitId']
        fragment = 1 != match['complete']

        # Update the total matches for that family
        total_matches[hit_id] += 1

        # Update the number of fragments for that family
        if fragment:
            total_fragments[hit_id] += 1

        # If it's already dealt with, move on
        if hit_id in seen:
            paralogues[hit_id] = True
            continue

        # fragment already counted
        if fragment and hit_id in seen_fragments:
            paralogues[hit_id] = True
            continue

        if fragment:
            seen_fragments.add(hit_id)
        else:
            seen.add(hit_id)
            assembly_with_complete[hit_id] += 1

    for family_id in seen_fragments:
        if family_id not in seen:
            assembly_only_fragment[family_id] += 1

    for family_id in paralogues:
        assembly_with_paralogue[family_id] += 1

assembly_incomplete = {family_id: total - count for family_id, count in assembly_with_complete.items()}

with open('family_stats.csv', 'w') as stats:
    print('family ID,Not perfect,Only fragment,Paralogs,Total matches,Total fragments')
    for family_id in assembly_with_complete:
        print(family_id,
              assembly_incomplete[family_id],
              assembly_only_fragment[family_id],
              assembly_with_paralogue[family_id],
              total_matches[family_id],
              total_fragments[family_id],
              sep='\t',
              file=stats
              )
