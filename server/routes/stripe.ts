import { Router } from 'express';
import { authenticateToken, type AuthenticatedRequest } from '../auth.js';
import {
  stripe,
  createCheckoutSession,
  createCustomerPortalSession,
  createOrRetrieveCustomer,
  getMembershipFromPriceId,
  MEMBERSHIP_PRICES,
} from '../lib/stripe.js';
import { db } from '../db.js';
import { users } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

// Check if Stripe is available
function checkStripeAvailable(res: any) {
  if (!stripe) {
    return res.status(503).json({ 
      error: 'Payment processing is currently unavailable. Please try again later.' 
    });
  }
  return true;
}

// Create checkout session for membership upgrade
  router.post('/create-checkout-session', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!checkStripeAvailable(res)) return;
    
    const { tier, interval } = req.body; // tier: 'Ad-free' | 'Premium', interval: 'monthly' | 'yearly'
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!tier || !interval) {
      return res.status(400).json({ error: 'Tier and interval are required' });
    }

    if (!(tier in MEMBERSHIP_PRICES)) {
      return res.status(400).json({ error: 'Invalid membership tier' });
    }

    // Get user details
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = user[0];

    // Create or retrieve Stripe customer
    const customer = await createOrRetrieveCustomer({
      email: userData.email,
      userId: userData.id,
      name: `${userData.firstName} ${userData.lastName}`.trim(),
    });

    // Get price ID
    const priceId = MEMBERSHIP_PRICES[tier as keyof typeof MEMBERSHIP_PRICES][interval];

    // Create checkout session
    const session = await createCheckoutSession({
      priceId,
      customerId: customer.id,
      successUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile`,
      metadata: {
        userId: userId.toString(),
        tier,
        interval,
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Create customer portal session for subscription management
  router.post('/create-portal-session', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!checkStripeAvailable(res)) return;
    
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get user details
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = user[0];

    // Check if user is on a beta tier (no Stripe subscription)
    if (userData.membership === 'Premium (beta)') {
      return res.status(400).json({ 
        error: 'Beta users don\'t have active subscriptions',
        message: 'You are currently on a beta tier. To manage subscriptions, you would need to upgrade to a paid plan first.'
      });
    }

    // Get Stripe customer
    const customers = await stripe!.customers.list({
      email: userData.email,
      limit: 1,
    });

    if (!customers.data.length) {
      return res.status(404).json({ 
        error: 'No subscription found',
        message: 'No active Stripe subscription found for this account.'
      });
    }

    const customer = customers.data[0];

    // Create portal session
    const session = await createCustomerPortalSession({
      customerId: customer.id,
      returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// Stripe webhook endpoint
router.post('/webhook', async (req, res) => {
  if (!checkStripeAvailable(res)) return;
  
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.error('Stripe webhook secret not configured');
    return res.status(500).send('Webhook secret not configured');
  }

  let event;

  try {
    event = stripe!.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook handling failed' });
  }
});

// Webhook handler functions
async function handleCheckoutCompleted(session: any) {
  if (!stripe) {
    console.error('Stripe not available for webhook processing');
    return;
  }
  
  console.log('Checkout completed:', session.id);
  
  const userId = parseInt(session.metadata?.userId);
  if (!userId) {
    console.error('No userId in session metadata');
    return;
  }

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  const priceId = subscription.items.data[0]?.price.id;
  
  if (!priceId) {
    console.error('No price ID found in subscription');
    return;
  }

  // Determine membership tier
  const tier = getMembershipFromPriceId(priceId);
  if (!tier) {
    console.error('Unknown price ID:', priceId);
    return;
  }

  // Update user membership
  await db.update(users)
    .set({ 
      membership: tier,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  console.log(`Updated user ${userId} to ${tier} membership`);
}

async function handleSubscriptionUpdated(subscription: any) {
  if (!stripe) {
    console.error('Stripe not available for webhook processing');
    return;
  }
  
  console.log('Subscription updated:', subscription.id);
  
  const customerId = subscription.customer;
  const priceId = subscription.items.data[0]?.price.id;
  
  if (!priceId) {
    console.error('No price ID found in subscription');
    return;
  }

  // Get user by customer ID
  const customer = await stripe.customers.retrieve(customerId);
  if (typeof customer === 'string' || customer.deleted) {
    console.error('Customer not found or deleted');
    return;
  }

  const userId = parseInt(customer.metadata?.userId || '0');
  if (!userId) {
    console.error('No userId in customer metadata');
    return;
  }

  // Determine membership tier
  const tier = getMembershipFromPriceId(priceId);
  if (!tier) {
    console.error('Unknown price ID:', priceId);
    return;
  }

  // Update user membership
  await db.update(users)
    .set({ 
      membership: tier,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  console.log(`Updated user ${userId} to ${tier} membership`);
}

async function handleSubscriptionDeleted(subscription: any) {
  if (!stripe) {
    console.error('Stripe not available for webhook processing');
    return;
  }
  
  console.log('Subscription deleted:', subscription.id);
  
  const customerId = subscription.customer;
  
  // Get user by customer ID
  const customer = await stripe.customers.retrieve(customerId);
  if (typeof customer === 'string' || customer.deleted) {
    console.error('Customer not found or deleted');
    return;
  }

  const userId = parseInt(customer.metadata?.userId || '0');
  if (!userId) {
    console.error('No userId in customer metadata');
    return;
  }

  // Downgrade user to Free
  await db.update(users)
    .set({ 
      membership: 'Free',
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  console.log(`Downgraded user ${userId} to Free membership`);
}

async function handlePaymentSucceeded(invoice: any) {
  console.log('Payment succeeded for invoice:', invoice.id);
  // Could log successful payments, send confirmation emails, etc.
}

async function handlePaymentFailed(invoice: any) {
  console.log('Payment failed for invoice:', invoice.id);
  // Could send payment failure notifications, attempt retry logic, etc.
}

export default router;