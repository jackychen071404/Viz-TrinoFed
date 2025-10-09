/*Node component for query tree*/
/*DO: it should have a dynamic number of connectors */
/*TODO: it should have five states dictated by color: 
blue (status unknown), red (error), green (working), gray (finished),
each with a responding icon*/
/*TODO: it should have a button to expand into a modal with more details*/
/*TODO: it should have a button to collapse into a smaller node*/
/*TODO: it should detect collisions with other nodes and adjust its position accordingly*/
/*TODO: it should make sure edges don't cross over other nodes or wrap around the node*/
/*TODO: each node should have alt-text for screen readers*/
/*TODO: each node should be tabbable and focusable*/
/*TODO: each node should have a tooltip with more details*/
/*TODO: it should have a timestamp for when the node was instantiated*/
/*TODO: it should have a timestamp for when the node was completed/failed*/
/*TODO: it should not allow invalid edges*/
/*TODO: it should have a button to copy the node to the clipboard*/
import  { memo, useRef, useCallback } from 'react';
import { Edge, Position } from '@xyflow/react';
import { SentimentSatisfiedAlt, SentimentVeryDissatisfied, SentimentNeutral, Check, QuestionMark } from '@mui/icons-material';
import { Box, Button, Tooltip, Typography } from '@mui/material';

  export interface NodeProps {
  id: string;
  fragmentId: string;
  title?: string;
  connector?: string;
  operators?: string
  cpuMs?: number;
  wallMs?: number;
  processedRows?: number;
  processedBytes?: number;
  splits?: {queued: number;
    running: number;
    completed: number;
    failed: number;
    total: number;
  }
  error?: string;
  state: {
    status: 'unknown' | 'error' | 'warning' | 'working' | 'finished';
    color: string;
    icon: string; 
    altText: string;
  }
  dateTimeInstantiated: Date;
  dateTimeCompleted: Date | null;
  /* TODO: implement and import interface based on server-side tree data structure*/
  payload?: any;
  numberOfConnectors: number;
  edges: Edge[];
  isExpanded: boolean;
  isFocused: boolean;
}


/* TODO: implement methods: 
createBoundingBox,
validateEdges
copyToClipboard, 
hydrateNode,
updatePayload
updateState
*/
export const formatSize = (bytes: number) => {
  if(!bytes && bytes !== 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let index = 0;
  let size = bytes;
  while(size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index++;
  }
  return `${size.toFixed(2)} ${units[index]}`;
}

export const formatTime = (ms: number) => {
  if(!ms && ms !== 0) return '-';
  const units = ['ms', 's', 'm', 'h', 'd'];
  let index = 0;
  let time = ms;
  while(time >= 1000 && index < units.length - 1) {
    time /= 1000;
    index++;
  }
  return `${time.toFixed(2)} ${units[index]}`;
}

export const formatNumber = (num: number) =>
{
  if(!num && num !== 0) return '-';
  return num.toLocaleString();
}

export const formatDate = (date: Date) => {
  if(!date) return '-';
  return date.toLocaleString();
}

export const setStatusColor = (state: NodeProps['state']) => {
  switch(state.status) {
    case 'unknown':
      return 'blue';
    case 'error':
      return 'red';
    case 'warning':
      return 'yellow';
    case 'working':
      return 'green';
    case 'finished':
      return 'gray';
  }
}

export const setStatusIcon = (state: NodeProps['state']) => {
  switch(state.status) {
    case 'unknown':
      return <QuestionMark />;
    case 'error':
      return <SentimentVeryDissatisfied />;
    case 'warning':
      return <SentimentNeutral />;
    case 'working':
      return <SentimentSatisfiedAlt />;
    case 'finished':
      return <Check />;
  }

}


export default memo(({ state, dateTimeInstantiated, dateTimeCompleted, payload, numberOfConnectors, edges, isExpanded, isFocused}: NodeProps) => {
  return (
    <>
      <div>
        {/* TODO: populate with props*/}
        {state.status}
        {state.color}
        {state.icon}
        {state.altText}
        {dateTimeInstantiated}
        {dateTimeCompleted}
        {payload}
        {numberOfConnectors}
        {edges}
        {isExpanded}
        {isFocused}
      </div>
      <Box sx={{width: '100%', height: '100%', backgroundColor: 'red'}}></Box>
    </>
  );
});