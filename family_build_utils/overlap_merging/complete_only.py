# Get only the pseudocontigs with complete gene hits for a set of references
import sys
from pathlib import Path
from collections import Counter
from operator import itemgetter


def extract_complete():
    complete = set()
    all_hits = set()
    for line in file.open("r").readlines():
        # name = line.split('\t')[3].replace('\n', '') # .replace('*', '') hack for pneumo to resolve most missing matches
        full_name = line.split("\t")[3]
        name = full_name.replace("\n", "").replace("*", "")
        if "*" not in full_name:
            complete.add(name)
        all_hits.add(name)
    return complete, all_hits


directory = Path(sys.argv[1])

complete_aggregate = []
all_aggregate = []
file_counter = 0
for file in directory.iterdir():
    if str(file).endswith(".pc"):
        file_counter += 1
        complete_matches, all_matches = extract_complete()
        complete_aggregate.extend(complete_matches)
        all_aggregate.extend(all_matches)

all_counter = Counter(all_aggregate)
complete_counter = Counter(complete_aggregate)

print("Family,All,All %,Complete,Complete %")
for family, count in sorted(all_counter.items(), key=itemgetter(1)):
    print(
        family,
        count,
        count / file_counter,
        complete_counter[family],
        complete_counter[family] / file_counter,
        sep=",",
    )
