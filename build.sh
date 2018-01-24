#!/bin/bash

set -eu -o pipefail
export DEBUG=${DEBUG:-"*,-trace*"}
CORE_DB_ROOT=${CORE_DB_ROOT:-"$(pwd)/databases"}

for d in $(find ./schemes -mindepth 1 -maxdepth 1 -type d); do
  scheme_dir=$(cd $d && pwd)
  scheme=$(basename $d);
  if [[ -d ${CORE_DB_ROOT}/$scheme ]]; then
    echo "Skipping BlastDb for $scheme";
  else
    echo "Building $scheme"
    mkdir -p ${CORE_DB_ROOT}/$scheme
    awk -F ',' '{printf ">%s\n%s\n", $2, $4}' ${scheme_dir}/core.csv | tee ${CORE_DB_ROOT}/${scheme}/core.fa | makeblastdb -title core -in - -dbtype nucl -out ${CORE_DB_ROOT}/${scheme}/core.db  
  fi
  scheme_fp="${CORE_DB_ROOT}/${scheme}/fp.json"
  if [[ -f $scheme_fp ]]; then
    echo "Skipping FP for $scheme";
  else
    echo "Building FP for $scheme"
    mkdir -p ${CORE_DB_ROOT}/$scheme
    WGSA_ORGANISM_TAXID=$scheme node index.js build ${scheme_dir}/fastas/*.fasta
  fi
done
