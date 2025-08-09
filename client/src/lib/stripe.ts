import { loadStripe } from '@stripe/stripe-js';

// Load Stripe with your publishable key - handle Vercel build-time vs runtime
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY;

let stripePromise: Promise<any> | null = null;

// Initialize Stripe - handle both build-time and runtime scenarios
function initializeStripe() {
  if (!publishableKey) {
    console.error('❌ VITE_STRIPE_PUBLISHABLE_KEY environment variable is not set');
    console.warn('⚠️ Stripe functionality will be disabled');
    console.info('💡 Environment variables available:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));
    return Promise.resolve(null);
  }
  
  try {
    console.log('✅ Initializing Stripe with publishable key:', publishableKey.substring(0, 12) + '...');
    return loadStripe(publishableKey);
  } catch (error) {
    console.error('❌ Failed to initialize Stripe:', error);
    return Promise.resolve(null);
  }
}

stripePromise = initializeStripe();

export { stripePromise };

// Helper function to redirect to Stripe hosted checkout
export async function redirectToCheckout(sessionId: string) {
  if (!stripePromise) {
    throw new Error('Stripe is not available - check your configuration');
  }
  
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