#!/usr/bin/env bash
set -e
USER=swadmin
HOST=192.168.11.88
DIR=/storagepool/web-home/portal/cloud

#swift build -c release --static-swift-stdlib
rsync -avz --delete dist/ ${USER}@${HOST}:${DIR}

exit 0