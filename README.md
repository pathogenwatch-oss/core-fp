# CGPS Core-FP [![pipeline status](https://gitlab.com/cgps/cgps-core-fp/badges/master/pipeline.svg)](https://gitlab.com/cgps/cgps-core-fp/commits/master)

Identifies core genes from a sequence and compares them to a reference. The core is used for building trees.

## Create a core profile

```
docker run -i --rm -v <FULL_PATH_TO_SEQENCE>:/data registry.gitlab.com/cgps/cgps-core-fp:<VERSION> query /data/<SEQUENCE_NAME>
```

For example:

```
seq="../wgsa_data/saureus/example.fasta"
docker run -i -v $(cd $(dirname $seq) && pwd)/$(basename $seq):/data/$(basename $seq) registry.gitlab.com/cgps/cgps-core-fp:latest query /data/$(basename $seq) > $(basename $seq '.fasta').core.json
```

## Run the tests

```
npm test
```

## Building the databases outside of the image

```
docker run -it --rm -v $(pwd):/data -w /data --entrypoint bash registry.gitlab.com/cgps/cgps-core-fp:latest build.sh
```

## Creating the images for production

Run the `build-images.sh` script:
```
./build-images.sh v2.0.2
```