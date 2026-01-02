import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { InventoryItem, MenuItem } from '../lib/mockData';

export function useInventory() {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: async (): Promise<InventoryItem[]> => {
      const res = await fetch('/api/inventory');
      if (!res.ok) throw new Error('Failed to fetch inventory');
      return res.json();
    },
  });
}

export function useMenu() {
  return useQuery({
    queryKey: ['menu'],
    queryFn: async (): Promise<(MenuItem & { ingredients: any[] })[]> => {
      const res = await fetch('/api/menu');
      if (!res.ok) throw new Error('Failed to fetch menu');
      return res.json();
    },
  });
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });
}

export function useLogs() {
  return useQuery({
    queryKey: ['logs'],
    queryFn: async () => {
      const res = await fetch('/api/logs');
      if (!res.ok) throw new Error('Failed to fetch logs');
      return res.json();
    },
  });
}

export function useRestockMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const res = await fetch(`/api/inventory/${itemId}/restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) throw new Error('Failed to restock');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    },
  });
}

export function useCheckoutMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (items: any[]) => {
      const res = await fetch('/api/sales/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error('Failed to checkout');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    },
  });
}

export function useInitDatabase() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/init', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to initialize');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
