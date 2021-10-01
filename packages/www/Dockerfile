FROM node:14 AS builder

RUN apt-get update
RUN apt-get install -y jq

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile
COPY . .
RUN yarn build
RUN jq 'del(.devDependencies)' package.json > tmp.json && mv tmp.json package.json
RUN yarn --frozen-lockfile

# ENTRYPOINT [ "yarn", "start" ]

FROM node:14
COPY --from=builder /app/node_modules /node_modules
COPY --from=builder /app/public /public
COPY --from=builder /app/server-dist /server-dist
COPY --from=builder /app/tsconfig.* /app/trad.dict.txt /
ENTRYPOINT ["node", "-r", "tsconfig-paths/register", "server-dist/index.js"]
