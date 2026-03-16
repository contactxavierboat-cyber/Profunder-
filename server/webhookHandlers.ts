import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { db } from './db';
import { users } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { detectTierFromProductName } from './tierUtils';

async function syncUserTierFromSubscription(customerId: string, subscriptionActive: boolean): Promise<void> {
  const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, customerId));
  if (!user) return;

  if (!subscriptionActive) {
    await db.update(users).set({
      subscriptionStatus: "inactive",
      subscriptionTier: null,
    }).where(eq(users.id, user.id));
    return;
  }

  let tier: "basic" | "repair" | "capital" = "basic";

  const result = await db.execute(
    sql`SELECT p.name FROM stripe.subscriptions s
        JOIN stripe.subscription_items si ON si.subscription = s.id
        JOIN stripe.prices pr ON pr.id = si.price
        JOIN stripe.products p ON p.id = pr.product
        WHERE s.customer = ${customerId} AND s.status = 'active'
        ORDER BY s.created DESC LIMIT 1`
  );

  if (result.rows.length > 0) {
    const row = result.rows[0] as { name: string };
    tier = detectTierFromProductName(row.name);
  } else {
    try {
      const stripe = await getUncachableStripeClient();
      const subs = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
        expand: ["data.items.data.price.product"],
      });
      if (subs.data.length > 0) {
        const item = subs.data[0].items?.data?.[0];
        if (item?.price?.product && typeof item.price.product !== "string") {
          const product = item.price.product;
          if ("name" in product && product.name) {
            tier = detectTierFromProductName(product.name);
          }
        }
      }
    } catch (err) {
      console.error("Webhook: Stripe API fallback error for tier detection:", err);
    }
  }

  await db.update(users).set({
    subscriptionStatus: "active",
    subscriptionTier: tier,
  }).where(eq(users.id, user.id));
}

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. '
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    try {
      const stripe = await getUncachableStripeClient();
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      let event;

      if (endpointSecret) {
        event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
      } else {
        event = JSON.parse(payload.toString());
      }

      const eventType = event.type;

      if (
        eventType === "customer.subscription.created" ||
        eventType === "customer.subscription.updated"
      ) {
        const subscription = event.data.object;
        const customerId = typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id;
        if (customerId) {
          const isActive = subscription.status === "active" || subscription.status === "trialing";
          await syncUserTierFromSubscription(customerId, isActive);
        }
      } else if (eventType === "customer.subscription.deleted") {
        const subscription = event.data.object;
        const customerId = typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id;
        if (customerId) {
          await syncUserTierFromSubscription(customerId, false);
        }
      }
    } catch (err) {
      console.error("Webhook: Error processing subscription tier sync:", err);
    }
  }
}
