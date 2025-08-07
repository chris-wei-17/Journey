import { loadStripe } from '@stripe/stripe-js';

// Load Stripe with your publishable key
const stripePromise = loadStripe(
  process.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...'
);

export { stripePromise };

// Helper function to redirect to Stripe hosted checkout
export async function redirectToCheckout(sessionId: string) {
  const stripe = await stripePromise;
  
  if (!stripe) {
    throw new Error('Stripe failed to load');
  }

  const { error } = await stripe.redirectToCheckout({
    sessionId,
  });

  if (error) {
    console.error('Stripe checkout error:', error);
    throw error;
  }
}

// Membership pricing display (for UI)
export const MEMBERSHIP_PRICING = {
  'Ad-free': {
    monthly: { price: '$4.99', interval: 'month' },
    yearly: { price: '$49.99', interval: 'year', savings: '$10' },
  },
  'Premium': {
    monthly: { price: '$9.99', interval: 'month' },
    yearly: { price: '$99.99', interval: 'year', savings: '$20' },
  }
} as const;