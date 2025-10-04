# --------------------------
# Build Stage
# --------------------------
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Copy Maven wrapper and pom
COPY mvnw pom.xml ./
COPY .mvn .mvn

# Copy source code
COPY src src

# Build the application
RUN ./mvnw clean package -DskipTests

# --------------------------
# Run Stage
# --------------------------
FROM eclipse-temurin:21-jre-alpine:latest
WORKDIR /app

# Copy the jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
