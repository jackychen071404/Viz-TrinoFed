import { List, ListItem, ListItemText, Box } from '@mui/material';

type QueryHistoryModalMenuProps = {
    queryId: string;
}

function handleViewQueryOnLandingPage(queryId: string) {
  // TODO: Implement this
    console.log(`Viewing query ${queryId} on landing page`);
}

function handleDeleteQueryFromHistory(queryId: string) {
  // TODO: Implement this
    console.log(`Deleting query ${queryId} from history`);
}

function handleDeleteAllQueriesFromHistory() {
  // TODO: Implement this
    console.log(`Deleting all queries from history`);
}

function handleExportHistoryAsCSV() {
  // TODO: Implement this
    console.log(`Exporting history as CSV`);
}

export default function QueryHistoryModalMenu({ queryId }: QueryHistoryModalMenuProps) {
  return (
    <Box>
      <List>
        <ListItem>
          <ListItemText primary="View Query on Landing Page" onClick={() => handleViewQueryOnLandingPage(queryId)} />
        </ListItem>
        <ListItem>
            <ListItemText primary="Delete Query from History" onClick={() => handleDeleteQueryFromHistory(queryId)} />
        </ListItem>
        <ListItem>
            <ListItemText primary="Delete All Queries from History" onClick={() => handleDeleteAllQueriesFromHistory()} />
        </ListItem>
        <ListItem>
            <ListItemText primary="Export History as CSV" onClick={() => handleExportHistoryAsCSV()} />
        </ListItem>
      </List>
    </Box>
  );
}