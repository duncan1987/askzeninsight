# Email Setup Guide

This project uses **Resend** to send transactional emails for subscription cancellations.

## Prerequisites

1. **Create a Resend Account**
   - Visit https://resend.com/signup
   - Sign up for a free account (3,000 emails/month free tier)

2. **Verify Your Domain**
   - In Resend Dashboard, go to **Domains** → **Add Domain**
   - Add `zeninsight.xyz` (or your custom domain)
   - Add the DNS records provided by Resend to your domain registrar
   - Wait for DNS verification (usually takes a few minutes to 24 hours)

3. **Create API Key**
   - Go to **API Keys** in Resend Dashboard
   - Click **Create API Key**
   - Give it a name (e.g., "Production")
   - Copy the API key

## Environment Variables

Add the following to your `.env.local` file and **Vercel Environment Variables**:

```bash
# Resend API Key for sending emails
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

## Email Configuration

### From Address
- Default: `support@zeninsight.xyz`
- Make sure this email is verified in your Resend dashboard

### Reply-To
- Users can reply to cancellation emails for refund requests

## Testing

### Local Development
```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

### Test Email Sending
1. Subscribe to a plan
2. Cancel the subscription
3. Check your email for the cancellation confirmation

### View Email Logs
- Visit Resend Dashboard → **Logs**
- See all sent emails and their status

## Email Templates

Currently implemented emails:
- ✅ Subscription Cancellation (when user cancels)

Future emails you could add:
- Welcome email after signup
- Payment confirmation
- Subscription expiry warning
- Refund confirmation

## Troubleshooting

### Email Not Sending
1. Check Resend API key is correct
2. Check domain is verified in Resend
3. Check Vercel logs for errors
4. Check Resend Dashboard → Logs for error details

### Domain Verification Pending
- DNS changes can take up to 24 hours
- Use a tool like `dig` to verify DNS propagation:
  ```bash
  dig TXT zeninsight.xyz
  ```

### Rate Limits
- Free tier: 3,000 emails/month
- If exceeded, upgrade your Resend plan

## Security Notes

- Never commit `RESEND_API_KEY` to git
- Use environment variables in production
- Rotate API keys if compromised
- Restrict API key to production domains only

## Resources

- Resend Documentation: https://resend.com/docs
- Resend Dashboard: https://resend.com/dashboard
- Email Templates Guide: https://resend.com/docs/send-with-nextjs
