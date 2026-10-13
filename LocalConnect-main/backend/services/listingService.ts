import { getSupabaseServiceClient } from "./supabaseClient.js";

export async function listListings({
  category,
  search,
  location,
  limit = 20,
  offset = 0,
}: {
  category?: string;
  search?: string;
  location?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = getSupabaseServiceClient();
  let query = supabase.from("listings").select(`
    *,
    user_profiles:user_id (display_name, avatar_url)
  `);

  // Simple active filter since this is the public endpoint
  query = query.eq("status", "active");

  if (category) query = query.eq("category", category);
  if (location) query = query.ilike("location", `%${location}%`);
  if (search) query = query.ilike("title", `%${search}%`);

  query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getListingById(listingId: string) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("listings")
    .select(`*, user_profiles:user_id (display_name, avatar_url)`)
    .eq("id", listingId)
    .single();

  if (error) throw error;
  return data;
}

export async function incrementListingViewsRPC({ listingId }: { listingId: string }) {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.rpc("increment_listing_views", { listing_id: listingId });
  if (error) throw error;
}
