FROM node:20-alpine
WORKDIR /app
COPY playfiver-proxy.js ./
ENV PORT=8080
EXPOSE 8080
CMD ["node", "playfiver-proxy.js"]
