import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import NotificationsList from '../NotificationsList';

vi.mock('axios');

const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe('NotificationsList', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test('renders notifications and marks as read when opened', async () => {
    const notif = { id: 1, title: 'T1', content: 'C1', created_at: new Date().toISOString(), is_read: false };
    axios.get.mockResolvedValueOnce({ data: { results: [notif] } });
    axios.post.mockResolvedValueOnce({ data: { ...notif, is_read: true } });

    render(
      <QueryClientProvider client={makeClient()}>
        <NotificationsList />
      </QueryClientProvider>
    );

    // wait for list item
    await waitFor(() => expect(screen.getByText('T1')).toBeInTheDocument());

    // open notification by clicking list item
    fireEvent.click(screen.getByText('T1'));

    // expect mark-read called
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('notices/notifications/mark-read/', { id: 1 });
    });

    // dialog shows content
    expect(screen.getByText(/C1/)).toBeInTheDocument();
  });

  test('marks as read using the done button', async () => {
    const notif2 = { id: 2, title: 'T2', content: 'C2', created_at: new Date().toISOString(), is_read: false };
    axios.get.mockResolvedValueOnce({ data: { results: [notif2] } });
    axios.post.mockResolvedValueOnce({ data: { ...notif2, is_read: true } });

    render(
      <QueryClientProvider client={makeClient()}>
        <NotificationsList />
      </QueryClientProvider>
    );

    await waitFor(() => expect(screen.getByText('T2')).toBeInTheDocument());

    // click done icon (button has aria-label mark-read)
    const btn = screen.getByLabelText('mark-read');
    fireEvent.click(btn);

    await waitFor(() => expect(axios.post).toHaveBeenCalledWith('notices/notifications/mark-read/', { id: 2 }));
  });
});
