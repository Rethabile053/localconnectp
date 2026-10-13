// Supabase Client Configuration and Auth Management
// Supabase project values

const SUPABASE_URL = "https://tazzcknvoryrsegvnsvs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhenpja252b3J5cnNlZ3Zuc3ZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTYwNzM0MSwiZXhwIjoyMDk3MTgzMzQxfQ.UyksL0KxOcQiYNQBe-WX3CmWPNH-ArRyK6pQmpmvNDY";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================================
// AUTHENTICATION FUNCTIONS
// ============================================================================

/**
 * Sign up with email and password
 */
async function signUpUser(email, password, metadata = {}) {
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        // Prevent sending confirmation emails / OTP flows during sign-up
        emailRedirectTo: null,
      },
    });


    if (error) {
      throw error;
    }

    return { success: true, user: data.user };
  } catch (error) {
    console.error("Sign up error:", error);
    throw error;
  }
}

/**
 * Sign in with email and password
 */
async function signInUser(email, password) {
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return { success: true, session: data.session };
  } catch (error) {
    console.error("Sign in error:", error);
    throw error;
  }
}

/**
 * Sign in with OAuth provider (Google, GitHub, etc.)
 */
async function signInWithOAuth(provider) {
  try {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: provider, // 'google', 'github', etc.
      options: {
        redirectTo: window.location.href,
      },
    });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error(`OAuth sign in error (${provider}):`, error);
    throw error;
  }
}

/**
 * Send password reset email
 */
async function resetPassword(email) {
  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/forgot-password.html`,
      }
    );

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Password reset error:", error);
    throw error;
  }
}

/**
 * Update password using token from reset email
 */
async function updatePasswordWithToken(newPassword) {
  try {
    const { error } = await supabaseClient.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Password update error:", error);
    throw error;
  }
}

/**
 * Sign out the current user
 */
async function signOutUser() {
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      throw error;
    }

    // Clear local state
    localStorage.removeItem("userProfile");
    localStorage.removeItem("authToken");
    localStorage.removeItem("redirectAfterLogin");
    
    return { success: true };
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
}

/**
 * Get current session
 */
async function getCurrentSession() {
  try {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) {
      throw error;
    }
    return data.session;
  } catch (error) {
    console.error("Session retrieval error:", error);
    return null;
  }
}

/**
 * Get current authenticated user
 */
async function getCurrentUser() {
  try {
    const { data, error } = await supabaseClient.auth.getUser();
    if (error) {
      throw error;
    }
    return data.user;
  } catch (error) {
    console.error("User retrieval error:", error);
    return null;
  }
}

/**
 * Set up real-time listener for auth state changes
 */
function onAuthStateChange(callback) {
  return supabaseClient.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

// ============================================================================
// USER PROFILE FUNCTIONS
// ============================================================================

/**
 * Get user profile
 */
async function getUserProfile(userId) {
  try {
    const { data, error } = await supabaseClient
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
}

/**
 * Update user profile
 */
async function updateUserProfile(userId, profileData) {
  try {
    const { data, error } = await supabaseClient
      .from("user_profiles")
      .update({
        ...profileData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
}

/**
 * Upload avatar to storage
 */
async function uploadAvatar(userId, file) {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;

    const { data, error } = await supabaseClient.storage
      .from("avatars")
      .upload(`${userId}/${fileName}`, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Get the public URL
    const { data: publicData } = supabaseClient.storage
      .from("avatars")
      .getPublicUrl(data.path);

    return publicData.publicUrl;
  } catch (error) {
    console.error("Error uploading avatar:", error);
    throw error;
  }
}

// ============================================================================
// LISTING FUNCTIONS
// ============================================================================

/**
 * Create a new listing
 */
async function createListing(listingData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Must be authenticated to create listings");
    }

    const { data, error } = await supabaseClient
      .from("listings")
      .insert({
        user_id: user.id,
        ...listingData,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error creating listing:", error);
    throw error;
  }
}

/**
 * Get listing by ID
 */
async function getListing(listingId) {
  try {
    const { data, error } = await supabaseClient
      .from("listings")
      .select("*, user_profiles(display_name, avatar_url)")
      .eq("id", listingId)
      .eq("status", "active")
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error("Error fetching listing:", error);
    return null;
  }
}

/**
 * Get all active listings with filtering
 */
async function getListings(filters = {}) {
  try {
    let query = supabaseClient
      .from("listings")
      .select("*, user_profiles(display_name, avatar_url)")
      .eq("status", "active");

    if (filters.category) {
      query = query.eq("category", filters.category);
    }

    if (filters.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    if (filters.location) {
      query = query.eq("location", filters.location);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching listings:", error);
    return [];
  }
}

/**
 * Get listings created by a specific user
 */
async function getUserListings(userId) {
  try {
    const { data, error } = await supabaseClient
      .from("listings")
      .select("*, user_profiles(display_name, avatar_url)")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching user listings:", error);
    return [];
  }
}

/**
 * Update a listing
 */
async function updateListing(listingId, updates) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Must be authenticated");
    }

    const { data, error } = await supabaseClient
      .from("listings")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", listingId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error updating listing:", error);
    throw error;
  }
}

/**
 * Delete a listing
 */
async function deleteListing(listingId) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Must be authenticated");
    }

    const { error } = await supabaseClient
      .from("listings")
      .delete()
      .eq("id", listingId)
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting listing:", error);
    throw error;
  }
}

/**
 * Upload listing images
 */
async function uploadListingImage(listingId, file) {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${listingId}-${Date.now()}.${fileExt}`;

    const { data, error } = await supabaseClient.storage
      .from("listings")
      .upload(`${listingId}/${fileName}`, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const { data: publicData } = supabaseClient.storage
      .from("listings")
      .getPublicUrl(data.path);

    return publicData.publicUrl;
  } catch (error) {
    console.error("Error uploading listing image:", error);
    throw error;
  }
}

/**
 * Increment listing view count
 */
async function incrementListingViews(listingId) {
  try {
    const { error } = await supabaseClient.rpc(
      "increment_listing_views",
      { listing_id: listingId }
    );

    if (error) {
      console.error("Error incrementing views:", error);
    }
  } catch (error) {
    console.error("Error in increment views:", error);
  }
}

// ============================================================================
// FAVORITES FUNCTIONS
// ============================================================================

/**
 * Add listing to favorites
 */
async function addToFavorites(listingId) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Must be authenticated");
    }

    const { data, error } = await supabaseClient
      .from("favorites")
      .insert({
        user_id: user.id,
        listing_id: listingId,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error adding to favorites:", error);
    throw error;
  }
}

/**
 * Remove from favorites
 */
async function removeFromFavorites(listingId) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Must be authenticated");
    }

    const { error } = await supabaseClient
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", listingId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Error removing from favorites:", error);
    throw error;
  }
}

/**
 * Get user's favorites
 */
async function getUserFavorites(userId) {
  try {
    const { data, error } = await supabaseClient
      .from("favorites")
      .select("listing_id, listings(*, user_profiles(display_name))")
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return [];
  }
}

// ============================================================================
// CART FUNCTIONS
// ============================================================================

/**
 * Add item to cart
 */
async function addToCart(listingId, quantity = 1) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Must be authenticated");
    }

    const { data, error } = await supabaseClient
      .from("cart_items")
      .insert({
        user_id: user.id,
        listing_id: listingId,
        quantity,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error adding to cart:", error);
    throw error;
  }
}

/**
 * Remove item from cart
 */
async function removeFromCart(cartItemId) {
  try {
    const { error } = await supabaseClient
      .from("cart_items")
      .delete()
      .eq("id", cartItemId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Error removing from cart:", error);
    throw error;
  }
}

/**
 * Get user's cart
 */
async function getUserCart(userId) {
  try {
    const { data, error } = await supabaseClient
      .from("cart_items")
      .select("*, listings(*)")
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching cart:", error);
    return [];
  }
}

// ============================================================================
// MESSAGES FUNCTIONS
// ============================================================================

/**
 * Send a message
 */
async function sendMessage(recipientId, messageText, listingId = null) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Must be authenticated");
    }

    const { data, error } = await supabaseClient
      .from("messages")
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        listing_id: listingId,
        message_text: messageText,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

/**
 * Get user's conversations
 */
async function getUserMessages(userId) {
  try {
    const { data, error } = await supabaseClient
      .from("messages")
      .select("*, sender:sender_id(*), recipient:recipient_id(*)")
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
}

// ============================================================================
// ACTIVITY TRACKING
// ============================================================================

/**
 * Log user activity
 */
async function logActivity(actionType, listingId = null, metadata = {}) {
  try {
    const user = await getCurrentUser();

    const { error } = await supabaseClient.from("activity_logs").insert({
      user_id: user?.id,
      action_type: actionType,
      listing_id: listingId,
      metadata,
    });

    if (error) {
      console.error("Error logging activity:", error);
    }
  } catch (error) {
    console.error("Activity logging failed:", error);
  }
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

/**
 * Subscribe to listing updates
 */
function subscribeToListing(listingId, callback) {
  return supabaseClient
    .from(`listings:id=eq.${listingId}`)
    .on("*", (payload) => {
      callback(payload);
    })
    .subscribe();
}

/**
 * Subscribe to messages in real-time
 */
function subscribeToMessages(userId, callback) {
  return supabaseClient
    .from(`messages:recipient_id=eq.${userId}`)
    .on("INSERT", (payload) => {
      callback(payload);
    })
    .subscribe();
}