# CGPS Core-FP

Identifies core genes from a sequence and compares them to a reference. The core is used for building trees.

## Create a core profile

```
docker run -i --rm -e WGSA_ORGANISM_TAXID=<TAXID> -v <FULL_PATH_TO_SEQENCE>:/data registry.gitlab.com/cgps/cgps-core-fp:<VERSION> query /data/<SEQUENCE_NAME>
```

For example:

```
seq="../wgsa_data/saureus/example.fasta"
docker run -i --rm -e WGSA_ORGANISM_TAXID=1280 -v $(cd $(dirname $seq) && pwd)/$(basename $seq):/data/$(basename $seq) registry.gitlab.com/cgps/cgps-core-fp:latest query /data/$(basename $seq) > $(basename $seq '.fasta').core.json
```

## Run the tests

```
npm test
```

## Build the image

```
./release.sh [major|minor|patch]
```

This updates the version in `package.json`, pushes the commit and tag, and triggers a CI build of the image.

## Building the databases outside of the image

```
docker run -it --rm -v $(pwd):/data -w /data --entrypoint bash registry.gitlab.com/cgps/cgps-core-fp:latest build.sh
```
