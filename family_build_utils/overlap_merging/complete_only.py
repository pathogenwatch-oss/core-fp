# Get only the pseudocontigs with complete gene hits for a set of references
import sys
from pathlib import Path
from collections import Counter
from operator import itemgetter


def extract_complete():
    names = set()
    for line in file.open('r').readlines():
        name = line.split(',')[3].replace('\n', '')
        if '*' not in name:
            names.add(name)
    return names


directory = Path(sys.argv[1])

all_families = []
for file in directory.iterdir():
    if str(file).endswith('.pc'):
        name_set = extract_complete()
        all_families.extend(name_set)

counter = Counter(all_families)

for family, count in sorted(counter.items(), key=itemgetter(1)):
    print(family, count, sep=',')
