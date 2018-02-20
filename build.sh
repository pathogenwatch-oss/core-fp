#!/usr/bin/env bash

# Accepts a single numerical argument to specify the number of threads to use. Otherwise defaults to all available - 1

set -eu -o pipefail
export DEBUG=${DEBUG:-"*,-trace*"}

# Set the number of threads to use
nthreads=0

if [ -z ${1+x} ]; then
  proc_count=`cat /proc/cpuinfo | awk '/^processor/{print $3}' | tail -1`;
  if [ "${proc_count}" -gt "1" ]; then
    nthreads=`expr $proc_count - 1`; # Leave one core for other processes
  else
    nthreads=1;
  fi
  echo "nthreads is ${nthreads}";
else
  nthreads=$1;
  echo "var is set to 'nthreads'";
fi

find ./schemes -mindepth 1 -maxdepth 1 -type d -print0 | xargs -0 -P ${nthreads} -I scheme ./build-library.sh scheme

#for d in $(find ./schemes -mindepth 1 -maxdepth 1 -type d); do
#  scheme_dir=$(cd $d && pwd)
#  scheme=$(basename $d);
#  if [[ -d ${CORE_DB_ROOT}/$scheme ]]; then
#    echo "Skipping BlastDb for $scheme";
#  else
#    echo "Building $scheme"
#    mkdir -p ${CORE_DB_ROOT}/$scheme
#    awk -F ',' '{printf ">%s\n%s\n", $2, $4}' ${scheme_dir}/core.csv | tee ${CORE_DB_ROOT}/${scheme}/core.fa | makeblastdb -title core -in - -dbtype nucl -out ${CORE_DB_ROOT}/${scheme}/core.db
#  fi
#  scheme_fp="${CORE_DB_ROOT}/${scheme}/fp.json"
#  if [[ -f $scheme_fp ]]; then
#    echo "Skipping FP for $scheme";
#  else
#    echo "Building FP for $scheme"
#    mkdir -p ${CORE_DB_ROOT}/$scheme
#    WGSA_ORGANISM_TAXID=$scheme node index.js build ${scheme_dir}/fastas/*.fasta
#  fi
#done
