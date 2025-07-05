FROM node:16
LABEL MAINTAINER Copain Fabrice <bienaimecopain@gmail.com>

RUN yarn global add pm2@latest

WORKDIR /usr/src/app
COPY package*.json ./

# Bundle app source
COPY . .

# RUN npm ci --only=production

EXPOSE 8080

RUN yarn add jest --save-dev

CMD [ "yarn", "run", "test", "pm2-runtime", "./config/pm2.json"]