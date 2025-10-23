import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { HourglassBottom, SentimentVeryDissatisfied, SentimentNeutral, SentimentSatisfiedAlt, Check, QuestionMark, ContentCopy } from '@mui/icons-material';
import { Chip, Box } from '@mui/material';
import Modal from './Modal';

export type CardProps = {
  title: string;
  description: string;
  status: "ok" | "idle" | "failed" | "queued" | "finished" | "unknown";
  timestamp: string;
}

export const setStatusColor = (state: CardProps['status']) => {
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
        return '#608dff';
      case 'unknown':
        return '#cdcdcd';
    }
  }
  
  export const setStatusIcon = (state: CardProps['status']) => {
    switch(state) {
      case 'queued':
        return <HourglassBottom />;
      case 'failed':
        return <SentimentVeryDissatisfied />;
      case 'idle':
        return <SentimentNeutral />;
      case 'ok':
        return <SentimentSatisfiedAlt/>;
      case 'finished':
        return <Check />;
      case 'unknown':
        return <QuestionMark />;
    }
  }

 export function StatusChip({ status }: { status?: CardProps["status"] }) {
    if (!status) return null;
    const color =
      status === "ok" ? "success" :
      status === "idle" ? "warning" :
      status === "failed" ? "error" :
      "default";
    const label = status.charAt(0).toUpperCase() + status.slice(1);
    return <Chip size="small" color={color as any} label={label} sx={{ fontWeight: 600, position: 'absolute', bottom: 10, right: 10, padding:0 }} />;
  }


export default function BasicCard({ title, description, status, timestamp }: CardProps) {
  return (
    <Card sx={{ minWidth: 275, backgroundColor: setStatusColor(status), position: 'relative', borderRadius: 0 }}>
      <Modal top={0} right={40} />
      <ContentCopy sx={{ position: 'absolute', top: 0, right: 0, padding: 1 }} />
      <CardContent>
        <Box sx={{ ml: 'auto' }}><StatusChip status={status} /></Box>
        <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
          {title}
        </Typography>
        <Typography variant="h5" component="div">
          {description}
        </Typography>
        {status && (<><Box component="dt" sx={{ fontWeight: 600 }}>Status</Box><Box component="dd" sx={{ m: 0 }}>{setStatusIcon(status)}</Box></>)}
        {timestamp && (<><Box component="dt" sx={{ fontWeight: 600 }}>Timestamp</Box><Box component="dd" sx={{ m: 0 }}>{timestamp}</Box></>)}
      </CardContent>
    </Card>
  );
}
