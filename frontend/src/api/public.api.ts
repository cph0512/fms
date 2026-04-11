import axios from 'axios';

const publicClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

export const publicFormApi = {
  submitDeliveryTrip: (data: {
    token: string;
    submitter_name: string;
    customer_name: string;
    notes?: string;
    rows: Array<{
      row_date: string;
      route_content: string;
      description?: string;
      trips_count: number;
      amount: number;
    }>;
  }) => publicClient.post('/form-submissions/public', data),
};
