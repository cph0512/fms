import client from './client';

export interface CreateRouteRequest {
  customer_id: string;
  origin: string;
  route_name: string;
  content_type: string;
  standard_price: number;
  notes?: string;
}

export interface UpdateRouteRequest extends Partial<CreateRouteRequest> {
  is_active?: boolean;
}

export const deliveryRoutesApi = {
  list: (params?: { page?: number; limit?: number; customer_id?: string; content_type?: string; search?: string; is_active?: boolean }) =>
    client.get('/delivery-routes', { params }),
  getById: (id: string) => client.get(`/delivery-routes/${id}`),
  getByCustomer: (customerId: string) => client.get(`/delivery-routes/customer/${customerId}`),
  create: (data: CreateRouteRequest) => client.post('/delivery-routes', data),
  update: (id: string, data: UpdateRouteRequest) => client.put(`/delivery-routes/${id}`, data),
  batchCreate: (routes: CreateRouteRequest[]) => client.post('/delivery-routes/batch', { routes }),
};
