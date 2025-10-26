# JSON Plan Parsing Implementation

## Overview
This document describes the implementation of JSON parsing for Trino query execution plans in the Viz-TrinoFed backend.

## Issue
GitHub Issue #72: Implement JSON Parsing for Actual Query Execution Plan

## What Was Implemented

### 1. New Model Classes for Plan Structure
Created three new model classes in `com.trinofed.parser.model.plan` package:

#### `PlanNode.java`
- Represents a single operator node in the Trino query execution plan
- Contains:
  - `id`: Unique identifier for the node
  - `name`: Operator name (e.g., TableScan, Filter, Join, Output)
  - `descriptor`: Additional operator-specific information
  - `outputs`: List of output columns
  - `details`: Operator details
  - `estimates`: Cost estimates (CPU, memory, network)
  - `children`: Child operators in the tree

#### `PlanOutput.java`
- Represents an output column from an operator
- Fields:
  - `type`: Data type (e.g., "integer", "varchar(100)")
  - `name`: Column name

#### `PlanEstimate.java`
- Represents cost estimates for an operator
- Fields:
  - `outputRowCount`: Estimated row count
  - `outputSizeInBytes`: Estimated size
  - `cpuCost`, `memoryCost`, `networkCost`: Resource costs

### 2. QueryPlanParser Service
Created `QueryPlanParser.java` service in `com.trinofed.parser.service`:

**Key Methods:**
- `parseJsonPlan(String jsonPlanString)`: Main parsing method
  - Parses the JSON plan string into a hierarchical QueryTreeNode structure
  - Handles the fragment-based format (e.g., {"0": {...}, "1": {...}})
  - Returns the root node of the parsed tree

- `convertPlanNodeToTreeNode(PlanNode, String)`: Recursive converter
  - Converts PlanNode objects to QueryTreeNode objects
  - Preserves all operator information in the metadata field
  - Recursively processes children

- `extractOperatorList(String jsonPlanString)`: Utility method
  - Extracts a flat list of all operators in the plan
  - Useful for quick analysis

### 3. Updated Existing Models

#### `TrinoEventWrapper.java`
Added `jsonPlan` field to `QueryMetadata` class:
```java
@JsonProperty("jsonPlan")
private String jsonPlan;
```

Updated `toQueryEvent()` method to include jsonPlan in the conversion.

#### `QueryEvent.java`
Added `jsonPlan` field:
```java
@JsonProperty("jsonPlan")
private String jsonPlan;
```

### 4. Enhanced QueryEventService

Updated `QueryEventService.java` to use the new parser:

**Changes:**
- Added `QueryPlanParser` dependency injection
- Modified `buildTreeFromEvents()` to prioritize JSON plan parsing
- Added `enrichTreeWithEventData()` to combine parsed plan with event metadata
- Kept legacy `buildTreeFromEventMetadata()` as fallback for backward compatibility

**Logic Flow:**
1. First, check if any event has a jsonPlan
2. If yes, parse it using QueryPlanParser
3. Enrich the parsed tree with event metadata (queryId, state, etc.)
4. If no jsonPlan available, fall back to legacy parsing method

## JSON Plan Format

The JSON plan from Trino has this structure:

```json
{
  "0": {
    "id": "6",
    "name": "Output",
    "descriptor": {
      "columnNames": "[Query Plan]"
    },
    "outputs": [
      {
        "type": "varchar",
        "name": "query_plan"
      }
    ],
    "details": ["Query Plan := query_plan"],
    "estimates": [{
      "outputRowCount": "NaN",
      "outputSizeInBytes": "NaN",
      "cpuCost": 0.0,
      "memoryCost": 0.0,
      "networkCost": 0.0
    }],
    "children": [...]
  },
  "1": {
    "id": "0",
    "name": "TableScan",
    ...
  }
}
```

- Top-level keys ("0", "1") represent query fragments
- Fragment "0" is typically the root/coordinator fragment
- Each fragment contains a tree of operators
- Operators have a hierarchical structure via the `children` array

## How It Works

### Kafka Event Flow
1. Trino publishes events to Kafka with `jsonPlan` field
2. `TrinoEventConsumer` receives and parses the event
3. `TrinoEventWrapper` deserializes the nested JSON structure
4. `QueryEventService.processEvent()` is called
5. `buildTreeFromEvents()` detects jsonPlan and uses `QueryPlanParser`
6. Parsed tree is stored in `QueryTree` and exposed via REST API

### Data Transformation
```
Kafka JSON Event
    ↓
TrinoEventWrapper (raw parse)
    ↓
QueryEvent (cleaned data)
    ↓
QueryPlanParser (if jsonPlan exists)
    ↓
QueryTreeNode (hierarchical structure)
    ↓
QueryTree (complete tree with metadata)
    ↓
REST API Response
```

## API Response Structure

When a query has a parsed JSON plan, the API returns:

```json
{
  "queryId": "20251002_200813_00003_sb834",
  "query": "SELECT * FROM customers",
  "user": "trino",
  "state": "FINISHED",
  "root": {
    "id": "6",
    "operatorType": "Output",
    "nodeType": "OPERATOR",
    "metadata": {
      "fragmentId": "0",
      "descriptor": {...},
      "outputs": [...],
      "details": [...],
      "estimates": {...}
    },
    "children": [...]
  }
}
```

## Benefits

1. **Structured Data**: Query plans are now parsed into structured objects instead of plain strings
2. **Rich Metadata**: Access to operator types, column information, cost estimates
3. **Hierarchical Navigation**: Easy traversal of operator trees
4. **Backward Compatible**: Falls back to legacy parsing if jsonPlan is not available
5. **Visualization Ready**: Structured data can be easily visualized in the frontend

## Files Modified/Created

### Created:
- `backend/src/main/java/com/trinofed/parser/model/plan/PlanNode.java`
- `backend/src/main/java/com/trinofed/parser/model/plan/PlanOutput.java`
- `backend/src/main/java/com/trinofed/parser/model/plan/PlanEstimate.java`
- `backend/src/main/java/com/trinofed/parser/service/QueryPlanParser.java`

### Modified:
- `backend/src/main/java/com/trinofed/parser/model/TrinoEventWrapper.java`
  - Added jsonPlan field to QueryMetadata (line 73-74)
  - Updated toQueryEvent() to include jsonPlan (line 325)

- `backend/src/main/java/com/trinofed/parser/model/QueryEvent.java`
  - Added jsonPlan field (line 104-105)

- `backend/src/main/java/com/trinofed/parser/service/QueryEventService.java`
  - Added QueryPlanParser dependency (line 26, 29)
  - Rewrote buildTreeFromEvents() to use JSON plan parser (line 105-125)
  - Added enrichTreeWithEventData() helper (line 130-146)
  - Renamed old method to buildTreeFromEventMetadata() (line 151-193)

## Testing

### Build Verification
The project successfully compiles with Java 21:
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
cd backend
mvn clean compile
```

### Testing with Sample Data
To test the implementation:

1. Start the Docker services:
```bash
docker-compose up -d
```

2. Start the backend:
```bash
cd backend
./run.sh
```

3. Run a query that includes EXPLAIN ANALYZE to get jsonPlan:
```bash
docker exec trino trino --execute "EXPLAIN (TYPE IO, FORMAT JSON) SELECT * FROM postgres.public.customers"
```

4. Check the API response:
```bash
curl http://localhost:8080/api/queries | jq '.'
```

The response should now include parsed operator trees with detailed metadata.

## Future Enhancements

1. **Performance Metrics**: Add actual execution metrics to parsed nodes (from statistics)
2. **Visual Diff**: Compare estimated vs actual costs
3. **Query Optimization**: Identify bottlenecks from parsed plan
4. **Cost-Based Analysis**: Use estimates for query optimization suggestions
5. **Frontend Integration**: Visualize the parsed tree in React UI

## Notes

- The parser uses Jackson's ObjectMapper for JSON deserialization
- All parsing is non-blocking and happens in-memory
- Failed parsing logs a warning but doesn't break the system (falls back to legacy)
- The jsonPlan field is optional - system works without it
