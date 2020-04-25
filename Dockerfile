FROM node:10-alpine AS web
RUN mkdir -p /web
WORKDIR /web
COPY packages/web/package.json /web
RUN npm i
COPY packages/web /web
RUN npm run build

FROM node:12-alpine
RUN mkdir -p /server
WORKDIR /server
RUN apk add python alpine-sdk
COPY packages/server/package.json /server
RUN npm i
COPY --from=web /web/dist /server/public
COPY packages/server /server
RUN npm run build
RUN npm prune
EXPOSE 8080
CMD [ "npm", "start" ]