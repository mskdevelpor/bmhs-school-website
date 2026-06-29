import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// Generic hook for Supabase CRUD operations
export function useSupabaseQuery<T>(table: string, select: string = '*') {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: rows, error: err } = await supabase.from(table).select(select);
    if (err) { setError(err.message); setData([]); }
    else { setData((rows || []) as T[]); }
    setLoading(false);
  }, [table, select]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load, setData };
}

export async function insertRow<T>(table: string, row: Partial<T>): Promise<{ data: T | null; error: string | null }> {
  const { data, error } = await supabase.from(table).insert(row).select().single();
  return { data: data as T | null, error: error?.message || null };
}

export async function updateRow<T>(table: string, id: string, updates: Partial<T>): Promise<{ data: T | null; error: string | null }> {
  const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single();
  return { data: data as T | null, error: error?.message || null };
}

export async function deleteRow(table: string, id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from(table).delete().eq('id', id);
  return { error: error?.message || null };
}

export async function bulkInsert<T>(table: string, rows: Partial<T>[]): Promise<{ error: string | null; count: number }> {
  const { data, error } = await supabase.from(table).insert(rows).select();
  return { error: error?.message || null, count: data?.length || 0 };
}
