import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CARTA_IMPRESA_FECHA } from '../theme/tokens';

/** Fecha del último cambio de precio (en vivo). */
export function usePriceUpdated() {
  const [date, setDate] = useState<string>(CARTA_IMPRESA_FECHA);
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('price_changes').select('created_at').order('created_at', { ascending: false }).limit(1);
      if (data?.[0]) setDate(data[0].created_at as string);
    };
    load();
    const ch = supabase
      .channel('price-updated')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'price_changes' }, (p) => setDate((p.new as { created_at: string }).created_at))
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);
  return date;
}
