import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

import { createPremiumUpgradeHandler } from './handler.ts'

serve(createPremiumUpgradeHandler({
    createClient,
    getEnv: (name) => Deno.env.get(name),
}))
