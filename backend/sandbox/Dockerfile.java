FROM eclipse-temurin:21-jdk-alpine
# GNU coreutils for `timeout`
RUN apk add --no-cache coreutils
WORKDIR /sandbox
CMD ["sh"]
