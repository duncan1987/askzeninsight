import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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
                <p>If you cancelled within 48 hours of your initial subscription and have used fewer than 5 messages, you may be eligible for a full refund.</p>
                <p>To request a refund, simply reply to this email with your refund request, and we'll process it within 3 business days.</p>
              </div>

              <div style="text-align: center;">
                <a href="https://zeninsight.xyz" class="button">Visit Ask Zen Insight</a>
              </div>
              <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 10px;">
                Once signed in, you can access your dashboard from the menu
              </p>

              <div class="footer">
                <p>Need help? Contact us at <a href="mailto:support@zeninsight.xyz">support@zeninsight.xyz</a></p>
                <p>Ask Zen Insight • <a href="https://zeninsight.xyz/refund">Refund Policy</a> • <a href="https://zeninsight.xyz/terms">Terms of Service</a></p>
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
