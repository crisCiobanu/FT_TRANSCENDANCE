FROM node:18-alpine3.15
WORKDIR /usr/src/app
COPY --chown=node:node package*.json ./
RUN npm ci
COPY --chown=node:node . .
#USER node
CMD ["npm", "run", "start:dev"]