import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api.service';
import { QueryTree } from '../types/api.types';


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
    navigate(`/?queryId=${queryId}`);
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Query History</h1>
      {queries.length === 0 ? (
        <p>No queries found.</p>
      ) : (
        <div>
          {queries.map((query) => (
            <div 
              key={query.queryId} 
              onClick={() => handleQueryClick(query.queryId)}
              style={{ 
                border: '1px solid #ccc', 
                padding: '15px', 
                marginBottom: '15px',
                borderRadius: '5px',
                backgroundColor: '#f9f9f9',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e8f4f8';
                e.currentTarget.style.borderColor = '#1976d2';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f9f9f9';
                e.currentTarget.style.borderColor = '#ccc';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <h3 style={{ marginTop: 0, color: '#1976d2' }}>{query.queryId}</h3>
              <p><strong>User:</strong> {query.user || 'N/A'}</p>
              <p><strong>State:</strong> <span style={{ 
                color: query.state === 'FINISHED' ? 'green' : query.errorMessage ? 'red' : 'orange'
              }}>{query.state}</span></p>
              <p><strong>Query:</strong> <code style={{ backgroundColor: '#e0e0e0', padding: '2px 5px' }}>{query.query || 'N/A'}</code></p>
              <p><strong>Start Time:</strong> {new Date(query.startTime).toLocaleString()}</p>
              <p><strong>Execution Time:</strong> {query.totalExecutionTime ? `${query.totalExecutionTime}ms` : 'N/A'}</p>
              {query.errorMessage && (
                <p style={{ color: 'red' }}><strong>Error:</strong> {query.errorMessage}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
