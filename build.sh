#!/usr/bin/env bash

# Accepts a single numerical argument to specify the number of threads to use. Otherwise defaults to all available - 1

set -eu -o pipefail
export DEBUG=${DEBUG:-"*,-trace*"}

# Set the number of threads to use
nthreads=0

if [ -z ${1+x} ]; then
  proc_count=`cat /proc/cpuinfo | awk '/^processor/{print $3}' | tail -1`;
  if [ "${proc_count}" -gt "1" ]; then
    nthreads=`expr ${proc_count} - 1`; # Leave one core for other processes
  else
    nthreads=1;
  fi
  echo "nthreads is ${nthreads}";
else
  nthreads=$1;
  echo "var is set to 'nthreads'";
fi

find ./schemes -mindepth 1 -maxdepth 1 -type d -print0 | xargs -0 -P ${nthreads} -I scheme ./build-library.sh scheme
