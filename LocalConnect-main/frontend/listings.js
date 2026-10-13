const CATEGORY_ICON_MAP = {
  furniture: '🛋️',
  electronics: '📱',
  clothing: '👕',
  books: '📚',
  tools: '🔧',
  services: '🛠️',
  housing: '🏠',
  vehicles: '🚲',
  free: '🎁',
};

function getCategoryIcon(category) {
  return CATEGORY_ICON_MAP[category?.toLowerCase()] || '🛍️';
}

function formatPrice(value) {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }

  const text = String(value).trim();
  if (!text.length) {
    return 'N/A';
  }

  if (text.toLowerCase() === 'free') {
    return 'Free';
  }

  const amount = parseFloat(text.replace(/[^0-9.\-]/g, ''));
  if (Number.isNaN(amount)) {
    return text;
  }

  return amount === 0 ? 'Free' : `R${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
}

function formatDate(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function createListingCard(listing) {
  const card = document.createElement('div');
  card.className = 'listing-card';

  const imageWrapper = document.createElement('div');
  imageWrapper.className = 'listing-image';

  if (listing.image_urls && listing.image_urls.length > 0) {
    const img = document.createElement('img');
    img.src = listing.image_urls[0];
    img.alt = listing.title || 'Listing image';
    imageWrapper.appendChild(img);
  } else {
    imageWrapper.textContent = getCategoryIcon(listing.category);
  }

  const content = document.createElement('div');
  content.className = 'listing-content';

  const category = document.createElement('div');
  category.className = 'listing-category';
  category.textContent = listing.category || 'Marketplace';

  const title = document.createElement('div');
  title.className = 'listing-title';
  title.textContent = listing.title || 'Untitled listing';

  const price = document.createElement('div');
  price.className = 'listing-price';
  price.innerHTML = formatPrice(listing.price);

  const location = document.createElement('div');
  location.className = 'listing-location';
  location.textContent = listing.location ? `📍 ${listing.location}` : 'Location not provided';

  const footer = document.createElement('div');
  footer.className = 'listing-footer';

  const date = document.createElement('span');
  date.className = 'listing-date';
  date.textContent = listing.created_at ? formatDate(listing.created_at) : '';

  const seller = document.createElement('div');
  seller.className = 'listing-seller';

  const avatar = document.createElement('div');
  avatar.className = 'seller-avatar';
  avatar.textContent = listing.user_profiles?.display_name
    ? listing.user_profiles.display_name.slice(0, 2).toUpperCase()
    : 'US';

  const sellerName = document.createElement('span');
  sellerName.textContent = listing.user_profiles?.display_name || listing.listing_owner || 'Seller';

  seller.appendChild(avatar);
  seller.appendChild(sellerName);
  footer.appendChild(date);
  footer.appendChild(seller);

  content.appendChild(category);
  content.appendChild(title);
  content.appendChild(price);
  content.appendChild(location);
  content.appendChild(footer);

  card.appendChild(imageWrapper);
  card.appendChild(content);

  card.addEventListener('click', () => {
    window.location.href = `listing.html?id=${listing.id}`;
  });

  return card;
}

function renderListingCards(container, listings, emptyMessage = 'No items have been posted yet.') {
  container.innerHTML = '';

  if (!listings || !listings.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `
      <div>
        <h3>No listings yet</h3>
        <p>${emptyMessage}</p>
      </div>
    `;
    container.appendChild(empty);
    return;
  }

  listings.forEach((listing) => {
    container.appendChild(createListingCard(listing));
  });
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

async function loadHomeFeaturedListings() {
  const container = document.getElementById('featuredListings');
  if (!container) {
    return;
  }

  const listings = await getListings();
  const featured = listings.slice(0, 4);
  renderListingCards(container, featured, 'No featured listings are available yet. Post the first item today.');
}

async function loadBrowseListings() {
  const container = document.getElementById('browseListings');
  const countLabel = document.getElementById('browseCount');
  if (!container || !countLabel) {
    return;
  }

  const category = getQueryParam('cat');
  const search = getQueryParam('q');
  const location = getQueryParam('loc');

  const filters = {};
  if (category) {
    filters.category = category;
  }
  if (search) {
    filters.search = search;
  }
  if (location) {
    filters.location = location;
  }

  const listings = await getListings(filters);
  countLabel.textContent = `${listings.length} result${listings.length === 1 ? '' : 's'}`;
  renderListingCards(container, listings);
}

async function loadProfileListings() {
  const container = document.getElementById('profileListingsGrid');
  if (!container) {
    return;
  }

  const user = await getCurrentUser();
  const listings = user ? await getUserListings(user.id) : [];
  renderListingCards(container, listings, 'You have not posted any listings yet. Start by creating your first item.');
}

async function loadProfileFavorites() {
  const container = document.getElementById('profileFavoritesGrid');
  if (!container) {
    return;
  }

  const user = await getCurrentUser();
  let favorites = [];
  if (user) {
    const rows = await getUserFavorites(user.id);
    favorites = rows
      .map((row) => row.listings)
      .filter(Boolean);
  }

  renderListingCards(container, favorites, 'You have not saved any favorites yet. Add favorites to see them here.');
  }

function formatMemberDate(dateString) {
  if (!dateString) {
    return 'Unknown';
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getProfileField(profile, user, profileKey, metadataKey, fallback = '-') {
  if (profile?.[profileKey]) {
    return profile[profileKey];
  }
  if (user?.user_metadata?.[metadataKey]) {
    return user.user_metadata[metadataKey];
  }
  if (profileKey === 'username' && user?.email) {
    return user.email.split('@')[0];
  }
  return fallback;
}

function getFirstName(profile, user) {
  return getProfileField(profile, user, 'first_name', 'firstName', profile?.display_name?.split(' ')[0] || '-');
}

function getLastName(profile, user) {
  const lastName = getProfileField(profile, user, 'last_name', 'lastName', '-');
  if (lastName === '-' && profile?.display_name) {
    const parts = profile.display_name.split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : '-';
  }
  return lastName;
}

function getProfileDisplayName(profile, user) {
  return getProfileField(profile, user, 'display_name', 'displayName', profile?.username || user?.email?.split('@')[0] || 'User');
}

function getInitials(displayName) {
  if (!displayName) {
    return 'US';
  }
  return displayName
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

async function calculateUserStats(userId) {
  const stats = {
    listingsCount: 0,
    soldCount: 0,
    averageRating: 0,
    reviewsCount: 0,
  };

  if (!userId) {
    return stats;
  }

  try {
    const listings = await getUserListings(userId);
    stats.listingsCount = listings ? listings.length : 0;

    // Note: Sold count and reviews require additional database queries
    // For now, we'll calculate based on available data
    // In a full implementation, these would come from reviews table or listing status
    stats.soldCount = 0;
    stats.averageRating = 0;
    stats.reviewsCount = 0;

    return stats;
  } catch (error) {
    console.error('Error calculating user stats:', error);
    return stats;
  }
}

async function loadProfileHeader() {
  const avatarEl = document.querySelector('.profile-avatar');
  const nameEl = document.querySelector('.profile-info h2');
  const locationEl = document.querySelector('.profile-info .location');
  const statsContainer = document.querySelector('.profile-stats');

  if (!avatarEl || !nameEl || !locationEl) {
    return;
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      window.location.replace('/login.html');
      return;
    }

    const profile = await getUserProfile(user.id);
    const stats = await calculateUserStats(user.id);

    // Update avatar with initials or image
    const initials = getInitials(profile?.display_name || profile?.username || 'User');
    avatarEl.textContent = initials;
    if (profile?.avatar_url) {
      const avatarImg = document.createElement('img');
      avatarImg.src = profile.avatar_url;
      avatarImg.alt = 'Avatar';
      avatarImg.style.width = '100%';
      avatarImg.style.height = '100%';
      avatarImg.style.borderRadius = '50%';
      avatarImg.style.objectFit = 'cover';
      avatarEl.textContent = '';
      avatarEl.appendChild(avatarImg);
    }

    // Update name
    nameEl.textContent = getProfileDisplayName(profile, user);

    // Update location and join date
    const joinDate = profile?.created_at ? formatMemberDate(profile.created_at) : 'Recently';
    const locationText = profile?.location || user?.user_metadata?.location || 'Location not specified';
    locationEl.innerHTML = `📍 ${locationText} • Member since ${joinDate}`;

    // Update stats
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="stat">
          <div class="stat-value">${stats.listingsCount}</div>
          <div class="stat-label">Listings</div>
        </div>
        <div class="stat">
          <div class="stat-value">${stats.soldCount}</div>
          <div class="stat-label">Sold</div>
        </div>
        <div class="stat">
          <div class="stat-value">${stats.averageRating.toFixed(1)}</div>
          <div class="stat-label">Rating</div>
        </div>
        <div class="stat">
          <div class="stat-value">${stats.reviewsCount}</div>
          <div class="stat-label">Reviews</div>
        </div>
      `;
    }

    const firstNameEl = document.getElementById('profileFirstName');
    const lastNameEl = document.getElementById('profileLastName');
    const usernameEl = document.getElementById('profileUsername');
    const locationElDetail = document.getElementById('profileLocation');

    if (firstNameEl) {
      firstNameEl.textContent = getFirstName(profile, user);
    }
    if (lastNameEl) {
      lastNameEl.textContent = getLastName(profile, user);
    }
    if (usernameEl) {
      usernameEl.textContent = getProfileField(profile, user, 'username', 'username', user?.email?.split('@')[0] || '-');
    }
    if (locationElDetail) {
      locationElDetail.textContent = profile?.location || user?.user_metadata?.location || 'Location not specified';
    }
  } catch (error) {
    console.error('Error loading profile header:', error);
  }
}
