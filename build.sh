#!/bin/bash

set -eu -o pipefail
export DEBUG=${DEBUG:-"*,-trace*"}

for d in $(find ./schemes -mindepth 1 -maxdepth 1 -type d); do
  scheme_dir=$(cd $d && pwd)
  scheme=$(basename $d);
  if [[ -d databases/$scheme ]]; then
    echo "Skipping BlastDb for $scheme";
  else
    echo "Building $scheme"
    mkdir -p databases/$scheme
    awk -F ',' '{printf ">%s\n%s\n", $2, $4}' ${scheme_dir}/core.csv | tee databases/${scheme}/core.fa | makeblastdb -title core -in - -dbtype nucl -out databases/${scheme}/core.db  
  fi
  scheme_fp="databases/${scheme}/fp.json"
  if [[ -f $scheme_fp ]]; then
    echo "Skipping FP for $scheme";
  else
    echo "Building FP for $scheme"
    mkdir -p databases/$scheme
    WGSA_ORGANISM_TAXID=$scheme node index.js build ${scheme_dir}/fastas/*.fasta
  fi
done
