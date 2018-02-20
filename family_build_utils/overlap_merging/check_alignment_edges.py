from pathlib import Path
import sys

# Script checks if alignments are square

alignment_path = Path(sys.argv[0])

for line in open(str(alignment_path), 'r').readlines():
    line.replace('\n', '')
    if line.startswith('>'):
        continue
    if line.startswith('-') or line.endswith('-'):
        print('Bad alignment')
