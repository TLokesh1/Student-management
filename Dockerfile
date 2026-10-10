# Root Dockerfile routing to backend/
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Copy Maven wrapper and POM from backend
COPY backend/.mvn/ backend/.mvn/
COPY backend/mvnw backend/pom.xml ./backend/

WORKDIR /app/backend
RUN chmod +x ./mvnw && ./mvnw dependency:go-offline -B

# Copy source code and build
COPY backend/src/ ./src/
RUN ./mvnw clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build /app/backend/target/student-management-0.0.1-SNAPSHOT.jar app.jar
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
