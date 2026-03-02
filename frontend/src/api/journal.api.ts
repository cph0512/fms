import client from './client';

export interface JournalLine {
  account_id: string;
  debit_amount: number;
  credit_amount: number;
  description?: string;
}

export interface CreateJournalEntryRequest {
  entry_date: string;
  description?: string;
  lines: JournalLine[];
}

export interface UpdateJournalEntryRequest {
  entry_date?: string;
  description?: string | null;
  lines?: JournalLine[];
}

export const journalApi = {
  listEntries: (params?: { page?: number; limit?: number; status?: string; from_date?: string; to_date?: string }) =>
    client.get('/journal/entries', { params }),
  getEntryById: (id: string) => client.get(`/journal/entries/${id}`),
  createEntry: (data: CreateJournalEntryRequest) => client.post('/journal/entries', data),
  updateEntry: (id: string, data: UpdateJournalEntryRequest) => client.put(`/journal/entries/${id}`, data),
  postEntry: (id: string) => client.put(`/journal/entries/${id}/post`),
  voidEntry: (id: string) => client.put(`/journal/entries/${id}/void`),
};
