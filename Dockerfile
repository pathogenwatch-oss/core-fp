FROM ubuntu:latest as blast

RUN apt-get update -y && \
    apt-get --no-install-recommends install -y wget tar && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    wget --no-check-certificate https://ftp.ncbi.nlm.nih.gov/blast/executables/blast+/2.15.0/ncbi-blast-2.15.0+-x64-linux.tar.gz && \
    tar xzvf ncbi-blast-2.15.0+-x64-linux.tar.gz && \
    mkdir /blast && \
    mv ncbi-blast-2.15.0+/bin/blastn ncbi-blast-2.15.0+/bin/makeblastdb /blast && \
    rm -rf ncbi-blast*

FROM node:13 as code

WORKDIR /usr/local/cgps-core-fp

COPY package.json /usr/local/cgps-core-fp/

COPY package-lock.json /usr/local/cgps-core-fp/

COPY index.js /usr/local/cgps-core-fp/

COPY src /usr/local/cgps-core-fp/src

RUN npm install --production

FROM node:13 as base

ENV CORE_DB_ROOT="/usr/local/cgps-core-fp/databases"

WORKDIR /usr/local/cgps-core-fp

COPY --from=blast /blast/ /usr/local/bin/

COPY --from=code /usr/local/cgps-core-fp/index.js /usr/local/cgps-core-fp/index.js

COPY --from=code /usr/local/cgps-core-fp/src /usr/local/cgps-core-fp/src

COPY --from=code /usr/local/cgps-core-fp/node_modules /usr/local/cgps-core-fp/node_modules

FROM base as databases

ARG species

COPY build.sh /usr/local/cgps-core-fp/

COPY build-library.sh /usr/local/cgps-core-fp/

COPY schemes/$species /usr/local/cgps-core-fp/schemes/$species

RUN echo $( ls /usr/local/cgps-core-fp/schemes ) && \
    mkdir -p $CORE_DB_ROOT && \
    bash build.sh && \
    rm -rf /usr/local/cgps-core-fp/schemes/*/references && \
    rm -f /usr/local/cgps-core-fp/schemes/*/core.csv && \
    rm -f /usr/local/cgps-core-fp/schemes/*/*_ks.jsn

FROM base

ARG species

COPY --from=databases /usr/local/cgps-core-fp/databases /usr/local/cgps-core-fp/databases

COPY --from=databases /usr/local/cgps-core-fp/schemes /usr/local/cgps-core-fp/schemes

ENV SPECIES=$species

RUN echo "export WGSA_ORGANISM_TAXID=$SPECIES\nnode /usr/local/cgps-core-fp/index.js \$@" > /run.sh

ENTRYPOINT ["/bin/bash", "/run.sh"]
