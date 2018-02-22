import sys
from collections import defaultdict

path = sys.argv[1]

data = defaultdict(lambda: [])

for line in open(path, 'r').readlines():
    full_name = line.replace('\n', '').split('\t')[0]
    ids = full_name.split('__')
    for name in ids:
        data[name].append(line)

for key in data.keys():
    if 1 < len(data[key]):
        print(key, data[key])
