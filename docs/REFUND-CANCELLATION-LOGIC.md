# Refund-Based Cancellation Logic - Complete Guide

## Overview

This document describes the comprehensive subscription cancellation and refund logic implemented to align with the refund policy at `/refund`.

## Core Principles

1. **7-Day Window**: Subscriptions can only be cancelled within 7 days of purchase
2. **48-Hour Automatic Refund**: Full refund for ≤5 messages used within 48 hours
3. **Usage-Based Refunds**: Prorated refunds based on actual message usage
4. **Immediate vs Scheduled**: Different cancellation modes based on eligibility

## Cancellation Decision Tree

```
User clicks "Cancel Subscription"
         │
         ▼
   Check subscription age
         │
         ├─> 7+ days ❌ BLOCK CANCELLATION
         │    └─> Return 403 Forbidden
         │        Explain 7-day policy
         │
         ├─> ≤7 days ✓
         │    │
         │    ▼
         │   Check hours since subscription & messages used
         │    │
         │    ├─> ≤48h AND ≤5 messages ✅ IMMEDIATE CANCELLATION
         │    │    ├─> Cancel in Creem (mode: 'immediate')
         │    │    ├─> DELETE subscription from database
         │    │    ├─> User downgraded to free tier
         │    │    └─> Chat model: glm-4-flash
         │    │
         │    ├─> ≤48h BUT >5 messages 📊 SCHEDULED + REFUND CALC
         │    │    ├─> Calculate refund percentage
         │    │    ├─> Cancel in Creem (mode: 'scheduled')
         │    │    ├─> Mark cancel_at_period_end=true
         │    │    └─> User emails for refund
         │    │
         │    └─> 48h-7d 📧 SCHEDULED + SUPPORT REVIEW
         │         ├─> Cancel in Creem (mode: 'scheduled')
         │         ├─> Mark cancel_at_period_end=true
         │         └─> User emails for refund consideration
```

## Detailed Rules

### RULE 1: 7+ Days Since Subscription

**Condition**: `daysSinceSubscription > 7`

**Action**: BLOCK cancellation

**Response**:
```json
{
  "error": "Cancellation period expired",
  "message": "According to our refund policy, subscription cancellation and refund requests must be submitted within 7 days of purchase. Your subscription was created X days ago.",
  "daysSinceSubscription": 8,
  "policyUrl": "/refund",
  "canContactSupport": true
}
```

**HTTP Status**: 403 Forbidden

**User Message**:
```
Your subscription was created 8 days ago.
According to our refund policy, subscription cancellations must be
submitted within 7 days of purchase.

If you have exceptional circumstances, please contact us at
support@zeninsight.xyz
```

---

### RULE 2: ≤48 Hours AND ≤5 Messages

**Conditions**:
- `hoursSinceSubscription ≤ 48`
- `usageCount ≤ 5`

**Action**: IMMEDIATE cancellation and downgrade

**Process**:
1. Cancel in Creem with `mode: 'immediate'`
2. DELETE subscription from database (not just mark)
3. User becomes free user immediately
4. Chat model downgrades to glm-4-flash
5. Daily limit reduces to 20 messages

**Response**:
```json
{
  "success": true,
  "immediateCancellation": true,
  "fullyRefundable": true,
  "message": "Your subscription has been cancelled immediately. You have been downgraded to the free tier and can continue using our service with 20 messages per day.",
  "newTier": "free",
  "newModel": "glm-4-flash",
  "dailyLimit": 20
}
```

**User Experience**:
- ✅ Instant cancellation
- ✅ Instant downgrade to free tier
- ✅ Chat model: glm-4-flash (not glm-4.7)
- ✅ Daily limit: 20 messages
- ✅ Fully refundable (automatic approval)

**Database State**:
- Before: 1 subscription (Annual/Monthly, active)
- After: 0 subscriptions (deleted)

---

### RULE 3: ≤48 Hours BUT >5 Messages

**Conditions**:
- `hoursSinceSubscription ≤ 48`
- `usageCount > 5`

**Action**: SCHEDULED cancellation with refund calculation

**Refund Calculation**:
```javascript
messagesPerDay = 100
daysOfQuotaUsed = Math.ceil(messagesUsed / messagesPerDay)
planDays = annual ? 365 : 30
refundPercentage = ((planDays - daysOfQuotaUsed) / planDays) * 100
estimatedRefund = (refundPercentage / 100) * planPrice
```

**Examples**:

| Messages Used | Days of Quota | Refund % (Annual) | Refund Amount | Refund % (Monthly) | Refund Amount |
|---------------|---------------|-------------------|---------------|--------------------|---------------|
| 7             | 1             | 99.7%             | $19.84        | 96.7%              | $2.89         |
| 10            | 1             | 99.7%             | $19.84        | 96.7%              | $2.89         |
| 50            | 1             | 99.7%             | $19.84        | 96.7%              | $2.89         |
| 100           | 1             | 99.7%             | $19.84        | 96.7%              | $2.89         |
| 200           | 2             | 99.5%             | $19.80        | 93.3%              | $2.79         |
| 500           | 5             | 98.6%             | $19.62        | 83.3%              | $2.49         |
| 1000          | 10            | 97.3%             | $19.36        | 66.7%              | $1.99         |

**Process**:
1. Calculate refund percentage based on usage
2. Cancel in Creem with `mode: 'scheduled'`
3. Update database: `cancel_at_period_end=true`
4. Keep subscription active until period end
5. User emails support with refund info

**Response**:
```json
{
  "success": true,
  "status": "active",
  "current_period_end": "2025-01-18T00:00:00.000Z",
  "immediateCancellation": false,
  "message": "Your subscription will be cancelled at the end of your billing period on January 18, 2025. You can continue using all features until then.",
  "refundInfo": {
    "usageCount": 10,
    "daysOfQuotaUsed": 1,
    "planDays": 365,
    "refundPercentage": "99.73%",
    "estimatedRefund": "$19.84",
    "needEmailSupport": true
  },
  "accessUntil": "2025-01-18T00:00:00.000Z",
  "supportEmail": "support@zeninsight.xyz"
}
```

**User Message**:
```
Your subscription will be cancelled on January 18, 2025.
You can continue using all features until then.

Refund Information:
• Messages used: 10
• Estimated refund: $19.84
• Refund percentage: 99.73%

Since you used more than 5 messages within 48 hours, please
contact us at support@zeninsight.xyz to process your refund.

Mention your subscription ID and we will calculate your exact refund amount.
```

**User Experience**:
- ✅ Keeps access until period end
- ✅ Full Pro benefits (glm-4.7, 100 messages/day)
- ✅ Must email for refund processing
- ✅ Prorated refund based on usage

---

### RULE 4: 48 Hours - 7 Days

**Condition**: `hoursSinceSubscription > 48 && daysSinceSubscription ≤ 7`

**Action**: SCHEDULED cancellation, support review

**Process**:
1. Cancel in Creem with `mode: 'scheduled'`
2. Update database: `cancel_at_period_end=true`
3. User keeps access until period end
4. Refunds evaluated case-by-case

**Response**:
```json
{
  "success": true,
  "status": "active",
  "current_period_end": "2025-01-18T00:00:00.000Z",
  "immediateCancellation": false,
  "message": "Your subscription will be cancelled at the end of your billing period on January 18, 2025. You can continue using all features until then.\n\nIf you would like to request a refund, please contact us at support@zeninsight.xyz for review.",
  "refundInfo": null,
  "accessUntil": "2025-01-18T00:00:00.000Z",
  "supportEmail": "support@zeninsight.xyz"
}
```

**User Experience**:
- ✅ Keeps access until period end
- ✅ Full Pro benefits until then
- ✅ Can email support for refund review
- ⚠️ Refund not guaranteed (case-by-case)

## Code Implementation

### API Endpoint

**File**: `app/api/subscription/cancel/route.ts`

**Key Logic**:
```typescript
// Calculate time and usage
const hoursSinceSubscription = Math.floor((now - createdAt) / (1000 * 60 * 60))
const daysSinceSubscription = Math.floor(hoursSinceSubscription / 24)

// RULE 1: Block after 7 days
if (daysSinceSubscription > 7) {
  return 403 Forbidden
}

// RULE 2: Immediate cancel (≤48h, ≤5 messages)
if (hoursSinceSubscription <= 48 && usageCount <= 5) {
  await cancelSubscription({ mode: 'immediate' })
  await adminClient.from('subscriptions').delete().eq('id', subscription.id)
  return { immediateCancellation: true, fullyRefundable: true }
}

// RULE 3: Calculate refund (≤48h, >5 messages)
if (hoursSinceSubscription <= 48 && usageCount > 5) {
  // Calculate refund percentage
  const daysOfQuotaUsed = Math.ceil(usageCount / 100)
  const refundPercentage = ((planDays - daysOfQuotaUsed) / planDays) * 100
  // Fall through to scheduled cancellation
}

// RULE 4: Scheduled cancellation (default)
await cancelSubscription({ mode: 'scheduled' })
await adminClient.from('subscriptions').update({ cancel_at_period_end: true })
```

### Frontend Component

**File**: `components/cancel-subscription-button.tsx`

**Handling Different Responses**:
```typescript
if (response.status === 403) {
  // Show 7-day policy error
  alert(data.error + '\n\n' + data.message)
  return
}

if (data.immediateCancellation && data.fullyRefundable) {
  // Show immediate cancellation message
  alert(data.message)
  router.refresh()
  return
}

if (data.refundInfo) {
  // Show refund calculation
  alert(data.message + '\n\nRefund Information:\n' +
    '• Messages used: ' + data.refundInfo.usageCount +
    '\n• Estimated refund: ' + data.refundInfo.estimatedRefund +
    '\n• Refund percentage: ' + data.refundInfo.refundPercentage)
  router.refresh()
  return
}
```

## Testing Scenarios

### Scenario 1: Quick Cancellation (≤48h, ≤5 messages)
```
1. Subscribe to Annual plan
2. Use 3 messages
3. Cancel within 24 hours

Expected Result:
✅ Subscription immediately cancelled
✅ Database: 0 subscriptions (deleted)
✅ User tier: Free
✅ Chat model: glm-4-flash
✅ Daily limit: 20 messages
✅ Message: "downgraded to free tier"
```

### Scenario 2: Heavy Usage Within 48h
```
1. Subscribe to Annual plan
2. Use 50 messages
3. Cancel within 24 hours

Expected Result:
✅ Subscription scheduled to cancel
✅ Keeps access until period end
✅ Chat model: glm-4.7 (still Pro)
✅ Daily limit: 100 messages
✅ Refund: ~99.7% ($19.84)
✅ Message: "Email support@zeninsight.xyz for refund"
```

### Scenario 3: Moderate Usage, 5 Days
```
1. Subscribe to Annual plan
2. Use 200 messages over 5 days
3. Cancel on day 5

Expected Result:
✅ Subscription scheduled to cancel
✅ Keeps access until period end
✅ Chat model: glm-4.7
✅ Daily limit: 100 messages
✅ Message: "Email for refund review"
```

### Scenario 4: After 7 Days
```
1. Subscribe to Annual plan
2. Wait 8 days
3. Try to cancel

Expected Result:
❌ Cancellation blocked
✅ HTTP 403 Forbidden
✅ Message: "Cancellation period expired (8 days)"
✅ Suggestion: "Contact support for exceptional circumstances"
```

### Scenario 5: Exactly 5 Messages at 47 Hours
```
1. Subscribe to Annual plan
2. Use exactly 5 messages
3. Cancel at 47 hours

Expected Result:
✅ RULE 2 applies (≤48h, ≤5 messages)
✅ Immediate cancellation
✅ Fully refundable
```

### Scenario 6: Exactly 6 Messages at 47 Hours
```
1. Subscribe to Annual plan
2. Use exactly 6 messages
3. Cancel at 47 hours

Expected Result:
✅ RULE 3 applies (≤48h, >5 messages)
✅ Scheduled cancellation
✅ Refund: ~99.7% (1 day of quota used)
```

## Database States

### Immediate Cancellation (RULE 2)
```sql
-- Before
SELECT * FROM subscriptions WHERE user_id = 'xxx';
-- Returns: 1 row (Annual, active)

-- After cancellation
SELECT * FROM subscriptions WHERE user_id = 'xxx';
-- Returns: 0 rows (DELETED)
```

### Scheduled Cancellation (RULE 3 & 4)
```sql
-- Before
SELECT * FROM subscriptions WHERE user_id = 'xxx';
-- Returns: 1 row (Annual, active, cancel_at_period_end=false)

-- After cancellation
SELECT * FROM subscriptions WHERE user_id = 'xxx';
-- Returns: 1 row (Annual, active, cancel_at_period_end=true)
```

## User Tier Transitions

### Free → Pro
```
Action: User subscribes
Database: INSERT subscription (status='active')
Tier Change: free → pro
Model: glm-4-flash → glm-4.7
Limit: 20 → 100
```

### Pro → Free (Immediate)
```
Action: Cancel within 48h, ≤5 messages
Database: DELETE subscription
Tier Change: pro → free
Model: glm-4.7 → glm-4-flash
Limit: 100 → 20
Timing: IMMEDIATE
```

### Pro → Free (Scheduled)
```
Action: Cancel with >5 messages or after 48h
Database: UPDATE cancel_at_period_end=true
Tier Change: pro → free
Model: glm-4.7 → glm-4-flash
Limit: 100 → 20
Timing: AFTER period end
```

## Refund Calculation Details

### Formula
```
messagesPerDay = 100 (for Pro/Annual plans)
daysOfQuotaUsed = ceil(messagesUsed / messagesPerDay)
planDays = annual ? 365 : 30
refundPercentage = ((planDays - daysOfQuotaUsed) / planDays) × 100
estimatedRefund = (refundPercentage / 100) × planPrice

planPrice:
- Annual: $19.9
- Monthly: $2.99
```

### Why This Formula?

1. **Messages Per Day = 100**: Pro users get 100 messages/day
2. **Ceil Function**: Any partial day counts as a full day (conservative)
3. **Remaining Days**: What the user didn't use is refundable
4. **Percentage**: Fair prorated refund based on unused quota

### Examples

**Annual Plan ($19.9, 365 days)**:
```
7 messages  → 1 day used  → (364/365) × 100 = 99.7% → $19.84
100 messages → 1 day used  → (364/365) × 100 = 99.7% → $19.84
365 messages → 4 days used → (361/365) × 100 = 98.9% → $19.68
3650 messages → 37 days used → (328/365) × 100 = 89.9% → $17.88
```

**Monthly Plan ($2.99, 30 days)**:
```
7 messages  → 1 day used  → (29/30) × 100 = 96.7% → $2.89
100 messages → 1 day used  → (29/30) × 100 = 96.7% → $2.89
300 messages → 3 days used → (27/30) × 100 = 90.0% → $2.69
900 messages → 9 days used → (21/30) × 100 = 70.0% → $2.09
```

## Edge Cases

### Exactly 48 Hours
- 48 hours = RULE 2 (≤48h)
- Eligible for immediate cancellation if ≤5 messages
- Eligible for refund calculation if >5 messages

### Exactly 5 Messages
- 5 messages = RULE 2 (≤5 messages)
- Eligible for immediate cancellation within 48h
- Fully refundable

### Exactly 6 Messages
- 6 messages = RULE 3 (>5 messages)
- Requires refund calculation
- Prorated refund

### Exactly 7 Days
- 7 days = RULE 4 (≤7 days)
- Can cancel, scheduled cancellation
- Support review for refund

### Exactly 8 Days
- 8 days = RULE 1 (>7 days)
- ❌ Cancellation BLOCKED
- 403 Forbidden

### 0 Messages Used
- 0 messages = RULE 2 (≤5 messages)
- Immediate cancellation
- 100% refund ($19.9 or $2.99)

### All Messages Used
- Even if all 100 messages used in one day
- Still only counts as 1 day of quota
- 99.7% refund (for Annual)

## Communication Templates

### Immediate Cancellation (≤48h, ≤5 messages)
```
Subject: Subscription Cancelled - Ask Zen Insight

Your subscription has been cancelled immediately.
You have been downgraded to the free tier.

Your current benefits:
• 20 messages per day
• Model: glm-4-flash
• Chat history: Limited

We're sorry to see you go, but we appreciate your support.
If you have any feedback, please reach out!
```

### Scheduled with Refund Info (≤48h, >5 messages)
```
Subject: Subscription Cancelled - Ask Zen Insight

Your subscription will be cancelled on January 18, 2025.

Refund Information:
• Messages used: 10
• Estimated refund: $19.84
• Refund percentage: 99.73%

Since you used more than 5 messages within 48 hours,
please contact us at support@zeninsight.xyz to process
your refund.

Mention your subscription ID: sub_xxx
```

### Cancellation Blocked (>7 days)
```
Error: Cancellation period expired

According to our refund policy, subscription cancellations
must be submitted within 7 days of purchase.

Your subscription was created 8 days ago.

If you have exceptional circumstances, please contact us at
support@zeninsight.xyz
```

## Integration with Refund Policy

The cancellation logic is fully aligned with `/refund` page:

| Policy Statement | Implementation |
|-----------------|----------------|
| "48-Hour Refund Window: fewer than 5 messages" | RULE 2: Immediate cancellation |
| "7-Day Refund Requests" | RULE 4: Scheduled cancellation |
| "After 7 Days: No refund" | RULE 1: Block cancellation |
| "48h-7d: Contact support" | RULE 4: Support review |

## Monitoring

### Metrics to Track

1. **Cancellation Rate by Time Period**
   - ≤48h cancellations
   - 48h-7d cancellations
   - >7d cancellation attempts (should be 0%)

2. **Cancellation Rate by Usage**
   - ≤5 messages (RULE 2)
   - >5 messages (RULE 3)

3. **Refund Request Rate**
   - Automatic refunds (RULE 2)
   - Calculated refunds (RULE 3)
   - Support reviews (RULE 4)

4. **User Experience**
   - Successful immediate cancellations
   - Blocked cancellations (>7d)
   - Refund processing time

## API Response Examples

### 200 Success - Immediate Cancellation
```json
{
  "success": true,
  "immediateCancellation": true,
  "fullyRefundable": true,
  "message": "Your subscription has been cancelled immediately...",
  "newTier": "free",
  "newModel": "glm-4-flash",
  "dailyLimit": 20
}
```

### 200 Success - Scheduled with Refund Info
```json
{
  "success": true,
  "status": "active",
  "current_period_end": "2025-01-18T00:00:00.000Z",
  "immediateCancellation": false,
  "message": "Your subscription will be cancelled...",
  "refundInfo": {
    "usageCount": 10,
    "daysOfQuotaUsed": 1,
    "planDays": 365,
    "refundPercentage": "99.73%",
    "estimatedRefund": "$19.84",
    "needEmailSupport": true
  },
  "supportEmail": "support@zeninsight.xyz"
}
```

### 403 Forbidden - Past 7 Days
```json
{
  "error": "Cancellation period expired",
  "message": "According to our refund policy...",
  "daysSinceSubscription": 8,
  "policyUrl": "/refund",
  "canContactSupport": true
}
```

## Summary

This implementation provides:

✅ **Clear Rules**: 4 distinct scenarios with specific handling
✅ **Fair Refunds**: Usage-based prorated calculations
✅ **User Protection**: 7-day window for cancellations
✅ **Immediate Downgrade**: For low-usage users (≤5 messages)
✅ **Policy Alignment**: Matches /refund page exactly
✅ **Clear Communication**: Detailed messages for each scenario
✅ **Database Cleanliness**: Only one subscription at a time

**Files Modified**:
- `app/api/subscription/cancel/route.ts` - Core logic
- `components/cancel-subscription-button.tsx` - UI handling

**Documentation**:
- This file: Complete logic guide
- `/refund` page: Policy for users
- `docs/SUBSCRIPTION-CLEANUP.md`: Subscription cleanup logic

**Deployment**: ✅ Commit `bf17c3d`
