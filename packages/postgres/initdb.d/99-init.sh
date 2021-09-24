#!/usr/bin/env bash

echo "shared_preload_libraries = 'pg_jieba.so'" >> /var/lib/postgresql/data/postgresql.conf
pg_ctl -o "-c listen_addresses='localhost'" -w restart

cd /app

if [[ -d "./lib" ]]; then
    node ./lib/init.js
else
    yarn ts ./src/init.ts
fi
