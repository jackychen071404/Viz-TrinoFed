import { QueryNodeData } from "../components/Node";

export const demoNodes: QueryNodeData[] = [
    {
      id: "q_8f2a",
      stage: "Execution",
      title: "Execution — PostgreSQL",
      connector: "PostgreSQL",
      status: "ok",
      durationMs: 123,
      rows: 87654,
      timestamp: new Date().toISOString(),
      defaultOpen: true,
      metrics: [
        { kind: "data", label: "Query ID", value: "q_8f2a" },
        { kind: "meter", label: "CPU", value: 62, max: 100, format: v => `${v}%` },
        { kind: "meter", label: "Network Latency", value: 123, max: 500, format: v => `${v} ms` },
        { kind: "text", label: "Node Count", value: <strong>12</strong> },
        { kind: "time", label: "Started", datetime: new Date().toISOString() },
      ],
      children: [
        {
          id: "q_8f2a_scan",
          stage: "Scan",
          title: "Scan — orders",
          status: "ok",
          rows: 12345,
          durationMs: 40,
          metrics: [
            { kind: "code", label: "Predicate", value: "create_time >= now() - interval '1 day'" },
            { kind: "text", label: "Bytes Read", value: "48 MB" },
          ],
        },
        {
          id: "q_8f2a_agg",
          stage: "Aggregate",
          title: "Aggregate — GROUP BY hour",
          status: "ok",
          durationMs: 55,
          metrics: [
            { kind: "text", label: "Partial", value: "true" },
            { kind: "text", label: "Spill", value: "none" },
          ],
        },
      ],
    },
  ];