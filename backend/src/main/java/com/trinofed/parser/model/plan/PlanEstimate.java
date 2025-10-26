package com.trinofed.parser.model.plan;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents cost estimates for a Trino query plan node.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class PlanEstimate {

    @JsonProperty("outputRowCount")
    private String outputRowCount;

    @JsonProperty("outputSizeInBytes")
    private String outputSizeInBytes;

    @JsonProperty("cpuCost")
    private Object cpuCost;  // Can be Double or String ("NaN")

    @JsonProperty("memoryCost")
    private Object memoryCost;  // Can be Double or String ("NaN")

    @JsonProperty("networkCost")
    private Object networkCost;  // Can be Double or String ("NaN")
}
