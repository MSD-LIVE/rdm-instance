########################################################################################################################
# Dockerfile to create a base image with Invenio RDM Dependencies.
# Base image: python:3.12-slim-bullseye
# Includes: Python 3.12 system-wide, Pip, Pipenv, Node.js 14, PostgreSQL 12 client, Docker client, and common build tools
########################################################################################################################

FROM python:3.12-slim-bullseye

# Set root user
USER root

# Install OS packages required by Invenio
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    software-properties-common \
    curl \
    git \
    rlwrap \
    screen \
    nano \
    vim \
    emacs-nox \
    locales \
    libffi-dev \
    libxml2-dev \
    libxslt-dev \
    libcairo2-dev \
    fonts-dejavu \
    imagemagick \
    gnupg \
    lsb-release \
    ca-certificates \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Set locale
RUN sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && locale-gen en_US.UTF-8
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8

# Upgrade pip, setuptools, wheel, pipenv system-wide
RUN pip install --upgrade pip setuptools wheel pipenv

# Install Node.js 14
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Docker client
RUN apt-get update && apt-get install -y --no-install-recommends \
    docker.io \
    && rm -rf /var/lib/apt/lists/*

# Install docker-compose
RUN curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" \
    -o /usr/local/bin/docker-compose \
    && chmod +x /usr/local/bin/docker-compose

# Install PostgreSQL 12 client
RUN sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list' \
    && wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - \
    && apt-get update \
    && apt-get install -y postgresql-client-12 \
    && rm -rf /var/lib/apt/lists/*

# Create Invenio working directory
ENV INVENIO_INSTANCE_PATH=/opt/invenio/instance
RUN mkdir -p ${INVENIO_INSTANCE_PATH}

WORKDIR ${INVENIO_INSTANCE_PATH}

# Install invenio-cli first to avoid pip conflicts
RUN pip install invenio-cli

# Default user
USER root

# Create working directory
RUN mkdir -p /opt/app-root/data

# Set working directory
WORKDIR /opt/app-root/data

ENTRYPOINT ["tail", "-f", "/dev/null"]