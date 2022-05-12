FROM node:13

RUN apt-get update -y && \
    apt-get --no-install-recommends install -y wget tar && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    wget ftp://ftp.ncbi.nlm.nih.gov/blast/executables/blast+/2.7.1/ncbi-blast-2.7.1+-x64-linux.tar.gz && \
    tar xzvf ncbi-blast-2.7.1+-x64-linux.tar.gz && \
    mv ncbi-blast-2.7.1+/bin /blast && \
    cp /blast/blastn /blast/makeblastdb /usr/local/bin/ && \
    rm -rf /blast

WORKDIR /usr/local/cgps-core-fp

COPY package.json package-lock.json build.sh build-library.sh index.js /usr/local/cgps-core-fp/
COPY src /usr/local/cgps-core-fp/src
COPY schemes /usr/local/cgps-core-fp/schemes
ENV CORE_DB_ROOT="/usr/local/cgps-core-fp/databases"
RUN npm install --production && \
    mkdir -p $CORE_DB_ROOT && \
    bash build.sh && \
    rm -rf /usr/local/cgps-core-fp/schemes/*/references

ENTRYPOINT ["node", "/usr/local/cgps-core-fp/index.js"]
