#!/usr/bin/env bash

# Accepts a single numerical argument to specify the number of threads to use. Otherwise defaults to all available - 1
set -eu -o pipefail
export DEBUG=${DEBUG:-"*,-trace*"}

# If you only want to run specific species, add their codes to the array below, otherwise everything is done.
# e.g. for pneumo & staph only do_only=(1313 1280);
do_only=();

echo "Starting reference build."

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

# Generate the include string (has a superfluous ' -o' at the end).
name_cmd=$(printf ' -name %s -o ' "${do_only[@]}");
clean=${name_cmd::-3};
echo "Restricted to ${clean}";

# The actual work.
find ./schemes ${clean} -mindepth 1 -maxdepth 1 -type d | xargs -P ${nthreads} -I scheme ./build-library.sh scheme
