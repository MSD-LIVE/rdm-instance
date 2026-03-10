ARG BUILDPLATFORM=linux/amd64
FROM --platform=$BUILDPLATFORM python:3.12-slim-bullseye

USER root

# System + locale packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    locales \
    git \
    build-essential \
    gcc \
    pkg-config \
    curl \
    ca-certificates \
    procps htop less \
    strace lsof file \
    iotop iftop \
    tcpdump dnsutils \
    libffi-dev \
    libpq-dev \
    libxml2-dev \
    libxslt1-dev \
    libcairo2-dev \
    imagemagick \
    libssl-dev \
    libbz2-dev \
    xz-utils \
    libsqlite3-dev \
    xmlsec1 \
    && rm -rf /var/lib/apt/lists/*

# Set locale (same as previous image)
RUN echo "en_US.UTF-8 UTF-8" > /etc/locale.gen && locale-gen
RUN localedef --quiet -c -i en_US -f UTF-8 en_US.UTF-8
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

# Upgrade pip + install pipenv
RUN pip install --no-cache-dir --upgrade pip pipenv wheel

# Install Node.js 22
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get update && apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt/lists/*

# Working directory setup
ENV INVENIO_INSTANCE_PATH=/opt/invenio/instance
RUN mkdir -p ${INVENIO_INSTANCE_PATH}
WORKDIR ${INVENIO_INSTANCE_PATH}

# Install invenio-cli FIRST to prevent click conflicts
RUN pip install --no-cache-dir invenio-cli

# have to copy the site folder or else the pipenv install will fail
COPY site ./site

# Copy Pipenv files and install Python deps globally
COPY Pipfile Pipfile.lock ${INVENIO_INSTANCE_PATH}/
RUN pipenv sync --system

# Add invenio metadata and uwsgi config
COPY .invenio ${INVENIO_INSTANCE_PATH}/.invenio
COPY .invenio.private ${INVENIO_INSTANCE_PATH}/.invenio.private
COPY uwsgi ${INVENIO_INSTANCE_PATH}/uwsgi

# Create RDM folders
RUN mkdir -p \
    ${INVENIO_INSTANCE_PATH}/data \
    ${INVENIO_INSTANCE_PATH}/archive \
    ${INVENIO_INSTANCE_PATH}/static \
    ${INVENIO_INSTANCE_PATH}/assets \
    ${INVENIO_INSTANCE_PATH}/templates \
    ${INVENIO_INSTANCE_PATH}/app_data

# Node memory for webpack builds
ENV NODE_OPTIONS='--max_old_space_size=5120'


# docker build -t my-invenio-3.12 .