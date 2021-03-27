#!/usr/bin/env bash

echo "shared_preload_libraries = 'pg_jieba.so'" >> /var/lib/postgresql/data/postgresql.conf
pg_ctl -o "-c listen_addresses='localhost'" -w restart

cd /app
node ./server-dist/db/init.js
