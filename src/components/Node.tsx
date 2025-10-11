// /*Node component for query tree*/
// /*DO: it should have a dynamic number of connectors */
// /*TODO: it should have five states dictated by color: 
// blue (status unknown), red (error), green (working), gray (finished),
// each with a responding icon*/
// /*TODO: it should have a button to expand into a modal with more details*/
// /*TODO: it should have a button to collapse into a smaller node*/
// /*TODO: it should detect collisions with other nodes and adjust its position accordingly*/
// /*TODO: it should make sure edges don't cross over other nodes or wrap around the node*/
// /*TODO: each node should have alt-text for screen readers*/
// /*TODO: each node should be tabbable and focusable*/
// /*TODO: each node should have a tooltip with more details*/
// /*TODO: it should have a timestamp for when the node was instantiated*/
// /*TODO: it should have a timestamp for when the node was completed/failed*/
// /*TODO: it should not allow invalid edges*/
// /*TODO: it should have a button to copy the node to the clipboard*/
// import  { memo, useRef, useCallback } from 'react';
// import { Edge, Position } from '@xyflow/react';
// import { SentimentSatisfiedAlt, SentimentVeryDissatisfied, SentimentNeutral, Check, QuestionMark } from '@mui/icons-material';
// import { Box, Button, Tooltip, Typography } from '@mui/material';

//   export interface NodeProps {
//   id: string;
//   fragmentId: string;
//   title?: string;
//   connector?: string;
//   operators?: string
//   cpuMs?: number;
//   wallMs?: number;
//   processedRows?: number;
//   processedBytes?: number;
//   splits?: {queued: number;
//     running: number;
//     completed: number;
//     failed: number;
//     total: number;
//   }
//   error?: string;
//   state: {
//     status: 'unknown' | 'error' | 'warning' | 'working' | 'finished';
//     color: string;
//     icon: string; 
//     altText: string;
//   }
//   dateTimeInstantiated: Date;
//   dateTimeCompleted: Date | null;
//   /* TODO: implement and import interface based on server-side tree data structure*/
//   payload?: any;
//   numberOfConnectors: number;
//   edges: Edge[];
//   isExpanded: boolean;
//   isFocused: boolean;
// }


// /* TODO: implement methods: 
// createBoundingBox,
// validateEdges
// copyToClipboard, 
// hydrateNode,
// updatePayload
// updateState
// */
// export const formatSize = (bytes: number) => {
//   if(!bytes && bytes !== 0) return '-';
//   const units = ['B', 'KB', 'MB', 'GB', 'TB'];
//   let index = 0;
//   let size = bytes;
//   while(size >= 1024 && index < units.length - 1) {
//     size /= 1024;
//     index++;
//   }
//   return `${size.toFixed(2)} ${units[index]}`;
// }

// export const formatTime = (ms: number) => {
//   if(!ms && ms !== 0) return '-';
//   const units = ['ms', 's', 'm', 'h', 'd'];
//   let index = 0;
//   let time = ms;
//   while(time >= 1000 && index < units.length - 1) {
//     time /= 1000;
//     index++;
//   }
//   return `${time.toFixed(2)} ${units[index]}`;
// }

// export const formatNumber = (num: number) =>
// {
//   if(!num && num !== 0) return '-';
//   return num.toLocaleString();
// }

// export const formatDate = (date: Date) => {
//   if(!date) return '-';
//   return date.toLocaleString();
// }

export const setStatusColor = (state: QueryNodeData['status']) => {
  switch(state) {
    case 'queued':
      return '#ffffff';
    case 'failed':
      return '#c60101';
    case 'idle':
      return '#f0e806';
    case 'ok':
      return '#22c601';
    case 'finished':
      return '#0139c6';
    case 'unknown':
      return '#cdcdcd';
  }
}

// export const setStatusIcon = (state: NodeProps['state']) => {
//   switch(state.status) {
//     case 'unknown':
//       return <QuestionMark />;
//     case 'error':
//       return <SentimentVeryDissatisfied />;
//     case 'warning':
//       return <SentimentNeutral />;
//     case 'working':
//       return <SentimentSatisfiedAlt />;
//     case 'finished':
//       return <Check />;
//   }

// }


// export default memo(({ state, dateTimeInstantiated, dateTimeCompleted, payload, numberOfConnectors, edges, isExpanded, isFocused}: NodeProps) => {
//   return (
//     <>
//       <div>
//         {/* TODO: populate with props*/}
//         {state.status}
//         {state.color}
//         {state.icon}
//         {state.altText}
//         {dateTimeInstantiated}
//         {dateTimeCompleted}
//         {payload}
//         {numberOfConnectors}
//         {edges}
//         {isExpanded}
//         {isFocused}
//       </div>
//       <Box component="dl" role="status" sx={{width: '100%', height: '100%', backgroundColor: 'red'}}></Box>
//     </>
//   );
// });
import * as React from "react";
import { Box, Chip, Typography, Divider } from "@mui/material";
import { Handle, Position } from "@xyflow/react";

/**
 * Semantic, modular query tree built on MUI <Box> while preserving native HTML semantics.
 * - Tree: <ul>/<li>
 * - Disclosure: <details>/<summary>
 * - Metrics: <dl>/<dt>/<dd>, plus <time>, <meter>, <data>, <code>
 *
 * Why this approach?
 *  - Native keyboard + a11y from <details>/<summary>
 *  - Clean separation between QueryTree and QueryNode
 *  - MUI sx styling without losing semantics via Box's `component` prop
 */

// -----------------------------
// Types
// -----------------------------
export type MeterMetric = {
  kind: "meter";
  label: string;
  value: number;
  min?: number;
  max?: number;
  low?: number;
  high?: number;
  optimum?: number;
  /** Format function for displaying value as text (e.g., "123 ms"). */
  format?: (v: number) => string;
};

export type TextMetric = {
  kind: "text";
  label: string;
  value: React.ReactNode;
};

export type CodeMetric = {
  kind: "code";
  label: string;
  value: string;
};

export type TimeMetric = {
  kind: "time";
  label: string;
  /** ISO datetime string */
  datetime: string;
  /** Optional human-readable display */
  display?: string;
};

export type DataMetric = {
  kind: "data";
  label: string;
  value: string | number;
};

export type QueryMetric = MeterMetric | TextMetric | CodeMetric | TimeMetric | DataMetric;

export interface QueryNodeData {
  id: string;
  stage: string; // e.g., "Execution", "Scan", "Aggregate"
  title?: string; // optional short title
  connector?: string; // e.g., "PostgreSQL", "MongoDB"
  status?: "unknown" | "ok" | "idle" | "queued" | "finished" | "failed";
  durationMs?: number; // optional summary duration
  rows?: number; // optional summary rows
  timestamp?: string; // ISO string for when stage started
  metrics?: QueryMetric[]; // detailed metrics
  children?: QueryNodeData[];
  /** Whether the node is expanded initially */
  defaultOpen?: boolean;
}

// -----------------------------
// Helper Components (semantic blocks styled via MUI)
// -----------------------------
function MetricList({ metrics }: { metrics?: QueryMetric[] }) {
  if (!metrics || metrics.length === 0) return null;

  return (
    <Box component="dl" sx={{
      m: 0,
      mt: 1,
      display: "grid",
      gridTemplateColumns: { xs: "1fr", sm: "max-content 1fr" },
      columnGap: 2,
      rowGap: 0.5,
    }}>
      {metrics.map((m, idx) => (
        <React.Fragment key={idx}>
          <Box component="dt" sx={{ fontWeight: 600 }}>{m.label}</Box>
          <Box component="dd" sx={{ m: 0 }}>
            {m.kind === "meter" && (
              <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
                <Box
                  component="meter"
                  min={m.min ?? 0}
                  max={m.max ?? 100}
                  value={m.value}
                  low={m.low}
                  high={m.high}
                  optimum={m.optimum}
                  aria-label={m.label}
                  sx={{ width: 160, verticalAlign: "middle" }}
                />
                <Typography component="span" variant="body2">
                  {m.format ? m.format(m.value) : String(m.value)}
                </Typography>
              </Box>
            )}
            {m.kind === "text" && <Typography component="span" variant="body2">{m.value}</Typography>}
            {m.kind === "code" && (
              <Box component="code" sx={{
                px: 1,
                py: 0.25,
                borderRadius: 1,
                bgcolor: "action.selected",
                fontSize: "0.85rem",
                display: "inline-block",
              }}>{m.value}</Box>
            )}
            {m.kind === "time" && (
              <Box component="time" dateTime={m.datetime} sx={{ fontFamily: "monospace" }}>
                {m.display ?? new Date(m.datetime).toLocaleString()}
              </Box>
            )}
            {m.kind === "data" && (
              <Box component="data" value={String(m.value)} sx={{ fontFamily: "monospace" }}>
                {String(m.value)}
              </Box>
            )}
          </Box>
        </React.Fragment>
      ))}
    </Box>
  );
}

function StatusChip({ status }: { status?: QueryNodeData["status"] }) {
  if (!status) return null;
  const color =
    status === "ok" ? "success" :
    status === "idle" ? "info" :
    status === "failed" ? "error" :
    "default";
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <Chip size="small" color={color as any} label={label} sx={{ fontWeight: 600 }} />;
}

// -----------------------------
// QueryNode (modular, reusable)
// -----------------------------
export function QueryNode({
  id,
  stage,
  title,
  connector,
  status,
  durationMs,
  rows,
  timestamp,
  metrics,
  children,
  defaultOpen = false,
}: QueryNodeData) {
  return (
    <Box component="li" sx={{ listStyle: "none", pl: 1 }}>
      <Box component="details" open={defaultOpen} sx={{
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        p: 1.25,
        '&[open]': { boxShadow: 1 },
      }}>
        <Box component="summary" sx={{
          listStyle: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 1,
          '&::-webkit-details-marker': { display: "none" },
        }}>
          {/* Left marker / caret via CSS triangle */}
          <Box aria-hidden sx={{
            width: 0,
            height: 0,
            borderStyle: "solid",
            borderWidth: "5px 0 5px 8px",
            borderColor: "transparent transparent transparent",
            mr: 1,
            transition: "transform .15s ease",
            // rotate when open
            ["details[open] > &" as any]: { transform: "rotate(90deg)" },
            // color using currentColor
            color: "text.secondary",
            borderLeftColor: "currentColor",
          }} />

          <Typography component="span" variant="subtitle2" sx={{ fontWeight: 700 }}>
            {title ?? stage}
          </Typography>

          {connector && (
            <Typography component="span" variant="body2" sx={{ color: "text.secondary" }}>
              • Connector: {connector}
            </Typography>
          )}

          {typeof rows === "number" && (
            <Typography component="span" variant="body2" sx={{ color: "text.secondary" }}>
              • Rows: <Box component="data" value={rows} sx={{ fontFamily: "monospace" }}>{rows.toLocaleString()}</Box>
            </Typography>
          )}

          {typeof durationMs === "number" && (
            <Typography component="span" variant="body2" sx={{ color: "text.secondary" }}>
              • Duration: <Box component="data" value={durationMs} sx={{ fontFamily: "monospace" }}>{durationMs} ms</Box>
            </Typography>
          )}

          {timestamp && (
            <Typography component="span" variant="body2" sx={{ color: "text.secondary" }}>
              • <Box component="time" dateTime={timestamp}>{new Date(timestamp).toLocaleTimeString()}</Box>
            </Typography>
          )}

          <Box sx={{ ml: "auto" }}>
            <StatusChip status={status} />
          </Box>
        </Box>

        {/* Body */}
        <Box sx={{ mt: 1.25 }}>
          {/* Identity row */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>ID:</Typography>
            <Box component="code" sx={{
              px: 1,
              py: 0.25,
              borderRadius: 1,
              bgcolor: "action.hover",
              fontFamily: "monospace",
              fontSize: "0.85rem",
            }}>
              <Box component="data" value={id}>{id}</Box>
            </Box>
          </Box>

          <MetricList metrics={metrics} />

          {children && children.length > 0 && (
            <>
              <Divider sx={{ my: 1.25 }} />
              <Box component="ul" sx={{
                pl: 2,
                m: 0,
                display: "grid",
                gap: 1,
                borderLeft: theme => `2px dashed ${theme.palette.divider}`,
              }}>
                {children.map(child => (
                    <QueryNode key={child.id} {...child} />
                ))}
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// -----------------------------
// QueryTree (top-level wrapper)
// -----------------------------
export function QueryTree({ nodes }: { nodes: QueryNodeData[] }) {
  return (
    <Box component="ul" sx={{
      m: 0,
      p: 0,
      display: "grid",
      gap: 1,
    }}>
      {nodes.map(n => (
        <QueryNode key={n.id} {...n} />
      ))}
    </Box>
  );
}



// export default function DemoQueryTree() {
//   return (
//     <Box sx={{ p: 2 }}>
//       <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 800 }}>
//         Query Lifecycle Tree (Semantic + MUI Box)
//       </Typography>
//       <QueryTree nodes={demoNodes} />
//     </Box>export default function DemoQueryTree() {
//   return (
//     <Box sx={{ p: 2 }}>
//       <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 800 }}>
//         Query Lifecycle Tree (Semantic + MUI Box)
//       </Typography>
//       <QueryTree nodes={demoNodes} />
//     </Box>
//   );
// }

//   );
// }
// components/Node.tsx
export function QueryRFNode({ data }: { data: { node: QueryNodeData } }) {
  const n = data.node;
  return (
    <Box role="group" aria-label={`${n.stage} ${n.title ?? ''}`} tabIndex={0}
      sx={{
        width: 280, borderRadius: 2, border: 1, borderColor: 'divider',
        bgcolor: setStatusColor(n.status), p: 1.25, boxShadow: 1,
        '&:focus-visible': { boxShadow: 3, borderColor: 'primary.main' },
      }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          {n.title ?? n.stage}
        </Typography>
        <Box sx={{ ml: 'auto' }}>{/* optional status chip */}</Box>
      </Box>
      {n.connector && (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Connector: {n.connector}
        </Typography>
      )}
      <Divider sx={{ my: 1 }} />
      <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: 'max-content 1fr', columnGap: 1, rowGap: .5 }}>
        {typeof n.rows === 'number' && (<><Box component="dt" sx={{ fontWeight: 600 }}>Rows</Box><Box component="dd" sx={{ m: 0 }}>{n.rows.toLocaleString()}</Box></>)}
        {typeof n.durationMs === 'number' && (<><Box component="dt" sx={{ fontWeight: 600 }}>Duration</Box><Box component="dd" sx={{ m: 0 }}>{n.durationMs} ms</Box></>)}
      </Box>
      <Handle id="in"  type="target" position={Position.Top} />
      <Handle id="out" type="source" position={Position.Bottom} />
      <Handle id="out" type="source" position={Position.Left} />
      <Handle id="in" type="source" position={Position.Right} />
    </Box>
  );
}
