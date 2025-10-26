package com.trinofed.parser.model.plan;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Represents a single node in the Trino query execution plan JSON structure.
 * Each node represents an operator (e.g., TableScan, Filter, Join, etc.)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class PlanNode {

    @JsonProperty("id")
    private String id;

    @JsonProperty("name")
    private String name;

    @JsonProperty("descriptor")
    private Map<String, Object> descriptor;

    @JsonProperty("outputs")
    private List<PlanOutput> outputs;

    @JsonProperty("details")
    private List<String> details;

    @JsonProperty("estimates")
    private List<PlanEstimate> estimates;

    @JsonProperty("children")
    private List<PlanNode> children;
}
