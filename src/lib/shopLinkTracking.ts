import { supabase } from "@/integrations/supabase/client";

export async function trackShopLinkClick(shopId: string) {
  const { data: auth } = await supabase.auth.getUser();

  await supabase.from("shop_link_clicks").insert({
    shop_id: shopId,
    user_id: auth.user?.id ?? null,
  });
}
