import sys
from pathlib import Path

select_path = Path(sys.argv[1])
csv_path = Path(sys.argv[2])

ids = set([i.replace('\n', '') for i in open(str(select_path), 'r').readlines()])

to_print = 1

for line in open(str(csv_path), 'r').readlines():
    data = line.split(',')
    if data[1] in ids:
        print('>' + data[1] + '\n' + data[3].replace('\n', ''))
