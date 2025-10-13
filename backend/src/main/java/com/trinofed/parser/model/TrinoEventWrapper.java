package com.trinofed.parser.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

/**
 * Wrapper model for Trino Kafka event messages.
 * Matches the actual nested structure from Trino's Kafka event listener.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class TrinoEventWrapper {

    @JsonProperty("eventPayload")
    private EventPayload eventPayload;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class EventPayload {

        @JsonProperty("metadata")
        private QueryMetadata metadata;

        @JsonProperty("context")
        private QueryContext context;

        @JsonProperty("createTime")
        private String createTime;

        @JsonProperty("endTime")
        private String endTime;

        @JsonProperty("statistics")
        private QueryStatistics statistics;

        @JsonProperty("ioMetadata")
        private IoMetadata ioMetadata;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class QueryMetadata {

        @JsonProperty("queryId")
        private String queryId;

        @JsonProperty("query")
        private String query;

        @JsonProperty("queryState")
        private String queryState;

        @JsonProperty("uri")
        private String uri;

        @JsonProperty("plan")
        private String plan;

        @JsonProperty("payload")
        private String payload;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class QueryContext {

        @JsonProperty("user")
        private String user;

        @JsonProperty("principal")
        private String principal;

        @JsonProperty("remoteClientAddress")
        private String remoteClientAddress;

        @JsonProperty("userAgent")
        private String userAgent;

        @JsonProperty("clientInfo")
        private String clientInfo;

        @JsonProperty("serverAddress")
        private String serverAddress;

        @JsonProperty("serverVersion")
        private String serverVersion;

        @JsonProperty("environment")
        private String environment;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class QueryStatistics {

        @JsonProperty("cpuTime")
        private String cpuTime;

        @JsonProperty("wallTime")
        private String wallTime;

        @JsonProperty("queuedTime")
        private String queuedTime;

        @JsonProperty("scheduledTime")
        private String scheduledTime;

        @JsonProperty("analysisTime")
        private String analysisTime;

        @JsonProperty("planningTime")
        private String planningTime;

        @JsonProperty("executionTime")
        private String executionTime;

        @JsonProperty("peakMemoryBytes")
        private Long peakMemoryBytes;

        @JsonProperty("totalBytes")
        private Long totalBytes;

        @JsonProperty("totalRows")
        private Long totalRows;

        @JsonProperty("completedSplits")
        private Integer completedSplits;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class IoMetadata {

        @JsonProperty("inputs")
        private java.util.List<InputMetadata> inputs;

        @JsonProperty("output")
        private OutputMetadata output;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class InputMetadata {

        @JsonProperty("catalogName")
        private String catalogName;

        @JsonProperty("schema")
        private String schema;

        @JsonProperty("table")
        private String table;

        @JsonProperty("columns")
        private java.util.List<String> columns;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class OutputMetadata {

        @JsonProperty("catalogName")
        private String catalogName;

        @JsonProperty("schema")
        private String schema;

        @JsonProperty("table")
        private String table;
    }

    /**
     * Convert this wrapper to a QueryEvent for processing
     */
    public QueryEvent toQueryEvent() {
        if (eventPayload == null || eventPayload.getMetadata() == null) {
            return null;
        }

        QueryMetadata metadata = eventPayload.getMetadata();
        QueryStatistics stats = eventPayload.getStatistics();
        QueryContext ctx = eventPayload.getContext();

        // Parse timestamp from createTime or use current time
        Instant timestamp = Instant.now();
        if (eventPayload.getCreateTime() != null && !eventPayload.getCreateTime().isEmpty()) {
            try {
                timestamp = Instant.parse(eventPayload.getCreateTime());
            } catch (Exception e) {
                // Use current time if parsing fails
            }
        }

        return QueryEvent.builder()
                .queryId(metadata.getQueryId())
                .query(metadata.getQuery())
                .state(metadata.getQueryState())
                .user(ctx != null ? ctx.getUser() : null)
                .timestamp(timestamp)
                .createTime(eventPayload.getCreateTime())
                .endTime(eventPayload.getEndTime())
                .cpuTimeMs(stats != null && stats.getCpuTime() != null ? parseDuration(stats.getCpuTime()) : null)
                .wallTimeMs(stats != null && stats.getWallTime() != null ? parseDuration(stats.getWallTime()) : null)
                .queuedTimeMs(stats != null && stats.getQueuedTime() != null ? parseDuration(stats.getQueuedTime()) : null)
                .peakMemoryBytes(stats != null ? stats.getPeakMemoryBytes() : null)
                .totalBytes(stats != null ? stats.getTotalBytes() : null)
                .totalRows(stats != null ? stats.getTotalRows() : null)
                .completedSplits(stats != null ? stats.getCompletedSplits() : null)
                .plan(metadata.getPlan())
                .eventType(determineEventType(metadata.getQueryState()))
                .build();
    }

    /**
     * Parse duration string like "1.23s" or "123.45ms" to milliseconds
     */
    private Long parseDuration(String duration) {
        if (duration == null || duration.isEmpty()) {
            return null;
        }
        try {
            if (duration.endsWith("ms")) {
                return Long.parseLong(duration.substring(0, duration.length() - 2).split("\\.")[0]);
            } else if (duration.endsWith("s")) {
                return (long) (Double.parseDouble(duration.substring(0, duration.length() - 1)) * 1000);
            } else if (duration.endsWith("m")) {
                return (long) (Double.parseDouble(duration.substring(0, duration.length() - 1)) * 60000);
            }
        } catch (NumberFormatException e) {
            return null;
        }
        return null;
    }

    /**
     * Determine event type from query state
     */
    private String determineEventType(String queryState) {
        if (queryState == null) {
            return "UNKNOWN";
        }
        switch (queryState) {
            case "QUEUED":
            case "PLANNING":
            case "STARTING":
            case "RUNNING":
                return "CREATED";
            case "FINISHED":
            case "FAILED":
            case "CANCELED":
                return "COMPLETED";
            default:
                return queryState;
        }
    }
}
