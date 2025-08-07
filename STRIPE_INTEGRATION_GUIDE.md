# Stripe Payment Integration Guide

This guide explains how to set up Stripe payment processing for membership subscriptions using Stripe's hosted checkout pages.

## 🎯 **Integration Overview**

### **Architecture**
- **Frontend**: React components for upgrade flows
- **Backend**: Express.js API routes for Stripe operations  
- **Stripe Hosted Checkout**: Secure payment processing
- **Webhooks**: Automatic membership updates
- **Customer Portal**: Subscription management

### **User Flow**
1. User clicks "Upgrade" in membership card
2. Modal opens with pricing options
3. User selects tier and billing interval
4. Redirects to Stripe hosted checkout
5. Payment processed by Stripe
6. Webhook updates user membership
7. User redirected to success page

## 🔧 **Setup Instructions**

### **1. Create Stripe Account**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create account or log in
3. Switch to **Test Mode** for development
4. Get your API keys from **Developers** → **API keys**

### **2. Configure API Keys**
Add these to your `.env` file:

```bash
# Stripe API Keys (Test Mode)
STRIPE_SECRET_KEY=sk_test_51ABC...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51ABC...

# Webhook Secret (created in step 4)
STRIPE_WEBHOOK_SECRET=whsec_ABC...

# Frontend URL for redirects
FRONTEND_URL=http://localhost:5173
```

### **3. Create Products and Prices**

#### **Create Products**
1. Go to **Products** in Stripe Dashboard
2. Click **Add product**

**Ad-free Plan**:
- Name: `Journey Ad-Free`
- Description: `Ad-free fitness tracking experience`

**Premium Plan**:
- Name: `Journey Premium`  
- Description: `Full access to all premium features`

#### **Create Prices**
For each product, create monthly and yearly prices:

**Ad-free Pricing**:
- Monthly: `$4.99/month` (recurring)
- Yearly: `$49.99/year` (recurring, save $10)

**Premium Pricing**:
- Monthly: `$9.99/month` (recurring)
- Yearly: `$99.99/year` (recurring, save $20)

#### **Get Price IDs**
Copy the price IDs and add to `.env`:

```bash
STRIPE_PRICE_ADFREE_MONTHLY=price_1ABC...
STRIPE_PRICE_ADFREE_YEARLY=price_1DEF...
STRIPE_PRICE_PREMIUM_MONTHLY=price_1GHI...
STRIPE_PRICE_PREMIUM_YEARLY=price_1JKL...
```

### **4. Set Up Webhooks**

#### **Create Webhook Endpoint**
1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. **URL**: `https://yourdomain.com/api/stripe/webhook`
4. **Events**: Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

#### **Get Webhook Secret**
1. Click on your webhook endpoint
2. Copy the **Signing secret**
3. Add to `.env` as `STRIPE_WEBHOOK_SECRET`

### **5. Configure Customer Portal**
1. Go to **Settings** → **Billing** → **Customer Portal**
2. Enable customer portal
3. Configure:
   - **Business information**: Add your company details
   - **Privacy policy**: Add link to your privacy policy  
   - **Terms of service**: Add link to your terms
   - **Features**: Enable subscription cancellation, plan changes

## 🎨 **Frontend Components**

### **UpgradeModal**
Modal for selecting membership tier and billing interval:

```tsx
<UpgradeModal
  isOpen={showUpgradeModal}
  onClose={() => setShowUpgradeModal(false)}
  targetTier="Premium" // Optional: pre-select tier
/>
```

### **MembershipCard** 
Enhanced with upgrade/management buttons:

```tsx
<MembershipCard 
  showUpgradeOptions={true}
  className="mb-4"
/>
```

### **SubscriptionSuccess**
Success page after completing payment:
- Accessible at `/subscription/success`
- Shows activated features
- Displays current membership tier

## 🔗 **API Endpoints**

### **Create Checkout Session**
```typescript
POST /api/stripe/create-checkout-session
{
  "tier": "Premium",
  "interval": "monthly"
}

Response:
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

### **Create Customer Portal Session**
```typescript
POST /api/stripe/create-portal-session

Response:
{
  "url": "https://billing.stripe.com/..."
}
```

### **Webhook Endpoint**
```typescript
POST /api/stripe/webhook
// Handles Stripe webhook events
// Automatically updates user membership
```

## 🔄 **Webhook Event Handling**

### **checkout.session.completed**
- Triggered when user completes payment
- Updates user membership tier in database
- Creates customer record if needed

### **customer.subscription.updated**
- Triggered when subscription changes
- Updates membership tier (upgrades/downgrades)
- Handles plan changes from customer portal

### **customer.subscription.deleted**
- Triggered when subscription is cancelled
- Downgrades user to "Free" tier
- Preserves user data

### **invoice.payment_succeeded**
- Logs successful payments
- Optional: Send confirmation emails

### **invoice.payment_failed**
- Logs failed payments
- Optional: Send payment failure notifications

## 💰 **Pricing Strategy**

### **Current Pricing**
| Tier | Monthly | Yearly | Savings |
|------|---------|---------|---------|
| Ad-free | $4.99 | $49.99 | $10 |
| Premium | $9.99 | $99.99 | $20 |

### **Value Proposition**
- **Ad-free**: Primary value is removing ads
- **Premium**: Advanced features + ad-free experience
- **Yearly**: 16-20% discount encourages longer commitment

## 🔒 **Security Features**

### **Webhook Security**
- Stripe signature verification
- Payload validation
- Idempotency handling

### **API Security**
- JWT authentication required
- User data validation
- Rate limiting (future enhancement)

### **PCI Compliance**
- No card data touches your servers
- Stripe handles all sensitive data
- PCI compliance inherited from Stripe

## 🧪 **Testing**

### **Test Cards**
Use Stripe's test cards in checkout:

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
```

### **Webhook Testing**
1. Use Stripe CLI for local testing:
   ```bash
   stripe listen --forward-to localhost:5000/api/stripe/webhook
   ```
2. Trigger test events:
   ```bash
   stripe trigger checkout.session.completed
   ```

### **Test Flow**
1. Set user membership to "Free"
2. Click upgrade button
3. Complete test payment
4. Verify membership updates to selected tier
5. Test customer portal access

## 📈 **Analytics & Monitoring**

### **Stripe Dashboard**
Monitor in Stripe Dashboard:
- **Payments**: Track successful transactions
- **Subscriptions**: Monitor active subscriptions
- **Customers**: View customer details
- **Analytics**: Revenue reports and metrics

### **Application Monitoring**
Track in your app:
- Conversion rates by tier
- Upgrade funnel performance
- Customer lifetime value
- Churn analysis

## 🚀 **Production Deployment**

### **Environment Variables**
Update production environment with live keys:

```bash
# Production Stripe Keys
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://yourdomain.com
```

### **Webhook URL**
Update webhook endpoint URL to production:
`https://yourdomain.com/api/stripe/webhook`

### **Customer Portal**
Update customer portal settings with production URLs:
- Privacy policy: `https://yourdomain.com/privacy`
- Terms of service: `https://yourdomain.com/terms`

## 🔧 **Maintenance**

### **Regular Tasks**
- Monitor webhook delivery success
- Check for failed payments
- Review subscription metrics
- Update pricing as needed

### **Troubleshooting**
- Check webhook logs for delivery issues
- Verify environment variables are set
- Test API endpoints in Stripe Dashboard
- Monitor server logs for errors

## 📞 **Support Resources**

### **Stripe Documentation**
- [Checkout Sessions](https://stripe.com/docs/payments/checkout)
- [Webhooks](https://stripe.com/docs/webhooks)
- [Customer Portal](https://stripe.com/docs/billing/subscriptions/customer-portal)
- [Testing](https://stripe.com/docs/testing)

### **Common Issues**
1. **Webhook not working**: Check endpoint URL and secret
2. **Payment not updating membership**: Verify webhook event handling
3. **Customer portal not loading**: Check customer portal configuration
4. **Test payments failing**: Verify test mode keys

Your Stripe integration is now ready to process payments and manage subscriptions! 🎉

## 🎯 **Next Steps**

1. **Complete Stripe setup** following this guide
2. **Test the full payment flow** in development
3. **Configure production environment** when ready to launch
4. **Monitor metrics** and optimize conversion rates
5. **Consider additional features** like promotional codes or trials