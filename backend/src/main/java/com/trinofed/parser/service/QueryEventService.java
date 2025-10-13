package com.trinofed.parser.service;

import com.trinofed.parser.model.QueryEvent;
import com.trinofed.parser.model.QueryTree;
import com.trinofed.parser.model.QueryTreeNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class QueryEventService {

    private final Map<String, QueryTree> queryTrees = new ConcurrentHashMap<>();
    private final Map<String, List<QueryEvent>> queryEvents = new ConcurrentHashMap<>();
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public QueryEventService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void processEvent(QueryEvent event) {
        String queryId = event.getQueryId();

        // Store event
        queryEvents.computeIfAbsent(queryId, k -> new ArrayList<>()).add(event);

        // Build or update query tree
        QueryTree tree = buildQueryTree(queryId);

        // Send update via WebSocket
        messagingTemplate.convertAndSend("/topic/query-updates", tree);

        log.info("Processed event for query: {}, total events: {}",
                queryId, queryEvents.get(queryId).size());
    }

    private QueryTree buildQueryTree(String queryId) {
        List<QueryEvent> events = queryEvents.get(queryId);

        if (events == null || events.isEmpty()) {
            return null;
        }

        // Sort events by timestamp
        events.sort(Comparator.comparing(QueryEvent::getTimestamp));

        // Find the latest event with complete information
        QueryEvent latestEvent = events.get(events.size() - 1);

        // Build tree structure from stage stats and operator stats
        QueryTreeNode root = buildTreeFromEvents(events);

        return QueryTree.builder()
                .queryId(queryId)
                .query(latestEvent.getQuery())
                .user(latestEvent.getUser())
                .state(latestEvent.getState())
                .startTime(events.get(0).getTimestamp())
                .endTime(latestEvent.getTimestamp())
                .totalExecutionTime(latestEvent.getExecutionTime())
                .errorMessage(latestEvent.getErrorMessage())
                .root(root)
                .events(new ArrayList<>(events))
                .build();
    }

    private QueryTreeNode buildTreeFromEvents(List<QueryEvent> events) {
        // Build a hierarchical tree from events
        // This is a simplified version - you'll need to adapt based on actual Trino event structure

        Map<String, QueryTreeNode> nodeMap = new HashMap<>();
        QueryTreeNode root = null;

        for (QueryEvent event : events) {
            String nodeId = generateNodeId(event);

            QueryTreeNode node = nodeMap.computeIfAbsent(nodeId, k ->
                    QueryTreeNode.builder()
                            .id(nodeId)
                            .queryId(event.getQueryId())
                            .state(event.getState())
                            .executionTime(event.getExecutionTime())
                            .cpuTime(event.getCpuTime())
                            .wallTime(event.getWallTime())
                            .memoryBytes(event.getPeakMemoryBytes())
                            .inputRows(event.getTotalRows())
                            .inputBytes(event.getTotalBytes())
                            .errorMessage(event.getErrorMessage())
                            .sourceSystem(event.getCatalog())
                            .metadata(event.getMetadata())
                            .children(new ArrayList<>())
                            .build()
            );

            // Extract operator type and node type from stage stats
            if (event.getStageStats() != null) {
                node.setOperatorType(extractOperatorType(event.getStageStats()));
                node.setNodeType("STAGE");
            }

            // Parse operator stats to build parent-child relationships
            if (event.getOperatorStats() != null) {
                buildOperatorHierarchy(node, event.getOperatorStats(), nodeMap);
            }

            if (root == null) {
                root = node;
            }
        }

        return root;
    }

    private String generateNodeId(QueryEvent event) {
        // Generate unique node ID based on event properties
        return event.getQueryId() + "-" + event.getEventType() + "-" + event.getTimestamp().toEpochMilli();
    }

    private String extractOperatorType(Map<String, Object> stageStats) {
        // Extract operator type from stage stats
        // This depends on the actual structure of Trino events
        if (stageStats.containsKey("operatorType")) {
            return stageStats.get("operatorType").toString();
        }
        return "UNKNOWN";
    }

    private void buildOperatorHierarchy(QueryTreeNode parent, Map<String, Object> operatorStats,
                                         Map<String, QueryTreeNode> nodeMap) {
        // Build hierarchy from operator stats
        // This is simplified - adapt based on actual Trino operator structure

        if (operatorStats.containsKey("children")) {
            Object childrenObj = operatorStats.get("children");
            if (childrenObj instanceof List) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> children = (List<Map<String, Object>>) childrenObj;

                for (Map<String, Object> childStats : children) {
                    String childId = parent.getId() + "-child-" + UUID.randomUUID();
                    QueryTreeNode childNode = QueryTreeNode.builder()
                            .id(childId)
                            .queryId(parent.getQueryId())
                            .parentId(parent.getId())
                            .operatorType(extractOperatorType(childStats))
                            .nodeType("OPERATOR")
                            .metadata(childStats)
                            .children(new ArrayList<>())
                            .build();

                    nodeMap.put(childId, childNode);
                    parent.getChildren().add(childNode);

                    // Recursively process nested children
                    buildOperatorHierarchy(childNode, childStats, nodeMap);
                }
            }
        }
    }

    public QueryTree getQueryTree(String queryId) {
        return buildQueryTree(queryId);
    }

    public List<String> getAllQueryIds() {
        return new ArrayList<>(queryEvents.keySet());
    }

    public List<QueryTree> getAllQueryTrees() {
        return queryEvents.keySet().stream()
                .map(this::buildQueryTree)
                .filter(Objects::nonNull)
                .toList();
    }
}
