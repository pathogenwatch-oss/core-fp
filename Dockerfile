FROM node:8

RUN apt-get update && apt-get install -y wget tar
RUN wget ftp://ftp.ncbi.nlm.nih.gov/blast/executables/LATEST/ncbi-blast-2.7.1+-x64-linux.tar.gz
RUN tar xzvf ncbi-blast-2.7.1+-x64-linux.tar.gz
RUN mv ncbi-blast-2.7.1+/bin /blast && \
    cp /blast/blastn /blast/makeblastdb /usr/local/bin/
