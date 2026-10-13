import { getSupabaseServiceClient } from "./supabaseClient.js";

export async function getPlatformStats() {
  const supabase = getSupabaseServiceClient();

  const [listings, users] = await Promise.all([
    supabase.from("listings").select("*", { count: "exact", head: true }),
    supabase.from("user_profiles").select("*", { count: "exact", head: true }),
    // Additional queries as needed
  ]);

  return {
    total_listings: listings.count || 0,
    total_users: users.count || 0,
    total_messages: 0,
  };
}

export async function moderateListing({
  listingId,
  action,
  reason,
}: {
  listingId: string;
  action: "approve" | "reject";
  reason?: string;
}) {
  const supabase = getSupabaseServiceClient();
  const status = action === "approve" ? "active" : "rejected";

  const { error } = await supabase
    .from("listings")
    .update({ status })
    .eq("id", listingId);

  if (error) throw error;

  return { message: `Listing ${status}` };
}
