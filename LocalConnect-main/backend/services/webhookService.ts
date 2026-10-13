export async function handleAuthWebhook({ type, data }: { type: string; data: any }) {
  console.log(`Received Auth Webhook: [${type}]`, data);
  // Custom logic implementation (e.g., seeding user profile)
}

export async function handleListingWebhook({ type, record }: { type: string; record: any }) {
  console.log(`Received Listing Webhook: [${type}]`, record.id);
  // Custom logic implementation (e.g., notifications)
}
