import { loadStripe } from '@stripe/stripe-js';

// Load Stripe with your publishable key
const publishableKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!publishableKey) {
  console.error('❌ VITE_STRIPE_PUBLISHABLE_KEY environment variable is not set');
  throw new Error('Stripe publishable key is required');
}

const stripePromise = loadStripe(publishableKey);

export { stripePromise };

// Helper function to redirect to Stripe hosted checkout
export async function redirectToCheckout(sessionId: string) {
  const stripe = await stripePromise;
  
  if (!stripe) {
    console.error('❌ Stripe failed to load - check your publishable key');
    throw new Error('Stripe failed to load');
  }

  console.log('🔄 Redirecting to Stripe checkout with session:', sessionId);
  
  const { error } = await stripe.redirectToCheckout({
    sessionId,
  });

  if (error) {
    console.error('❌ Stripe checkout error:', error);
    if (error.message?.includes('key')) {
      console.error('💡 This might be a key mismatch issue - check your environment variables');
    }
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