FROM node:12-alpine AS web
RUN mkdir -p /web
WORKDIR /web
COPY packages/web/package.json packages/web/yarn.lock /web/
RUN yarn
COPY packages/web /web
ARG FIREBASE_CONFIG
RUN yarn build

FROM node:12-alpine
RUN mkdir -p /server
WORKDIR /server
RUN apk add python alpine-sdk
COPY packages/server/package.json packages/server/yarn.lock /server/
RUN yarn
COPY packages/server /server
RUN yarn build
RUN yarn install --production --ignore-scripts --prefer-offline
COPY --from=web /web/dist /server/public
EXPOSE 8080
CMD [ "yarn", "start" ]