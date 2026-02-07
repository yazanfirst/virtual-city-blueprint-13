import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

function generateCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I, O, 0, 1 to avoid confusion
  let code = ''
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  for (let i = 0; i < length; i++) {
    code += chars[array[i] % chars.length]
  }
  return code
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Authenticate player
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // User-scoped client for auth verification
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const playerId = claimsData.claims.sub as string

    // Service role client for atomic operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const { offer_id } = await req.json()
    if (!offer_id) {
      return new Response(JSON.stringify({ error: 'offer_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 1. Fetch the offer
    const { data: offer, error: offerErr } = await adminClient
      .from('merchant_offers')
      .select('*')
      .eq('id', offer_id)
      .single()

    if (offerErr || !offer) {
      return new Response(JSON.stringify({ error: 'Offer not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Check offer is active
    if (!offer.is_active) {
      return new Response(JSON.stringify({ error: 'This offer is no longer active' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Check expiry
    if (offer.expires_at && new Date(offer.expires_at) <= new Date()) {
      return new Response(JSON.stringify({ error: 'This offer has expired' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. Get player progress
    const { data: progress, error: progressErr } = await adminClient
      .from('player_progress')
      .select('*')
      .eq('user_id', playerId)
      .single()

    if (progressErr || !progress) {
      return new Response(JSON.stringify({ error: 'Player progress not found. Play a mission first!' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 5. Check coins
    if (progress.coins < offer.coin_price) {
      return new Response(JSON.stringify({ error: `Not enough coins. You need ${offer.coin_price} but have ${progress.coins}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 6. Check minimum level
    if (progress.level < offer.min_player_level) {
      return new Response(JSON.stringify({ error: `You need to be level ${offer.min_player_level} to claim this offer` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 7. Check per-player limit
    const { count: playerRedemptions } = await adminClient
      .from('offer_redemptions')
      .select('*', { count: 'exact', head: true })
      .eq('offer_id', offer_id)
      .eq('player_id', playerId)

    if ((playerRedemptions ?? 0) >= offer.per_player_limit) {
      return new Response(JSON.stringify({ error: 'You have already claimed this offer the maximum number of times' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 8. Check daily limit
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { count: dailyRedemptions } = await adminClient
      .from('offer_redemptions')
      .select('*', { count: 'exact', head: true })
      .eq('offer_id', offer_id)
      .gte('created_at', todayStart.toISOString())

    if ((dailyRedemptions ?? 0) >= offer.daily_limit) {
      return new Response(JSON.stringify({ error: 'This offer has reached its daily redemption limit. Try again tomorrow!' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 9. Generate unique code (retry up to 5 times for collisions)
    let redemptionCode = ''
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateCode()
      const { count } = await adminClient
        .from('offer_redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('redemption_code', candidate)

      if ((count ?? 0) === 0) {
        redemptionCode = candidate
        break
      }
    }

    if (!redemptionCode) {
      return new Response(JSON.stringify({ error: 'Failed to generate unique code. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 10. Insert redemption
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { data: redemption, error: insertErr } = await adminClient
      .from('offer_redemptions')
      .insert({
        offer_id,
        player_id: playerId,
        redemption_code: redemptionCode,
        coins_spent: offer.coin_price,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (insertErr) {
      console.error('Insert redemption error:', insertErr)
      return new Response(JSON.stringify({ error: 'Failed to create redemption' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 11. Deduct coins
    const { error: deductErr } = await adminClient
      .from('player_progress')
      .update({ coins: progress.coins - offer.coin_price })
      .eq('user_id', playerId)

    if (deductErr) {
      // Rollback: delete the redemption
      await adminClient.from('offer_redemptions').delete().eq('id', redemption.id)
      return new Response(JSON.stringify({ error: 'Failed to deduct coins' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      success: true,
      redemption_code: redemptionCode,
      coins_spent: offer.coin_price,
      coins_remaining: progress.coins - offer.coin_price,
      expires_at: expiresAt.toISOString(),
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Redeem offer error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
