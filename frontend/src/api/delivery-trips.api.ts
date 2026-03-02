import client from './client';

export interface CreateTripRequest {
  route_id: string;
  trip_date: string;
  trips_count: number;
  amount: number;
  driver_name?: string;
  vehicle_no?: string;
  notes?: string;
}

export interface BatchCreateTripsRequest {
  trip_date: string;
  driver_name?: string;
  vehicle_no?: string;
  trips: {
    route_id: string;
    trips_count: number;
    amount: number;
    notes?: string;
  }[];
}

export interface GenerateInvoiceRequest {
  customer_id: string;
  from_date: string;
  to_date: string;
  description?: string;
  notes?: string;
}

export const deliveryTripsApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    customer_id?: string;
    status?: string;
    from_date?: string;
    to_date?: string;
  }) => client.get('/delivery-trips', { params }),
  getById: (id: string) => client.get(`/delivery-trips/${id}`),
  create: (data: CreateTripRequest) => client.post('/delivery-trips', data),
  batchCreate: (data: BatchCreateTripsRequest) => client.post('/delivery-trips/batch', data),
  update: (id: string, data: Partial<CreateTripRequest>) => client.put(`/delivery-trips/${id}`, data),
  confirm: (trip_ids: string[]) => client.put('/delivery-trips/confirm', { trip_ids }),
  void: (id: string) => client.put(`/delivery-trips/${id}/void`, {}),
  generateInvoice: (data: GenerateInvoiceRequest) => client.post('/delivery-trips/generate-invoice', data),
  importPreview: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return client.post('/delivery-trips/import/preview', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  importConfirm: (data: { import_id: string }) => client.post('/delivery-trips/import/confirm', data),
};
