FROM node:20-alpine
# docker-cli lets the backend spawn sibling sandbox containers via the
# mounted /var/run/docker.sock (Docker-out-of-Docker pattern).
RUN apk add --no-cache docker-cli
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["node", "src/index.js"]
