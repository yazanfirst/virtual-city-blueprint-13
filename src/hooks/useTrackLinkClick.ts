import { supabase } from '@/integrations/supabase/client';

export async function trackLinkClick(shopId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('shop_link_clicks')
    .insert({ shop_id: shopId, user_id: user.id });
}
