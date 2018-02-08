import sys
from operator import itemgetter
from pathlib import Path

import jsonpickle

from pseudocontig import Pseudocontig

debug_core = sys.argv[1]

data = jsonpickle.decode(Path(debug_core).read_text())['hits']

print("Sorting", file=sys.stderr)

# Sort by contig, then start, then end.
result = sorted(data, key=itemgetter('queryId', 'queryStart', 'queryEnd'))

print("sorted", file=sys.stderr)

pseudocontigs = []

current = Pseudocontig('foo', 'foo', 0, 0, True, False)

counter = 1

for match in result:
    # Skip short hits as they cause problems
    if 'filtered' in match:
        if match['filtered']['type'] == 'shortHit':
            continue

    # if match['hitId'] in ('group_2012', 'lbpA'):  # Skip these families (to be removed)
    #     continue

    if current.id == match['queryId']:

        # if match['hitId'] in ['group_540', 'group_516']:
        #     print(match, file=sys.stderr)

        # Still in the same contig
        if match['queryStart'] <= current.end <= match['queryEnd']:
            # Extend the current contig
            current.extend(match['hitId'], match['queryEnd'], match['full'], match['reverse'])
        else:
            # No overlap so start a new pseudocontig
            if current.id != 'foo':
                pseudocontigs.append(current)
            current = Pseudocontig(match['hitId'], match['queryId'], match['queryStart'], match['queryEnd'],
                                   match['full'], match['reverse'])
    else:
        counter = 1
        print("New contig: " + match['queryId'], file=sys.stderr)
        # Start a new pseudocontig
        if current.id != 'foo':
            pseudocontigs.append(current)
        current = Pseudocontig(match['hitId'], match['queryId'], match['queryStart'], match['queryEnd'], match['full'],
                               match['reverse'])

# Add the last pseudo contig
pseudocontigs.append(current)

# print the results
for pc in pseudocontigs:
    print(pc)


# for match2 in data:
#
#     if match1['hitAccession'] == match2['hitAccession']:
#         # Same gene
#         continue
#     if match1['queryId'] != match2['queryId']:
#         continue
#     if match1['queryEnd'] < match2['queryStart'] or match1['queryStart'] > match2['queryEnd']:
#         continue
#     if match2['queryEnd'] < match1['queryStart'] or match2['queryStart'] > match1['queryEnd']:
#         continue
#
#     # Must be an overlap
#     if match2['queryEnd'] >= match1['queryStart'] > match2['queryStart']:
#         overlap = match2['queryEnd'] - match1['queryStart'] + 1
#         overlap_start = match1['queryStart']
#         overlap_end = match2['queryEnd']
#     else:
#         overlap = match1['queryEnd'] - match2['queryStart'] + 1
#         overlap_start = match2['queryStart']
#         overlap_end = match1['queryEnd']
#
#     if overlap:
#
#         same_strand = match1['reverse'] == match2['reverse']
#         #            print(match1['reverse'], " - ", match2['reverse'], " - ", len(match1['mutations']))
#         for mutation1 in match1['mutations']:
#             # print(str(overlap_start), " <", str(mutation1['qI']), "<", str(overlap_end))
#             if overlap_start <= mutation1['qI'] <= overlap_end and mutation1['t'] == 'S':
#                 overlap_length = overlap_end - overlap_start + 1
#                 print(file, match1['hitId'], match2['hitId'], same_strand,
#                       str(overlap_start) + '-' + str(overlap_end), overlap_length, mutation1)
#
