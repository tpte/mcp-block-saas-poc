FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV SERVE_STATIC=true

EXPOSE 8787
CMD ["npm", "run", "start"]
