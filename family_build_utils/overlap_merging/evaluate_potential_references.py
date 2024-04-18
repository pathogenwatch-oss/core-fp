import glob
import sys

import typer


def main(core_size: int, input_dir: str):
    for summary in glob.glob(f"{input_dir}/*.summary"):
        matches = list()
        keep = False
        with open(summary, "r") as f:
            for line in f.readlines():
                name, count = line.strip().split("\t")
                if int(count) > 1:
                    print(name, count, file=sys.stderr)
                    break
                matches.append(name)
            if len(matches) == core_size:
                print(len(matches), file=sys.stderr)
                keep = True
        if keep:
            print(summary.replace(".json.pc.summary", ""))



if __name__ == "__main__":
    typer.run(main)
