## Create a core profile

```
docker run -i --rm -e WGSA_ORGANISM_TAXID=<TAXID> -v <FULL_PATH_TO_SEQENCE>:/data registry.gitlab.com/cgps/cgps-core-fp:<VERSION> query /data/<SEQUENCE_NAME>
```

For example:

```
seq="../wgsa_data/saureus/example.fasta"
docker run -i --rm -e WGSA_ORGANISM_TAXID=1280 -v $(cd $(dirname $seq) && pwd)/$(basename $seq):/data/$(basename $seq) registry.gitlab.com/cgps/cgps-core-fp:n6 query /data/$(basename $seq) > $(basename $seq '.fasta').core.json
```

## Run the tests

```
npm test
```

## Build the container

docker build -t registry.gitlab.com/cgps/cgps-core-fp:<VERSION> .

## Building the databases outside image

docker run -it --rm -v $(pwd):/data -w /data --entrypoint bash cgps-core-fg:n1 build.sh
