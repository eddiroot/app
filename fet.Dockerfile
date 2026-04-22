FROM --platform=linux/amd64 ubuntu:24.04

ENV FET_VERSION=7.8.5
ENV FET_SHA256=7641ad6c3d31505b7e648fc60bfdc116275a4c771c4c894479127e3ad5bc4a40

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl xz-utils ca-certificates \
        libglib2.0-0t64 libdbus-1-3 libpcre2-8-0 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN curl -fSL \
    "https://lalescu.ro/liviu/fet/download/bin/fet-${FET_VERSION}-bin.tar.xz" \
    -o /tmp/fet.tar.xz && \
    echo "${FET_SHA256}  /tmp/fet.tar.xz" | sha256sum -c - && \
    mkdir -p /opt/fet && \
    tar -xJf /tmp/fet.tar.xz -C /opt/fet --strip-components=1 && \
    rm /tmp/fet.tar.xz

ENV LD_LIBRARY_PATH=/opt/fet/lib
ENV PATH="/opt/fet/bin:${PATH}"

WORKDIR /app
RUN mkdir -p /app/timetables

CMD ["tail", "-f", "/dev/null"]
