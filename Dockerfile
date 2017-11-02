FROM node:8.7.0

LABEL maintainer="vunguyenhung"

RUN mkdir -p /kafka-node-driver
WORKDIR /kafka-node-driver

COPY . .

RUN npm install