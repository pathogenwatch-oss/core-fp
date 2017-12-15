## Create a core profile

```
docker run -i --rm -v -e WGSA_ORGANISM_TAXID=<TAXID> <FULL_PATH_TO_SEQENCE>:/data cgps-core-fp:<VERSION> /data/<SEQUENCE_NAME>
```

For example:

```
seq="../wgsa_data/saureus/example.fasta"
docker run -i --rm -e WGSA_ORGANISM_TAXID=1280 -v $(cd $(dirname $seq) && pwd)/$(basename $seq):/data/$(basename $seq) cgps-core-fp:n1 /data/$(basename $seq) > $(basename $seq '.fasta').core.json
```


## Build the container

docker build -t cgps-core-fp:<VERSION> .

## Building the databases outside image

docker run -it --rm -v $(pwd):/data -w /data --entrypoint bash cgps-core-fg:n1 build.sh
