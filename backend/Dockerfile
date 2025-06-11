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
ENV DATABASE_URL=postgresql://quiz_platform_db_user:EZ8IhYi0YV4G19zHmYmGE6kN4Rgkdj7d@dpg-d14ib7h5pdvs73f77kdg-a.singapore-postgres.render.com/quiz_platform_db
ENV JWT_SECRET=your-secret-key

# Expose the port
EXPOSE ${PORT}

# Run the application
CMD ["sh", "-c", "java -jar app.jar"] 