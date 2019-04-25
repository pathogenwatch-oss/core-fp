import sys
from Bio import SeqIO

# Script checks if alignments are square
alignment_path = sys.argv[0]

for sequence in SeqIO.parse(alignment_path, 'fasta'):
    if sequence.seq.startswith('-') or sequence.seq.endswith('-'):
        print(alignment_path, 'Fragment')
