import csv
import glob
import sys
from collections import defaultdict

import typer


def main(directory: str):
    glob_expr = f'{directory}/*.summary'
    file_count = 0
    paralogues = defaultdict(list)
    for pc_file in glob.glob(glob_expr):
        file_count += 1
        with open(pc_file, 'r') as f:
            reader = csv.reader(f, delimiter='\t')
            for line in reader:
                if int(line[1]) > 1:
                    paralogues[line[0]].append(int(line[1]))

    writer = csv.writer(sys.stdout)
    writer.writerow(["Name", "# occurrences", '% occurrences', "range"])
    for paralogue_name in paralogues.keys():
        writer.writerow(
            [paralogue_name,
             len(paralogues[paralogue_name]),
             len(paralogues[paralogue_name]) / file_count,
             f"{sorted(list(set(paralogues[paralogue_name])))}"]
        )


if __name__ == "__main__":
    typer.run(main)
