#!/usr/bin/env bash

pg_ctl -o "-c listen_addresses='localhost'" -w restart

cd /app
node ./server-dist/db/init.js
