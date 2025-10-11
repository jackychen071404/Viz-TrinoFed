# Trino Kafka Parser Backend

Backend service for parsing and processing Trino query events from Kafka.

## Features

- **Kafka Consumer**: Consumes Trino query events from Kafka topics
- **JSON Parsing**: Parses query events using Jackson
- **Query Tree Reconstruction**: Builds hierarchical query trees from events
- **REST API**: Provides endpoints for frontend to fetch query data
- **WebSocket Support**: Real-time updates via WebSocket connections
- **CORS Enabled**: Configured for frontend at localhost:5173

## Tech Stack

- Java 17 to Java 21
- Spring Boot 3.2.1
- Spring Kafka
- Jackson (JSON processing)
- Lombok
- Maven

## Prerequisites

- JDK 17 or higher
- Maven 3.6+
- Kafka instance running (configured in application.yml)

## Getting Started

### 1. Configure Application

Edit `src/main/resources/application.yml` to match your Kafka configuration:

```yaml
spring:
  kafka:
    bootstrap-servers: localhost:9092  # Your Kafka broker
trino:
  kafka:
    topic: trino-query-events  # Your Kafka topic name
```

### 2. Build the Project

```bash
mvn clean install
```

### 3. Run the Application

```bash
mvn spring-boot:run
```

Or run from IntelliJ IDEA:
- Open the project in IntelliJ IDEA
- Wait for Maven to download dependencies
- Run `TrinoKafkaParserApplication.java`

The application will start on `http://localhost:8080`

## API Endpoints

### REST API

- `GET /api/queries` - Get all query trees
- `GET /api/queries/{queryId}` - Get specific query tree by ID
- `GET /api/queries/ids` - Get all query IDs

### WebSocket

- Connect to: `ws://localhost:8080/ws`
- Subscribe to: `/topic/query-updates`
- Receives real-time query tree updates

## Project Structure

```
backend/
├── src/main/java/com/trinofed/parser/
│   ├── config/           # Configuration classes
│   │   ├── KafkaConsumerConfig.java
│   │   ├── WebSocketConfig.java
│   │   └── CorsConfig.java
│   ├── consumer/         # Kafka consumers
│   │   └── TrinoEventConsumer.java
│   ├── controller/       # REST controllers
│   │   └── QueryController.java
│   ├── model/            # Data models
│   │   ├── QueryEvent.java
│   │   ├── QueryTree.java
│   │   └── QueryTreeNode.java
│   ├── service/          # Business logic
│   │   └── QueryEventService.java
│   └── TrinoKafkaParserApplication.java
└── src/main/resources/
    └── application.yml   # Application configuration
```

## Development

### IntelliJ IDEA Setup

1. Open IntelliJ IDEA
2. File → Open → Select the `backend` folder
3. Wait for Maven to import dependencies
4. Enable Lombok plugin (if not already enabled):
   - File → Settings → Plugins → Search "Lombok" → Install
5. Enable annotation processing:
   - File → Settings → Build, Execution, Deployment → Compiler → Annotation Processors
   - Check "Enable annotation processing"

### Testing with Kafka

You can use the docker-compose setup in the parent directory:

```bash
cd ..
docker-compose up -d
```

This will start Kafka and Trino with the event listener configured.

## Customization

### Adapting to Your Trino Events

The current implementation provides a basic structure for parsing Trino events. You'll need to:

1. Update `QueryEvent.java` fields to match your actual Trino event structure
2. Modify `QueryEventService.buildTreeFromEvents()` to correctly parse your event hierarchy
3. Adjust the tree construction logic based on your Trino stage and operator statistics

### Adding Authentication

To add security:

1. Add Spring Security dependency to `pom.xml`
2. Create security configuration
3. Implement JWT or OAuth2 authentication

## Troubleshooting

### Port Already in Use
If port 8080 is already in use, change it in `application.yml`:
```yaml
server:
  port: 8081
```

### Kafka Connection Issues
Verify Kafka is running and accessible:
```bash
docker ps  # Check if Kafka container is running
```

### Lombok Not Working
Make sure annotation processing is enabled in IntelliJ IDEA settings.
