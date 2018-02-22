import sys

from Bio.Alphabet import generic_dna
from Bio.Seq import Seq

file = sys.argv[1]

for line in open(file, 'r').readlines():
    if line.startswith('>'):
        print(line, end='')
    else:
        seq = Seq(line.replace('\n', ''), generic_dna)
        print(seq.translate())
