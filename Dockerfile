FROM node:14
WORKDIR /home/app/musicquiz

COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 80
CMD [ "node", "index.js" ]
