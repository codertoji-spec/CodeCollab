FROM golang:1.23-alpine
RUN apk add --no-cache coreutils
ENV CGO_ENABLED=0
WORKDIR /sandbox
CMD ["sh"]
