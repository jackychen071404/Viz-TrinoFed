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
import { CheckCircle, Error, Work, Done } from '@mui/icons-material';
import { Box, Button, Tooltip, Typography } from '@mui/material';

export type NodeProps = {
  state: {
    status: 'unknown' | 'error' | 'working' | 'finished';
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
validateEdges, 
copyToClipboard, 
hydrateNode,
updateNode
*/

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
    </>
  );
});