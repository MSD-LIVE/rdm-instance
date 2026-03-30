#!/bin/bash
########################################################################################################################
# Script Name:  build.sh
# Description:  Build a base RDM image
########################################################################################################################
# Terminate if any command fails
set -e

GREEN='\033[0;32m' # Green text
NC='\033[0m'       # No Color

realpath() {
  OLDPWD=$PWD
  cd "$(dirname "$1")"
  LINK=$(readlink "$(basename "$1")")
  while [ "$LINK" ]; do
    cd "$(dirname "$LINK")"
    LINK=$(readlink "$(basename "$1")")
  done
  REALPATH="$PWD/$(basename "$1")"
  cd "$OLDPWD"
  echo "$REALPATH"
}

# Get correct directories relative to where the script is located so script can be run from any folder
scriptpath=$(realpath "$0")
scriptdir=$(dirname "$scriptpath")

version="$1"
if [[ -z "$version" ]] ; then
    echo "This function requires an RDM version number (e.g., ./build.sh 7.0)."
    exit 1

else
    version_folder="${scriptdir}/${version}"
    path=ghcr.io/msd-live/rdm-base:${version}
    cd $version_folder
    docker build -t ghcr.io/msd-live/rdm-base:${version} --push .

    # If you need to run the built image to check it:
    # docker run -it ghcr.io/msd-live/rdm-base:${version} bash
fi
