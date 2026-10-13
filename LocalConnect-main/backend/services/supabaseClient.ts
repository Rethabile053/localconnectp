import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from "@supabase/supabase-js";

export function getSupabaseServiceClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase Service Role configuration in environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}
