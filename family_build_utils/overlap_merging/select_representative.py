from pathlib import Path
import sys
from Bio import SeqIO

# Script checks if alignments are square

alignment_path = Path(sys.argv[1])

sequences = SeqIO.to_dict(SeqIO.parse(open(str(alignment_path), 'r'), 'fasta'))

scores = dict.fromkeys(sequences.keys(), 0)

length = 0
for sequence in sequences:
    length += len(sequences[sequence].seq)
    break

print(str(length), file=sys.stderr)

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

result = sorted(scores, key=scores.get, reverse=True)

for k in sorted(scores, key=scores.get, reverse=True):
    print(k, scores[k], sep=',', file=sys.stderr)

print(">" + result[0] + '\n' + str(sequences[result[0]].seq.upper()).replace('-', ''))
