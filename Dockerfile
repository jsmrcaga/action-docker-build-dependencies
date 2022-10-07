ARG BASE_IMAGE=npm_deps

FROM node:18-alpine as npm_deps

RUN mkdir /code
WORKDIR /code

COPY ./package.json /code
COPY ./package-lock.json /code

RUN npm i

# Actual image
FROM npm_deps

COPY . /code

CMD npm test
