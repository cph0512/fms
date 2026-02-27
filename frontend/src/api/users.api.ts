import client from './client';

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  display_name: string;
  company_id?: string;
  role_ids?: number[];
}

export interface UpdateUserRequest {
  email?: string;
  display_name?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  password?: string;
}

export interface AssignRolesRequest {
  company_id: string;
  role_ids: number[];
}

export const usersApi = {
  list: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    client.get('/users', { params }),
  getById: (id: string) => client.get(`/users/${id}`),
  create: (data: CreateUserRequest) => client.post('/users', data),
  update: (id: string, data: UpdateUserRequest) => client.put(`/users/${id}`, data),
  assignRoles: (id: string, data: AssignRolesRequest) => client.put(`/users/${id}/roles`, data),
  getRoles: () => client.get('/users/roles'),
};
