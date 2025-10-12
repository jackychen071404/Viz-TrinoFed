import {
  BaseEdge,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';

// Edge component specifying the direction of data flow

export default function DirectedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  label,
  markerEnd,
  style,
  sourcePosition,
  targetPosition
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  });


  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        label={label}
        style={{ stroke: '#000000', strokeWidth: 2 }}
        markerEnd={markerEnd}
        />
    </>
  );
}