FROM node:20-alpine

WORKDIR /app

COPY . .

WORKDIR /app/backend

RUN npm install

EXPOSE 5000

CMD ["node", "server.js"]