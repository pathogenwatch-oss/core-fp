# This script checks for families that overlap different families or exist by themselves as well.
# e.g. the family names occur more than once in the list of families.

import sys
from collections import Counter
import re

gono_pattern = re.compile(r"(WHO_\w_)?(.*)")
path = sys.argv[1]

count = Counter()

for line in open(path, 'r').readlines():
    if line.startswith('>'):
        parsed = gono_pattern.match(line.replace('\n', ''))
        data = parsed.group(2).replace('>', '').replace('SE4047_', '').split('__')
        for family_id in data:
            # print(family_id, file=sys.stderr)
            count[family_id] += 1

for (a, b) in count.items():
    if 1 < b:
        print(a, b, sep=',')
