# Flutterwave Integration Guide

This guide explains how to set up Flutterwave payment gateway for the LinkedIn Reply AI Chrome Extension.

## 🚀 Quick Setup

### 1. Create Flutterwave Account

1. Sign up at [Flutterwave Dashboard](https://dashboard.flutterwave.com/)
2. Verify your email and complete KYC
3. Navigate to **Settings** → **API Keys**

### 2. Get API Keys

You'll need two keys:

- **Public Key**: Used in the frontend extension
- **Secret Key**: Used in the backend server
- **Webhook Hash**: For verifying webhook events

### 3. Configure Environment Variables

Add these to your backend `.env` file:

```env
# Flutterwave Configuration
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-YOUR_PUBLIC_KEY_HERE
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-YOUR_SECRET_KEY_HERE
FLUTTERWAVE_WEBHOOK_HASH=your_webhook_hash_here

# Existing Gemini API key
GEMINI_API_KEY=your_gemini_api_key_here
```

**For Production:**
- Use live keys (replace `TEST` with nothing)
- Update the extension's `popup.js` with your production public key

### 4. Update Extension Configuration

In `popup.js`, update the Flutterwave configuration:

```javascript
// Line 12-13
const FLUTTERWAVE_PUBLIC_KEY = "FLWPUBK_TEST-YOUR_PUBLIC_KEY_HERE"; // Update with your public key
const FLUTTERWAVE_SECRET_KEY = "FLWSECK_TEST-YOUR_SECRET_KEY_HERE"; // Backend only
```

### 5. Configure Webhooks

1. In Flutterwave Dashboard, go to **Settings** → **Webhooks**
2. Add webhook URL: `https://your-backend-domain.com/api/flutterwave/webhook`
3. Select events: `charge.completed`, `charge.failed`
4. Copy the webhook hash to your `.env` file

### 6. Install Dependencies

```bash
cd backend
npm install
```

This will install the `flutterwave-node-v3` package.

## 💳 Payment Flow

### User Experience

1. User clicks "Pay with Card" on any pricing plan
2. Extension calls backend to create payment link
3. User is redirected to Flutterwave payment page
4. User completes payment (card, mobile money, bank transfer)
5. Flutterwave sends webhook to backend
6. Backend processes payment and updates user status
7. User activates Pro access in extension

### Supported Payment Methods

- **Credit/Debit Cards**: Visa, Mastercard, American Express
- **Mobile Money**: MTN, Airtel, Safaricom, etc.
- **Bank Transfer**: Direct bank transfers
- **USSD**: Dial USSD codes for payment

## 🔧 Backend Endpoints

### Create Payment Link

```http
POST /api/flutterwave/create-payment
Content-Type: application/json

{
  "amount": "10.00",
  "currency": "USD",
  "email": "user@example.com",
  "tx_ref": "pro-upgrade-monthly-1640995200000",
  "plan_type": "monthly",
  "description": "Pro Monthly Subscription - LinkedIn Reply AI"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "link": "https://payment.link/flutterwave/xyz123",
    "tx_ref": "pro-upgrade-monthly-1640995200000"
  }
}
```

### Webhook Handler

```http
POST /api/flutterwave/webhook
verif-hash: your_webhook_hash

{
  "event": "charge.completed",
  "data": {
    "status": "successful",
    "tx_ref": "pro-upgrade-monthly-1640995200000",
    "customer": {
      "email": "user@example.com"
    },
    "amount": 10.00
  }
}
```

## 🌍 Supported Countries

Flutterwave supports payments in over 150 countries including:

- **Nigeria** 🇳🇬
- **Kenya** 🇰🇪
- **South Africa** 🇿🇦
- **Ghana** 🇬🇭
- **Uganda** 🇺🇬
- **United Kingdom** 🇬🇧
- **United States** 🇺🇸
- **Canada** 🇨🇦
- And many more...

## 🔒 Security Features

- **Webhook Verification**: All webhooks are verified using secret hash
- **Input Validation**: All payment requests are validated
- **Rate Limiting**: Payment endpoints are rate-limited
- **HTTPS Only**: Production endpoints require HTTPS
- **No Sensitive Data**: API keys stored securely in environment variables

## 🧪 Testing

### Test Mode

1. Use test API keys for development
2. Flutterwave provides test cards for simulation:
   - **Success**: `5399 9999 9999 9999`
   - **Failure**: `4242 4242 4242 4242`
   - **3DS Challenge**: `5555 5555 5555 4444`

### Test Webhooks

Use Flutterwave's webhook testing tool in the dashboard to simulate payment events.

## 🚀 Deployment

### Environment Variables

```env
# Production
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-YOUR_PUBLIC_KEY_HERE
FLUTTERWAVE_SECRET_KEY=FLWSECK-YOUR_SECRET_KEY_HERE
FLUTTERWAVE_WEBHOOK_HASH=your_production_webhook_hash
```

### Required Updates

1. Update `popup.js` with production public key
2. Set webhook URL to production backend
3. Update callback URLs in Flutterwave dashboard
4. Test with real payments (small amounts)

## 📝 Monitoring

### Payment Logs

The backend logs all payment events:

```bash
# Check payment logs
tail -f logs/app.log | grep "Flutterwave"
```

### Failed Payments

Monitor webhook failures and payment errors:

```javascript
// In backend logs
console.log('Flutterwave webhook received:', event);
console.log(`Payment successful: ${planType} plan for ${customer.email}`);
```

## 🆘 Troubleshooting

### Common Issues

1. **"Invalid API keys"**
   - Check environment variables
   - Ensure correct test/live keys

2. **"Webhook verification failed"**
   - Verify webhook hash in `.env`
   - Check webhook URL is accessible

3. **"Payment link creation failed"**
   - Check Flutterwave service status
   - Verify request payload format

4. **"User not activated after payment"**
   - Check webhook processing
   - Verify database updates

### Debug Mode

Enable debug logging in development:

```javascript
// In backend server.js
if (NODE_ENV === 'development') {
  console.log('Flutterwave Debug Mode Enabled');
}
```

## 📞 Support

- **Flutterwave Support**: support@flutterwave.com
- **Documentation**: [Flutterwave Docs](https://developer.flutterwave.com/)
- **Status Page**: [Flutterwave Status](https://status.flutterwave.com/)

## 🔄 Migration from Crypto Only

If migrating from crypto-only payments:

1. Keep existing NOWPayments integration
2. Add Flutterwave as additional option
3. Update UI to show both payment methods
4. Test both payment flows
5. Gradually promote card payments to users

This gives users flexibility while maintaining existing functionality.
