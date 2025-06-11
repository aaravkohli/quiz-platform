FROM maven:3.8.4-openjdk-17-slim AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM openjdk:17-slim
WORKDIR /app
COPY --from=build /app/target/quiz-platform-1.0-SNAPSHOT.jar app.jar

# Set environment variables
ENV PORT=8080
ENV DB_HOST=localhost
ENV DB_PORT=5432
ENV DB_NAME=quiz_platform
ENV DB_USER=postgres
ENV DB_PASSWORD=postgres
ENV JWT_SECRET=your-secret-key

# Expose the port
EXPOSE ${PORT}

# Run the application
CMD ["sh", "-c", "java -jar app.jar"] 