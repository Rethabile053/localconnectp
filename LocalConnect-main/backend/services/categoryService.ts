import { getSupabaseServiceClient } from "./supabaseClient.js";

export async function getCategoryCountsRPC() {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.rpc("get_category_counts");

  if (error) throw error;
  return data;
}
