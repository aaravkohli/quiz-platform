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
ENV DATABASE_URL=jdbc:postgresql://dpg-d14ib7h5pdvs73f77kdg-a/quiz_platform_db
ENV DB_USER=quiz_platform_db_user
ENV DB_PASSWORD=EZ8IhYi0YV4G19zHmYmGE6kN4Rgkdj7d
ENV JWT_SECRET=zBttzkQxkeGhKkoZOikQU5NhF2F3nvDwby423ic/LMI=

# Expose the port
EXPOSE ${PORT}

# Run the application with debug logging
CMD ["sh", "-c", "java -Dorg.slf4j.simpleLogger.logLevel=DEBUG -jar app.jar"] 