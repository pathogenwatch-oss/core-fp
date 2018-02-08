import sys
import os
from pathlib import Path
from Bio import SeqIO
from Bio.Seq import Seq

# Script takes a list of pseudocontig names,
# extracts the examples from the reference .pc files,
# then parses them from the FASTAs
# and generates an (unaligned) FASTA file for each one.

source_file = Path(sys.argv[1])
source_dir = Path(sys.argv[2])

print("Reading from ", str(source_dir), file=sys.stderr)

# First read in the list of pseudocontigs
ids = set()
for line in open(str(source_file), 'r').readlines():
    contig_name = line.replace('\n', '').replace('|', '__')
    ids.add(contig_name)

# Then read in the FASTAs, keyed by ID
# Assuming a single
assemblies = dict()
for assembly_fasta in source_dir.iterdir():
    if str(assembly_fasta).endswith('.fasta'):
        name = os.path.basename(str(assembly_fasta)).replace('.fasta', '')
        records = SeqIO.to_dict(SeqIO.parse(str(assembly_fasta), 'fasta'))
        assemblies[name] = records

# Now for each assembly, generate the pseudocontig sequences from the coordinates file
contigs = dict((el, []) for el in ids)
for assembly_pc_file in source_dir.iterdir():
    if str(assembly_pc_file).endswith('.pc'):
        name = os.path.basename(str(assembly_pc_file)).replace('.fasta.json.pc', '')
        for line in open(str(assembly_pc_file), 'r').readlines():
            contig_data = line.split(',')
            contig_id = contig_data[3]
            if contig_id in ids:
                orientation = contig_data[4]
                sequence = str(assemblies[name][contig_data[0]].seq[int(contig_data[1]) - 1:int(contig_data[2])])
                sequence = sequence if '+' == orientation else str(Seq(sequence).reverse_complement())
                fasta = '>' + '_'.join((name, contig_id)) + '\n' + sequence + '\n'
                contigs[contig_id].append(fasta)

# Dump each pseudocontig sequence to a named FASTA file
for contig in contigs.keys():
    outfile = contig.replace('|', '__') + '.fasta'
    open(outfile, 'w').writelines(contigs[contig])
