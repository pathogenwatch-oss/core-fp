import re
import sys
from os import listdir
from os.path import isfile, join

name_p = re.compile(r'(.+,).+[A-Za-z0-9]_([A-Za-z0-9][A-Za-z0-9\-_]+__[A-Za-z0-9][A-Za-z0-9\-_]+)(?=,)')
jsn_p = re.compile(r'".+[A-Za-z0-9]_([A-Za-z0-9][A-Za-z0-9\-_]+__[A-Za-z0-9][A-Za-z0-9\-_]+)')
ref_name_p = re.compile(r'^(.*)\.f\w+');

input_dir = sys.argv[1]
csv = input_dir + '/' + 'core.csv'
jsn = input_dir + '/' + 'config.jsn'

fasta_dir = input_dir + '/fastas/'
csv_out = open(input_dir + '/' + 'new_core.csv', 'w')
jsn_out = open(input_dir + '/' + 'new_config.jsn', 'w')

names = []
for f in listdir(fasta_dir):
    if isfile(join(fasta_dir, f)):
        name = ref_name_p.match(f).group(1)
        names.append(name + '_')

for line in open(csv, 'r').readlines():
    for name in names:
        line = line.replace(name, '')
    # match = name_p.match(line)
    # if match is not None:
    #     replacement = match.group(1) + match.group(2)
    #     print("Replacing " + match.group(0) + " with " + replacement)
    #     line = line.replace(match.group(0), replacement)
    print(line, end='', file=csv_out)

for line in open(jsn, 'r').readlines():
    for name in names:
        line = line.replace(name, '')
    print(line, end='', file=jsn_out)
