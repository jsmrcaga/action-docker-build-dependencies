ARG BASE_IMAGE=npm_deps

FROM node:18-alpine AS npm_deps

RUN mkdir /code
WORKDIR /code

COPY ./package.json /code
COPY ./package-lock.json /code

RUN npm i

# Actual image
FROM $BASE_IMAGE AS final

COPY . /code

CMD npm test
