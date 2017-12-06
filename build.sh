#!/bin/bash

set -eu -o pipefail

for d in $(find ./schemes -mindepth 1 -maxdepth 1 -type d); do
  scheme_dir=$(cd $d && pwd)
  scheme=$(basename $d);
  if [[ -d databases/$scheme ]]; then
    echo "Skipping $scheme";
    continue;
  fi
  echo "Building $scheme"
  mkdir -p databases/$scheme
  awk -F ',' '{printf ">%s\n%s\n", $2, $4}' ${scheme_dir}/core.csv | tee databases/${scheme}/core.fa | makeblastdb -title core -in - -dbtype nucl -out databases/${scheme}/core.db  
done
