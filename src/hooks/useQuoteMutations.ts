import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QuoteItem {
  product: string;
  qty: number;
  unit: string;
  unit_price: number;
}

export function useCreateQuote(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { plan_id: string; supplier_id: string; items_json: QuoteItem[] }) => {
      const { data, error } = await supabase.rpc('create_quote' as any, {
        p_plan_id: params.plan_id,
        p_supplier_id: params.supplier_id,
        p_items_json: params.items_json,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      toast.success('Cotización creada');
      qc.invalidateQueries({ queryKey: ['ag_quotes'] });
      onSuccess?.();
    },
    onError: (e: any) => toast.error(`Error: ${e.message}`),
  });
}

export function useUpdateQuoteStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { quote_id: string; new_status: string }) => {
      const { error } = await supabase.rpc('update_quote_status' as any, {
        p_quote_id: params.quote_id,
        p_new_status: params.new_status,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Estado actualizado');
      qc.invalidateQueries({ queryKey: ['ag_quotes'] });
    },
    onError: (e: any) => toast.error(`Error: ${e.message}`),
  });
}
