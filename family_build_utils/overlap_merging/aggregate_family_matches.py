# Aggregates the output from create_pseudo_contigs.py
import sys
from pathlib import Path
from pseudocontig import Pseudocontig
from operator import itemgetter

# from os import listdir
# from os.path import isfile, join

file = Path(sys.argv[1])

pseudocontigs = dict()

if str(file).endswith('.pc'):
    for line in file.open('r').readlines():
        data = line.split(',')
        name = data[3].replace('\n', '')

        if name not in pseudocontigs:
            pseudocontigs[name] = 0

        pseudocontigs[name] += 1

for pc_name in sorted(pseudocontigs, key=pseudocontigs.get, reverse=True):
    print(pc_name, str(pseudocontigs[pc_name]), sep=' ')
