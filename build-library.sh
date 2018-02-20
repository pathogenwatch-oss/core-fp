#!/usr/bin/env bash

set -eu -o pipefail

# Not sure what this is used for.
export DEBUG=${DEBUG:-"*,-trace*"}

# Set defaults
CORE_DB_ROOT=${CORE_DB_ROOT:-"$(pwd)/databases"}

# Provide the scheme directory
input_path=$1

scheme_dir=$(cd ${input_path} && pwd)
scheme=$(basename ${input_path});

# First build the BLAST DB if needed
if [[ -d ${CORE_DB_ROOT}/${scheme} ]]; then
  echo "Skipping BlastDb for ${scheme} as already built";
else
  echo "Building $scheme"
  mkdir -p ${CORE_DB_ROOT}/${scheme}
  awk -F ',' '{printf ">%s\n%s\n", $2, $4}' ${scheme_dir}/core.csv | tee ${CORE_DB_ROOT}/${scheme}/core.fa | makeblastdb -title core -in - -dbtype nucl -out ${CORE_DB_ROOT}/${scheme}/core.db
fi

# Now build the FP scheme if needed.
scheme_fp="${CORE_DB_ROOT}/${scheme}/fp.json"
if [[ -f ${scheme_fp} ]]; then
  echo "Skipping FP for ${scheme}";
else
  echo "Building FP for ${scheme}"
  mkdir -p ${CORE_DB_ROOT}/${scheme}
  WGSA_ORGANISM_TAXID=${scheme} node index.js build ${scheme_dir}/fastas/*.fasta
fi

