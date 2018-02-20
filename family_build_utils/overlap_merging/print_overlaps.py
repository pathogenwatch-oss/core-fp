from operator import itemgetter
from pathlib import Path
import jsonpickle
import sys

debug_core = sys.argv[1]

data = jsonpickle.decode(Path(debug_core).read_text())['hits']

# Sort by contig, then start, then end.
sorted_matches = sorted(data, key=itemgetter('queryId', 'queryStart', 'queryEnd'))

for i in range(len(sorted_matches) - 1):

    match1 = sorted_matches[i]
    match2 = sorted_matches[i + 1]

    if match1['queryId'] != match2['queryId']:
        continue

    if 'filtered' in match1:
        if match1['filtered']['type'] == 'shortHit':
            continue

    if 'filtered' in match2:
        if match2['filtered']['type'] == 'shortHit':
            continue

    if match1['hitId'] == 'group_2012' or 'group_2012' == match2['hitId']:
        # Skip this family as it's been excluded on the basis of evidence
        continue

    # In case you want to exclude self-overlaps
    # if match1['hitAccession'] == match2['hitAccession']:
    #     continue
    if match2['queryStart'] < match1['queryEnd']:
        overlap_length = match1['queryEnd'] - match2['queryStart'] + 1
        strand = '+' if match1['reverse'] == match2['reverse'] else '-'
        print(match1['hitId'], match2['hitId'], overlap_length, strand, sep=',')

print('done', file=sys.stderr)
