import client from './client';

export const dashboardApi = {
  getSummary: () => client.get('/dashboard/summary'),
};
