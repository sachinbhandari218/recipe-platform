FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
ENV MAVEN_OPTS="-Xmx384m -XX:+UseSerialGC"
COPY pom.xml .
COPY src ./src
COPY data ./data
COPY uploads ./uploads
COPY css ./css
COPY js ./js
COPY icons ./icons
COPY index.html ./
COPY manifest.json ./
COPY sw.js ./
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/recipe-platform-2.0.0.jar ./app.jar
COPY data ./data
COPY uploads ./uploads
COPY css ./css
COPY js ./js
COPY icons ./icons
COPY index.html ./
COPY manifest.json ./
COPY sw.js ./
EXPOSE 8080 10000
CMD ["java", "-Xmx384m", "-XX:+UseSerialGC", "-jar", "app.jar"]
