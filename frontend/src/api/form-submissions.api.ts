import client from './client';

export const formSubmissionsApi = {
  list: (params?: { page?: number; limit?: number; status?: string }) =>
    client.get('/form-submissions', { params }),
  getById: (id: string) => client.get(`/form-submissions/${id}`),
  review: (id: string, status: string) =>
    client.put(`/form-submissions/${id}/review`, { status }),
};
