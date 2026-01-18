# Welcome Email Feature

## Overview

This document describes the welcome email functionality that sends a professional email to users when they successfully subscribe to Ask Zen Insight.

## Purpose

- Welcome new subscribers to the community
- Thank users for their trust and support
- Provide subscription details and next steps
- Set clear expectations about features and benefits
- Include support contact information

## Implementation

### 1. Welcome Email Function

**File**: `lib/email.ts`

**Function**: `sendWelcomeEmail()`

**Parameters**:
- `userEmail`: User's email address
- `userName`: User's name (optional)
- `plan`: Subscription plan ('pro' or 'annual')
- `currentPeriodEnd`: End date of billing period
- `subscriptionId`: Creem subscription ID

**Email Content**:
- Professional HTML design with gradient accents
- Personalized greeting with user's name
- List of features included in their plan:
  - Expanded daily messages (6 per day)
  - Chat history saved
  - Advanced AI insights
  - Priority support
  - Early access to new features
- Subscription details:
  - Plan type (Pro Monthly/Annual)
  - Status
  - Next billing date
  - Subscription ID
- Call-to-action button to start chatting
- Support contact information
- Link to refund policy reminder (48-hour window)

### 2. Webhook Integration

**File**: `app/api/creem/webhook/route.ts`

**Triggers**:
1. `checkout.completed` event - When user completes checkout
2. `subscription.active` event - When subscription becomes active (new subscriptions only)

**Logic**:
```typescript
// In checkout.completed handler
if (isNewSubscription) {
  const userEmail = metadata?.userEmail || metadata?.user_email
  if (userEmail) {
    await sendWelcomeEmail({
      userEmail,
      userName: metadata?.userName,
      plan: planType,
      currentPeriodEnd,
      subscriptionId,
    })
  }
}

// In subscription.active handler
const existingSub = await supabase
  .from('subscriptions')
  .select('id')
  .eq('creem_subscription_id', subscriptionId)
  .single()

const isNewSubscription = !existingSub

if (isNewSubscription && userEmail) {
  await sendWelcomeEmail(...)
}
```

**Error Handling**:
- Email failures are logged but don't break the subscription flow
- `console.error` for debugging
- Continues webhook processing even if email fails

## Email Design

### Visual Elements

- **Color Scheme**: Purple gradient (#667eea to #764ba2)
- **Layout**: Clean, centered design with sections
- **Typography**: System fonts for better deliverability
- **Responsive**: Works on mobile and desktop

### Sections

1. **Header**: Logo and tagline
2. **Welcome Badge**: "Welcome to the Community!" with emoji
3. **Thank You Message**: Personalized gratitude
4. **Features List**: Bulleted list of benefits
5. **Subscription Details**: Plan info in a highlighted box
6. **CTA Button**: "Start Chatting Now" (links to /chat)
7. **Support Info**: Email contact and policy links
8. **Footer**: Branding and legal links

### Email Example

**Subject**: Welcome to Ask Zen Insight - Your Subscription is Active!

**From**: Ask Zen Insight <support@zeninsight.xyz>

**Preview**: Thank you for subscribing! Your subscription is now active...

**Content**:
```
🎉 Welcome to the Community!

Thank You for Subscribing, [Name]!

We're honored to welcome you to the Ask Zen Insight community...

[Features List]
✨ Expanded Daily Messages: 6 messages per day
💾 Chat History Saved
🧘 Advanced AI Insights
⭐ Priority Support
🚀 Early Access

[Subscription Details]
Plan: Pro Annual
Status: Active
Next billing date: January 18, 2026

[Button: Start Chatting Now]

Questions? Email us at support@zeninsight.xyz
```

## Configuration

### Environment Variables

Ensure these are set in Vercel:
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

### Setup Instructions

If you haven't set up Resend yet, see: `docs/SETUP-EMAIL.md`

## Testing

### Test Scenarios

1. **New Subscription (Pro Monthly)**
   - Subscribe to Pro monthly plan
   - ✅ Should receive welcome email within 1-2 minutes
   - ✅ Email should show "Pro Monthly" plan
   - ✅ CTA button should link to /chat

2. **New Subscription (Annual)**
   - Subscribe to Annual plan
   - ✅ Should receive welcome email
   - ✅ Email should show "Pro Annual" plan
   - ✅ Should mention "Save 45%" in features

3. **Subscription Renewal**
   - Wait for subscription to renew
   - ✅ Should NOT receive another welcome email
   - ✅ Only new subscriptions trigger welcome email

4. **Plan Change**
   - Cancel Pro and subscribe to Annual
   - ✅ Should receive welcome email for new Annual subscription
   - ✅ Email should reflect correct plan details

5. **Email Delivery**
   - Check spam folder if email not received
   - Verify Resend dashboard for delivery status
   - Check Vercel logs for errors

### Debugging

If emails are not being sent:

1. **Check Environment Variables**:
   ```bash
   # In Vercel dashboard, verify RESEND_API_KEY is set
   ```

2. **Check Vercel Logs**:
   - Look for `[Webhook] Welcome email sent successfully`
   - Look for `[Webhook] Failed to send welcome email`
   - Look for `[Email] Failed to send welcome email`

3. **Check Resend Dashboard**:
   - Go to https://resend.com/dashboard
   - Check "Emails" tab for delivery status
   - Verify "From" domain is verified (zeninsight.xyz)

4. **Check Webhook Payload**:
   - Verify metadata includes `userEmail`
   - Check that userId is present
   - Ensure subscription is being created in database

## Email Templates

### Customization

To modify the email template, edit `lib/email.ts`:

```typescript
export async function sendWelcomeEmail({...}) {
  // Modify HTML template here
  html: `...your custom HTML...`
}
```

### Branding

- **Colors**: Change gradient colors in CSS
- **Logo**: Update text logo in header
- **From Email**: Update in `from` field
- **CTA Link**: Update `href` in button

## Benefits

1. **User Engagement**: Immediate positive interaction
2. **Professionalism**: Shows commitment to quality
3. **Clarity**: Users know exactly what they paid for
4. **Support**: Easy way to contact support
5. **Retention**: Sets expectations and builds trust

## Future Enhancements

Possible improvements:
- [ ] Add user's name to greeting (if available)
- [ ] Include personalized tips for getting started
- [ ] Add links to tutorial/documentation
- [ ] Send onboarding email series (day 1, 3, 7)
- [ ] A/B test email subject lines
- [ ] Track email open rates and clicks
- [ ] Send different emails for different plans

## Related Files

- `lib/email.ts` - Email sending functions
- `app/api/creem/webhook/route.ts` - Webhook handlers
- `docs/SETUP-EMAIL.md` - Resend setup guide
- `app/api/subscription/cancel/route.ts` - Cancellation email

## Support

For issues or questions:
- Email: support@zeninsight.xyz
- Check Resend dashboard: https://resend.com/dashboard
- Check Vercel logs for detailed error messages
