FROM node:24-alpine
WORKDIR /app
COPY services ./services
USER node
ARG SERVICE
ENV SERVICE=${SERVICE}
CMD ["sh", "-c", "node services/${SERVICE}.js"]
