import os
import re
import sys
from pathlib import Path

from Bio import SeqIO

# This regex doesn't always work
name_p = re.compile(r'^.+[A-Za-z0-9.]genome_([A-Za-z0-9][A-Za-z0-9\-_]+)$')
# Script checks if alignments are square

alignment_path = Path(sys.argv[1])

sequences = SeqIO.to_dict(SeqIO.parse(open(str(alignment_path), 'r'), 'fasta'))

scores = dict.fromkeys(sequences.keys(), 0)

length = 0
for sequence in sequences:
    length += len(sequences[sequence].seq)
    break

# print('Length=', str(length), file=sys.stderr)

# Each sequence is scored at each site according to how many other sequences have the same char at that location.
# The best scoring (or randomly chosen if several score equally) is selected as the representative.
for i in range(length):
    for sequence1 in sequences:
        test_char = sequences[sequence1].seq[i]
        score = 0
        for sequence2 in sequences:
            if sequence1 == sequence2:
                continue
            if test_char == sequences[sequence2].seq[i]:
                score += 1
        scores[sequence1] += score
print(str(alignment_path), file=sys.stderr)
result = sorted(scores, key=scores.get, reverse=True)

# for k in sorted(scores, key=scores.get, reverse=True):
#     print(k, scores[k], sep=',', file=sys.stderr)

# print(result[0], str(m))

family_name = os.path.basename(alignment_path).replace('.fna.ali', '').replace('.fa.ali', '').replace('.fasta.ali', '')

print(">" + family_name + '\n' + str(sequences[result[0]].seq.upper()).replace('-', ''))
