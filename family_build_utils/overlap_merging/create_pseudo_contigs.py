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

for match in result:
    # Skip short hits as they cause problems
    if 'filtered' in match:
        if match['filtered']['type'] == 'shortHit':
            continue

        # if match['hitId'] == 'group_41':  # salmon bug hack -remove.
        #     continue

    # if match['hitId'] in ('group_2012', 'lbpA'):  # Skip these gono families (to be removed)
    #     continue

    # if match['hitId'] in ('clfA', 'clfB', 'hdsM_2'):  # Skip these families in staph aureus
    #     continue

    # if match['hitId'] in ('CLS00919', 'CLS00194'): # listeria families, odd rearrangements
    #     continue

    if current.id == match['queryId']:

        # if match['hitId'] in ['group_540', 'group_516']:
        #     print(match, file=sys.stderr)

        # Still in the same contig
        if match['queryStart'] <= current.end <= match['queryEnd']:
            # Extend the current contig
            current.extend(match['hitId'], match['queryEnd'], match['complete'], match['reverse'])
        else:
            # No overlap so start a new pseudocontig
            if current.id != 'foo':
                pseudocontigs.append(current)
            current = Pseudocontig(match['hitId'], match['queryId'], match['queryStart'], match['queryEnd'],
                                   match['complete'], match['reverse'])
    else:
        print("New contig: " + match['queryId'], file=sys.stderr)
        # Start a new pseudocontig
        if current.id != 'foo':
            pseudocontigs.append(current)
        current = Pseudocontig(match['hitId'], match['queryId'], match['queryStart'], match['queryEnd'],
                               match['complete'], match['reverse'])

# Add the last pseudo contig
pseudocontigs.append(current)

# print the results
for pc in pseudocontigs:
    pc.csv()
