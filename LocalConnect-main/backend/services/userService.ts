import { getSupabaseServiceClient } from "./supabaseClient.js";

export async function getPublicUserProfile(userId: string) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, display_name, avatar_url, bio, location, created_at")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}
