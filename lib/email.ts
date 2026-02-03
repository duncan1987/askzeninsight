import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail({
  userEmail,
  userName,
  plan,
  currentPeriodEnd,
  subscriptionId,
}: {
  userEmail: string
  userName?: string
  plan: string
  currentPeriodEnd: string
  subscriptionId: string
}) {
  try {
    const displayName = userName || userEmail.split('@')[0]
    const periodEndDate = new Date(currentPeriodEnd).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    await resend.emails.send({
      from: 'Ask Zen Insight <support@zeninsight.xyz>',
      to: userEmail,
      subject: 'Welcome to Ask Zen Insight - Your Subscription is Active!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Ask Zen Insight</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9fafb;
              }
              .container {
                background-color: #ffffff;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 1px solid #e5e7eb;
              }
              .logo {
                font-size: 24px;
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 10px;
              }
              .welcome-badge {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #ffffff;
                padding: 8px 20px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 20px;
              }
              .content {
                margin-bottom: 30px;
              }
              .highlight {
                background: linear-gradient(135deg, #f6f8ff 0%, #f0f4ff 100%);
                border-left: 4px solid #667eea;
                padding: 20px;
                margin: 25px 0;
                border-radius: 8px;
              }
              .feature-list {
                background-color: #f3f4f6;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
              }
              .feature-list ul {
                margin: 0;
                padding-left: 20px;
              }
              .feature-list li {
                margin: 10px 0;
                color: #1f2937;
              }
              .details {
                background-color: #f9fafb;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border: 1px solid #e5e7eb;
              }
              .details p {
                margin: 8px 0;
              }
              .details strong {
                color: #1f2937;
              }
              .footer {
                text-align: center;
                color: #6b7280;
                font-size: 14px;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
              }
              .button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #ffffff;
                padding: 14px 28px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                margin: 20px 0;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .emoji-icon {
                font-size: 24px;
                margin-right: 8px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Ask Zen Insight</div>
                <p>Your Spiritual Journey Companion</p>
              </div>

              <div class="content">
                <div class="welcome-badge">
                  🎉 Welcome to the Community!
                </div>

                <h1>Thank You for Subscribing, ${displayName}!</h1>
                <p>We're honored to welcome you to the Ask Zen Insight community. Your subscription is now active, and you've taken a meaningful step toward deepening your spiritual practice.</p>

                <div class="highlight">
                  <p style="margin: 0; color: #4338ca;">
                    <strong>🙏 Thank you for your trust and support.</strong><br>
                    Your subscription helps us continue providing accessible spiritual guidance to seekers worldwide.
                  </p>
                </div>

                <h2>What You Can Now Enjoy</h2>
                <div class="feature-list">
                  <ul>
                    <li><strong>✨ Expanded Daily Messages:</strong> ${plan === 'annual' ? '100' : '100'} messages per day to explore your spiritual questions</li>
                    <li><strong>💾 Chat History Saved:</strong> Your conversations are preserved for future reflection</li>
                    <li><strong>🧘 Advanced AI Insights:</strong> Deeper, more personalized guidance tailored to your journey</li>
                    <li><strong>⭐ Priority Support:</strong> Get help when you need it with our dedicated support team</li>
                    <li><strong>🚀 Early Access:</strong> Be the first to try new features as we develop them</li>
                  </ul>
                </div>

                <div class="details">
                  <p><strong>📋 Your Subscription Details:</strong></p>
                  <p><strong>Plan:</strong> ${plan === 'annual' ? 'Pro Annual' : 'Pro Monthly'}</p>
                  <p><strong>Status:</strong> Active</p>
                  <p><strong>Next billing date:</strong> ${periodEndDate}</p>
                  <p><strong>Subscription ID:</strong> ${subscriptionId}</p>
                </div>

                <h2>Start Your Journey</h2>
                <p>Ready to begin? Your dashboard awaits, where you can start a new conversation, explore previous insights, and manage your subscription.</p>

                <div style="text-align: center;">
                  <a href="https://ask.zeninsight.xyz/chat" class="button">Start Chatting Now</a>
                </div>

                <h2>Questions or Need Help?</h2>
                <p>We're here to support you every step of the way. If you have any questions, concerns, or simply want to share your experience, please don't hesitate to reach out.</p>

                <p><strong>📧 Email:</strong> <a href="mailto:support@zeninsight.xyz">support@zeninsight.xyz</a></p>

                <div class="highlight">
                  <p style="margin: 0; font-size: 14px; color: #6b7280;">
                    <strong>💡 Reminder:</strong> You can cancel anytime from your dashboard. If you cancel within 48 hours and have used 5 or fewer messages, you may be eligible for a full refund.
                  </p>
                </div>
              </div>

              <div class="footer">
                <p>May your journey be filled with clarity and peace. 🌸</p>
                <p style="margin-top: 20px;">
                  <a href="https://ask.zeninsight.xyz/dashboard">Dashboard</a> •
                  <a href="https://ask.zeninsight.xyz/refund">Refund Policy</a> •
                  <a href="https://ask.zeninsight.xyz/terms">Terms of Service</a>
                </p>
                <p style="margin-top: 10px;">
                  Ask Zen Insight • <a href="mailto:support@zeninsight.xyz">support@zeninsight.xyz</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    console.log('[Email] Welcome email sent to:', userEmail)
    return { success: true }
  } catch (error) {
    console.error('[Email] Failed to send welcome email:', error)
    return { success: false, error }
  }
}



export async function sendCancellationEmail({
  userEmail,
  userName,
  plan,
  currentPeriodEnd,
  subscriptionId,
}: {
  userEmail: string
  userName?: string
  plan: string
  currentPeriodEnd: string
  subscriptionId: string
}) {
  try {
    const displayName = userName || userEmail.split('@')[0]
    const periodEndDate = new Date(currentPeriodEnd).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    await resend.emails.send({
      from: 'Ask Zen Insight <support@zeninsight.xyz>',
      to: userEmail,
      subject: 'Subscription Cancelled - Ask Zen Insight',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Subscription Cancelled</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9fafb;
              }
              .container {
                background-color: #ffffff;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 1px solid #e5e7eb;
              }
              .logo {
                font-size: 24px;
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 10px;
              }
              .content {
                margin-bottom: 30px;
              }
              .highlight {
                background-color: #fef3c7;
                border-left: 4px solid #f59e0b;
                padding: 16px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .details {
                background-color: #f3f4f6;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
              }
              .details p {
                margin: 8px 0;
              }
              .details strong {
                color: #1f2937;
              }
              .footer {
                text-align: center;
                color: #6b7280;
                font-size: 14px;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
              }
              .button {
                display: inline-block;
                background-color: #1f2937;
                color: #ffffff;
                padding: 12px 24px;
                border-radius: 6px;
                text-decoration: none;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Ask Zen Insight</div>
                <p>Your Spiritual Journey Companion</p>
              </div>

              <div class="content">
                <h1>Subscription Cancelled</h1>
                <p>Hi ${displayName},</p>
                <p>We're writing to confirm that your subscription has been successfully cancelled.</p>

                <div class="highlight">
                  <strong>What happens next:</strong><br>
                  You'll continue to have full access to all Pro features until the end of your current billing period on <strong>${periodEndDate}</strong>. After that date, your account will revert to the free tier.
                </div>

                <div class="details">
                  <p><strong>Subscription Details:</strong></p>
                  <p><strong>Plan:</strong> ${plan === 'annual' ? 'Pro Annual' : 'Pro Monthly'}</p>
                  <p><strong>Access until:</strong> ${periodEndDate}</p>
                  <p><strong>Subscription ID:</strong> ${subscriptionId}</p>
                </div>

                <p>If you changed your mind, you can resubscribe anytime from your dashboard.</p>

                <h2>Refund Information</h2>
                <p>If you cancelled within 48 hours of your initial subscription and have used 5 or fewer messages, you may be eligible for a full refund.</p>
                <p>To request a refund, simply reply to this email with your refund request, and we'll process it within 3 business days.</p>
              </div>

              <div style="text-align: center;">
                <a href="https://ask.zeninsight.xyz" class="button">Visit Ask Zen Insight</a>
              </div>
              <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 10px;">
                Once signed in, you can access your dashboard from the menu
              </p>

              <div class="footer">
                <p>Need help? Contact us at <a href="mailto:support@zeninsight.xyz">support@zeninsight.xyz</a></p>
                <p>Ask Zen Insight • <a href="https://ask.zeninsight.xyz/refund">Refund Policy</a> • <a href="https://ask.zeninsight.xyz/terms">Terms of Service</a></p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    console.log('[Email] Cancellation email sent to:', userEmail)
    return { success: true }
  } catch (error) {
    console.error('[Email] Failed to send cancellation email:', error)
    return { success: false, error }
  }
}


export async function sendQueuedSubscriptionEmail({
  userEmail,
  userName,
  plan,
  queuedActivationDate,
  subscriptionId,
}: {
  userEmail: string
  userName?: string
  plan: string
  queuedActivationDate: string
  subscriptionId: string
}) {
  try {
    const displayName = userName || userEmail.split('@')[0]
    const activationDate = new Date(queuedActivationDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    await resend.emails.send({
      from: 'Ask Zen Insight <support@zeninsight.xyz>',
      to: userEmail,
      subject: 'New Subscription Queued - Ask Zen Insight',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Subscription Queued</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9fafb;
              }
              .container {
                background-color: #ffffff;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 1px solid #e5e7eb;
              }
              .logo {
                font-size: 24px;
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 10px;
              }
              .content {
                margin-bottom: 30px;
              }
              .highlight {
                background: linear-gradient(135deg, #f6f8ff 0%, #f0f4ff 100%);
                border-left: 4px solid #667eea;
                padding: 20px;
                margin: 25px 0;
                border-radius: 8px;
              }
              .details {
                background-color: #f3f4f6;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
              }
              .details p {
                margin: 8px 0;
              }
              .details strong {
                color: #1f2937;
              }
              .footer {
                text-align: center;
                color: #6b7280;
                font-size: 14px;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
              }
              .badge {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #ffffff;
                padding: 8px 20px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 20px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Ask Zen Insight</div>
                <p>Your Spiritual Journey Companion</p>
              </div>

              <div class="content">
                <div class="badge">
                  🔄 Subscription Queued
                </div>

                <h1>New Subscription Activates Soon, ${displayName}!</h1>
                <p>Your new subscription has been successfully queued and will activate automatically after your current plan ends.</p>

                <div class="highlight">
                  <p style="margin: 0; color: #4338ca;">
                    <strong>What happens next:</strong><br>
                    You'll continue enjoying your current plan until <strong>${activationDate}</strong>.
                    On that date, your new ${plan === 'annual' ? 'Pro Annual' : 'Pro Monthly'} plan will automatically activate.
                  </p>
                </div>

                <div class="details">
                  <p><strong>📋 Your New Subscription Details:</strong></p>
                  <p><strong>New Plan:</strong> ${plan === 'annual' ? 'Pro Annual' : 'Pro Monthly'}</p>
                  <p><strong>Activation Date:</strong> ${activationDate}</p>
                  <p><strong>Subscription ID:</strong> ${subscriptionId}</p>
                </div>

                <h2>What You Need to Do</h2>
                <p><strong>Nothing!</strong> Your new subscription will activate automatically. You'll receive another email confirmation when it becomes active.</p>

                <p>In the meantime, continue using all your current features as usual. Your message history and settings will be preserved when the new plan activates.</p>
              </div>

              <div class="footer">
                <p>Questions? Contact us at <a href="mailto:support@zeninsight.xyz">support@zeninsight.xyz</a></p>
                <p>Ask Zen Insight • <a href="https://ask.zeninsight.xyz/refund">Refund Policy</a> • <a href="https://ask.zeninsight.xyz/terms">Terms of Service</a></p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    console.log('[Email] Queued subscription email sent to:', userEmail)
    return { success: true }
  } catch (error) {
    console.error('[Email] Failed to send queued subscription email:', error)
    return { success: false, error }
  }
}


export async function sendExpiryReminderEmail({
  userEmail,
  userName,
  plan,
  currentPeriodEnd,
  subscriptionId,
}: {
  userEmail: string
  userName?: string
  plan: string
  currentPeriodEnd: string
  subscriptionId: string
}) {
  try {
    const displayName = userName || userEmail.split('@')[0]
    const periodEndDate = new Date(currentPeriodEnd).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    // Calculate days until expiry
    const today = new Date()
    const expiryDate = new Date(currentPeriodEnd)
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    await resend.emails.send({
      from: 'Ask Zen Insight <support@zeninsight.xyz>',
      to: userEmail,
      subject: daysUntilExpiry === 1
        ? 'Your Subscription Expires Tomorrow'
        : `Your Subscription Expires in ${daysUntilExpiry} Days`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Subscription Expiry Reminder</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9fafb;
              }
              .container {
                background-color: #ffffff;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 1px solid #e5e7eb;
              }
              .logo {
                font-size: 24px;
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 10px;
              }
              .alert {
                background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                border-left: 4px solid #f59e0b;
                padding: 20px;
                margin: 25px 0;
                border-radius: 8px;
              }
              .content {
                margin-bottom: 30px;
              }
              .details {
                background-color: #f3f4f6;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
              }
              .details p {
                margin: 8px 0;
              }
              .details strong {
                color: #1f2937;
              }
              .footer {
                text-align: center;
                color: #6b7280;
                font-size: 14px;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
              }
              .button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #ffffff;
                padding: 14px 28px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                margin: 20px 0;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .warning-badge {
                display: inline-block;
                background-color: #f59e0b;
                color: #ffffff;
                padding: 8px 20px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 20px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Ask Zen Insight</div>
                <p>Your Spiritual Journey Companion</p>
              </div>

              <div class="content">
                <div class="warning-badge">
                  ⚠️ Action Required
                </div>

                <h1>Your Subscription Expires Soon, ${displayName}</h1>
                <p>We're writing to remind you that your ${plan === 'annual' ? 'Annual' : 'Monthly'} subscription will expire on <strong>${periodEndDate}</strong>.</p>

                <div class="alert">
                  <p style="margin: 0; color: #92400e;">
                    <strong>What happens when your subscription expires:</strong><br>
                    Your account will revert to the free tier, which includes 10 messages per day
                    and the glm-4-flash model. Your chat history will be preserved, but you'll lose
                    access to premium features.
                  </p>
                </div>

                <div class="details">
                  <p><strong>📋 Your Subscription Details:</strong></p>
                  <p><strong>Plan:</strong> ${plan === 'annual' ? 'Pro Annual' : 'Pro Monthly'}</p>
                  <p><strong>Expiry Date:</strong> ${periodEndDate}</p>
                  <p><strong>Days Remaining:</strong> ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}</p>
                  <p><strong>Subscription ID:</strong> ${subscriptionId}</p>
                </div>

                <h2>Renew Now to Continue Your Journey</h2>
                <p>Don't lose access to your premium features. Renew your subscription to continue enjoying:</p>
                <ul>
                  <li>30 messages per day</li>
                  <li>Advanced AI model (glm-4.7)</li>
                  <li>Chat history preservation</li>
                  <li>Priority support</li>
                </ul>

                <div style="text-align: center;">
                  <a href="https://ask.zeninsight.xyz/pricing" class="button">Renew Your Subscription</a>
                </div>

                <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px;">
                  Or manage your subscription from your dashboard
                </p>
              </div>

              <div class="footer">
                <p>Questions? We're here to help.</p>
                <p><strong>📧 Email:</strong> <a href="mailto:support@zeninsight.xyz">support@zeninsight.xyz</a></p>
                <p>Ask Zen Insight • <a href="https://ask.zeninsight.xyz/dashboard">Dashboard</a> • <a href="https://ask.zeninsight.xyz/pricing">Pricing</a></p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    console.log('[Email] Expiry reminder email sent to:', userEmail)
    return { success: true }
  } catch (error) {
    console.error('[Email] Failed to send expiry reminder email:', error)
    return { success: false, error }
  }
}
