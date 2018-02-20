FROM node:8

RUN apt-get update && apt-get install -y wget tar
RUN wget ftp://ftp.ncbi.nlm.nih.gov/blast/executables/blast+/2.7.1/ncbi-blast-2.7.1+-x64-linux.tar.gz
RUN tar xzvf ncbi-blast-2.7.1+-x64-linux.tar.gz
RUN mv ncbi-blast-2.7.1+/bin /blast && \
    cp /blast/blastn /blast/makeblastdb /usr/local/bin/ && \
    mkdir -p /usr/local/cgps-core-fp/src /usr/local/cgps-core-fp/schemes

WORKDIR /usr/local/cgps-core-fp

COPY package.json /usr/local/cgps-core-fp/
RUN npm install

COPY build.sh build-library.sh index.js /usr/local/cgps-core-fp/
COPY src /usr/local/cgps-core-fp/src/
COPY schemes /usr/local/cgps-core-fp/schemes/

ENV CORE_DB_ROOT="/opt/core-fp/databases"
RUN mkdir -p $CORE_DB_ROOT

RUN bash build.sh

ENTRYPOINT ["node", "/usr/local/cgps-core-fp/index.js"]
