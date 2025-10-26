import * as React from 'react';
import { ContentCopy } from '@mui/icons-material';

export default function CopyPaste ({ dataToCopy }: { dataToCopy: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(dataToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
      <ContentCopy onClick={handleCopy} style={{ position: 'absolute', top: 10, right: 10, padding: 1 }}>
        {copied ? 'Copied!' : 'Copy Text'}
      </ContentCopy>
  );
};