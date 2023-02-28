#!/usr/bin/env bash

# Build the images for PW
set -eu -o pipefail

VERSION=$1

DEFAULT_REGISTRY="registry.gitlab.com/cgps/cgps-core-fp"

REGISTRY=${2:-"${DEFAULT_REGISTRY}"}

# Set the number of threads to use
NTHREADS=0

if [ -z ${3+x} ]; then
  proc_count=$(cat /proc/cpuinfo | awk '/^processor/{print $3}' | tail -1)
  if [ "${proc_count}" -gt "1" ]; then
    NTHREADS=$(expr ${proc_count} - 1) # Leave one core for other processes
  else
    NTHREADS=1
  fi
  echo "NTHREADS is ${NTHREADS}"
else
  NTHREADS=$3
  echo "var is set to 'NTHREADS'"
fi
# The multithreading appeared to be causing an issue in the build, but it wasn't clear. Needs further testing.
NTHREADS=1
TAG_BASE="${REGISTRY}":"${VERSION}"

find ./schemes -mindepth 1 -maxdepth 1 -type d | \
  xargs -I taxid basename taxid | \
  xargs -P "${NTHREADS}" -I xxx sh -c 'echo ${1}-${2} && docker build --rm --build-arg species=${2} -t ${1}-${2} . && docker push ${1}-${2}' -- "${TAG_BASE}" xxx

cd schemes

docker build --rm -t "${REGISTRY}":schemes-"${VERSION}" .
docker push "${REGISTRY}":schemes-"${VERSION}"
