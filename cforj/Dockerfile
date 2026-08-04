FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY server.js package.json ./
RUN mkdir -p courses
EXPOSE 3050
ENV PORT=3050
CMD ["node", "server.js"]
