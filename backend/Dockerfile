FROM node:20

RUN apt-get update && apt-get install -y python3

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 10000

CMD ["node", "server.js"]