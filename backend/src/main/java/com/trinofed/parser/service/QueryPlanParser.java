package com.trinofed.parser.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trinofed.parser.model.QueryTreeNode;
import com.trinofed.parser.model.plan.PlanNode;
import com.trinofed.parser.model.plan.PlanEstimate;
import com.trinofed.parser.model.plan.PlanOutput;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service to parse Trino JSON query execution plans and convert them into QueryTreeNode structures.
 */
@Slf4j
@Service
public class QueryPlanParser {

    private final ObjectMapper objectMapper;

    public QueryPlanParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Parses a JSON plan string into a hierarchical QueryTreeNode structure.
     *
     * @param jsonPlanString The JSON plan string from Trino (format: {"0": {...}, "1": {...}})
     * @return The root QueryTreeNode, or null if parsing fails
     */
    public QueryTreeNode parseJsonPlan(String jsonPlanString) {
        if (jsonPlanString == null || jsonPlanString.trim().isEmpty()) {
            log.warn("JSON plan string is null or empty");
            return null;
        }

        try {
            // Parse the JSON plan string into a Map of fragment ID -> PlanNode
            Map<String, PlanNode> fragments = objectMapper.readValue(
                jsonPlanString,
                new TypeReference<Map<String, PlanNode>>() {}
            );

            if (fragments == null || fragments.isEmpty()) {
                log.warn("Parsed JSON plan is empty");
                return null;
            }

            // Fragment "0" is typically the root/coordinator fragment
            PlanNode rootFragment = fragments.get("0");
            if (rootFragment == null) {
                // If no "0" fragment, get the first available
                rootFragment = fragments.values().iterator().next();
            }

            // Convert all fragments to QueryTreeNodes
            Map<String, QueryTreeNode> convertedFragments = new HashMap<>();
            for (Map.Entry<String, PlanNode> entry : fragments.entrySet()) {
                QueryTreeNode node = convertPlanNodeToTreeNode(entry.getValue(), entry.getKey());
                convertedFragments.put(entry.getKey(), node);
            }

            // Return the root fragment's tree node
            return convertedFragments.get(fragments.containsKey("0") ? "0" : fragments.keySet().iterator().next());

        } catch (Exception e) {
            log.error("Error parsing JSON plan: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Recursively converts a PlanNode into a QueryTreeNode.
     */
    private QueryTreeNode convertPlanNodeToTreeNode(PlanNode planNode, String fragmentId) {
        QueryTreeNode treeNode = new QueryTreeNode();

        // Set basic properties
        treeNode.setId(planNode.getId());
        treeNode.setOperatorType(planNode.getName());
        treeNode.setNodeType("OPERATOR");

        // Set fragment information in metadata
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("fragmentId", fragmentId);

        // Add descriptor information
        if (planNode.getDescriptor() != null && !planNode.getDescriptor().isEmpty()) {
            metadata.put("descriptor", planNode.getDescriptor());

            // Extract table information if this is a TableScan
            if ("TableScan".equals(planNode.getName()) && planNode.getDescriptor().containsKey("table")) {
                String tableInfo = planNode.getDescriptor().get("table").toString();
                metadata.put("table", tableInfo);
            }
        }

        // Add output columns
        if (planNode.getOutputs() != null && !planNode.getOutputs().isEmpty()) {
            List<Map<String, String>> outputInfo = planNode.getOutputs().stream()
                .map(output -> {
                    Map<String, String> info = new HashMap<>();
                    info.put("name", output.getName());
                    info.put("type", output.getType());
                    return info;
                })
                .collect(Collectors.toList());
            metadata.put("outputs", outputInfo);
        }

        // Add details
        if (planNode.getDetails() != null && !planNode.getDetails().isEmpty()) {
            metadata.put("details", planNode.getDetails());
        }

        // Add cost estimates
        if (planNode.getEstimates() != null && !planNode.getEstimates().isEmpty()) {
            PlanEstimate estimate = planNode.getEstimates().get(0);
            Map<String, Object> costInfo = new HashMap<>();
            costInfo.put("outputRowCount", estimate.getOutputRowCount());
            costInfo.put("outputSizeInBytes", estimate.getOutputSizeInBytes());
            costInfo.put("cpuCost", estimate.getCpuCost());
            costInfo.put("memoryCost", estimate.getMemoryCost());
            costInfo.put("networkCost", estimate.getNetworkCost());
            metadata.put("estimates", costInfo);
        }

        treeNode.setMetadata(metadata);

        // Recursively process children
        if (planNode.getChildren() != null && !planNode.getChildren().isEmpty()) {
            List<QueryTreeNode> childNodes = planNode.getChildren().stream()
                .map(child -> convertPlanNodeToTreeNode(child, fragmentId))
                .collect(Collectors.toList());
            treeNode.setChildren(childNodes);
        } else {
            treeNode.setChildren(new ArrayList<>());
        }

        return treeNode;
    }

    /**
     * Extracts a simplified representation of the query plan for quick analysis.
     * Returns a flat list of all operators in the plan.
     */
    public List<String> extractOperatorList(String jsonPlanString) {
        List<String> operators = new ArrayList<>();

        if (jsonPlanString == null || jsonPlanString.trim().isEmpty()) {
            return operators;
        }

        try {
            Map<String, PlanNode> fragments = objectMapper.readValue(
                jsonPlanString,
                new TypeReference<Map<String, PlanNode>>() {}
            );

            for (PlanNode fragment : fragments.values()) {
                collectOperators(fragment, operators);
            }

        } catch (Exception e) {
            log.error("Error extracting operator list: {}", e.getMessage());
        }

        return operators;
    }

    /**
     * Recursively collects operator names from a plan node and its children.
     */
    private void collectOperators(PlanNode node, List<String> operators) {
        if (node == null) {
            return;
        }

        operators.add(node.getName());

        if (node.getChildren() != null) {
            for (PlanNode child : node.getChildren()) {
                collectOperators(child, operators);
            }
        }
    }
}
