import { QueryTree } from '../types/api.types';

const BASE_URL = 'http://localhost:8080/api';

export const apiService = {
  getAllQueries: async (): Promise<QueryTree[]> => {
    const response = await fetch(`${BASE_URL}/queries`);
    if (!response.ok) throw new Error('Failed to fetch queries');
    return response.json();
  },

  getQueryById: async (queryId: string): Promise<QueryTree> => {
    const response = await fetch(`${BASE_URL}/queries/${queryId}`);
    if (!response.ok) throw new Error(`Failed to fetch query ${queryId}`);
    return response.json();
  },

  getAllQueryIds: async (): Promise<string[]> => {
    const response = await fetch(`${BASE_URL}/queries/ids`);
    if (!response.ok) throw new Error('Failed to fetch query IDs');
    return response.json();
  }
};

