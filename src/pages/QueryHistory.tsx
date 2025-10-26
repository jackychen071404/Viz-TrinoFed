import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api.service';
import { QueryTree } from '../types/api.types';
import CardList from '../components/CardList';
import { CardProps } from '../components/Card';


export default function QueryHistory() {
  const [queries, setQueries] = useState<QueryTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadQueries = async () => {
      try {
        const data = await apiService.getAllQueries();
        setQueries(data);
      } catch (err) {
        console.error('Failed to load query history:', err);
        setError('Failed to connect to backend');
      } finally {
        setLoading(false);
      }
    };
    loadQueries();
  }, []);

  const handleQueryClick = (queryId: string) => {
    console.log('Card clicked, navigating to query:', queryId);
    navigate(`/?queryId=${queryId}`);
  };

  // Convert QueryTree data to CardProps format
  const cards: CardProps[] = queries.map((query) => ({
    title: query.queryId,
    description: query.query || 'No query text available',
    status: query.state === 'FINISHED' ? 'ok' : 
            query.errorMessage ? 'failed' : 
            query.state === 'RUNNING' ? 'idle' : 'unknown',
    timestamp: query.startTime,
    onClick: () => handleQueryClick(query.queryId)
  }));

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Query History</h1>
      {queries.length === 0 ? (
        <p>No queries found.</p>
      ) : (
        <CardList cards={cards} />
      )}
    </div>
  );
}
