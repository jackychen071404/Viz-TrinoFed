import CardList from '../components/CardList';
import { demoCards } from '../mock-data/mock-data';

export default function QueryHistory() {
  return (
    <div>
      <h1>Query History</h1>
      <CardList cards={demoCards} />
    </div>
  );
}
