#!/bin/bash

set -eu -o pipefail

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
  mkdir -p databases/${scheme}/references;
  for ref in $(ls $scheme_dir/fastas/*.fasta); do
    ref_name=$(basename $ref '.fasta');
    if [[ -f databases/${scheme}/references/${ref_name}.core.json ]]; then
      echo "Skipping core for $ref";
    else
      echo "Building core for $ref";
      DEBUG='*' WGSA_ORGANISM_TAXID=$scheme node index.js $ref > databases/${scheme}/references/${ref_name}.core.json
    fi
  done
done
