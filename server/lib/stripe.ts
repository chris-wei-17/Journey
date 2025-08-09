import Stripe from 'stripe';

// Initialize Stripe with your secret key - handle missing key gracefully
let stripe: Stripe | null = null;

try {
  if (process.env.STRIPE_SECRET_KEY) {
      stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-07-30.basil', // Use latest API version
    typescript: true,
  });
  } else {
    console.warn('⚠️ STRIPE_SECRET_KEY not found - Stripe functionality will be disabled');
  }
} catch (error) {
  console.error('❌ Failed to initialize Stripe:', error);
  stripe = null;
}

export { stripe };

// Membership tier pricing configuration
export const MEMBERSHIP_PRICES = {
  'Ad-free': {
    monthly: process.env.STRIPE_PRICE_ADFREE_MONTHLY || 'price_1Q5K8n2eZvKYlo2C5QYQZvKY', // Test price
    yearly: process.env.STRIPE_PRICE_ADFREE_YEARLY || 'price_1Q5K8n2eZvKYlo2C5QYQZvKY',   // Test price
  },
  'Premium': {
    monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || 'price_1Q5K8n2eZvKYlo2C5QYQZvKY',  // Test price
    yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY || 'price_1Q5K8n2eZvKYlo2C5QYQZvKY',    // Test price
  }
} as const;

// Membership tier metadata
export const MEMBERSHIP_PRODUCTS = {
  'Ad-free': {
    name: 'Journey Ad-Free',
    description: 'All features without advertisements',
    features: ['No ads', 'Priority support', 'Clean interface'],
  },
  'Premium': {
    name: 'Journey Premium',
    description: 'Full access to all premium features',
    features: ['No ads', 'Advanced analytics', 'Custom goals', 'Data export', 'Premium support'],
  }
} as const;

// Helper function to create a checkout session
export async function createCheckoutSession({
  priceId,
  customerId,
  customerEmail,
  successUrl,
  cancelUrl,
  metadata = {},
}: {
  priceId: string;
  customerId?: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  if (!stripe) {
    throw new Error('Stripe not initialized. Cannot create checkout session.');
  }
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer: customerId,
    customer_email: customerId ? undefined : customerEmail,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    subscription_data: {
      metadata,
    },
    // Allow promotion codes
    allow_promotion_codes: true,
    // Automatic tax calculation (optional)
    automatic_tax: { enabled: false },
  });

  return session;
}

// Helper function to create a customer portal session
export async function createCustomerPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  if (!stripe) {
    throw new Error('Stripe not initialized. Cannot create customer portal session.');
  }
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

// Helper function to get subscription details
export async function getSubscriptionDetails(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe not initialized. Cannot retrieve subscription details.');
  }
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['latest_invoice', 'customer', 'items.data.price'],
  });

  return subscription;
}

// Helper function to cancel subscription
export async function cancelSubscription(subscriptionId: string, cancelAtPeriodEnd = true) {
  if (!stripe) {
    throw new Error('Stripe not initialized. Cannot cancel subscription.');
  }
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: cancelAtPeriodEnd,
  });

  return subscription;
}

// Helper function to create or retrieve customer
export async function createOrRetrieveCustomer({
  email,
  userId,
  name,
}: {
  email: string;
  userId: number;
  name?: string;
}) {
  if (!stripe) {
    throw new Error('Stripe not initialized. Cannot create or retrieve customer.');
  }
  // Try to find existing customer by email
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (customers.data.length > 0) {
    return customers.data[0];
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      userId: userId.toString(),
    },
  });

  return customer;
}

// Helper function to determine membership tier from Stripe price ID
export function getMembershipFromPriceId(priceId: string): 'Ad-free' | 'Premium' | null {
  if (!stripe) {
    return null;
  }
  for (const [tier, prices] of Object.entries(MEMBERSHIP_PRICES)) {
    if (prices.monthly === priceId || prices.yearly === priceId) {
      return tier as 'Ad-free' | 'Premium';
    }
  }
  return null;
}

// Helper function to get price information
export async function getPriceInfo(priceId: string) {
  if (!stripe) {
    throw new Error('Stripe not initialized. Cannot retrieve price information.');
  }
  const price = await stripe.prices.retrieve(priceId, {
    expand: ['product'],
  });

  return price;
}