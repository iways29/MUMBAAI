import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  try {
    const { record } = await req.json()

    // Send email using Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'MUMBAAI <noreply@yourdomain.com>', // Change to your verified domain
        to: [record.email],
        subject: '🎉 You\'re on the MUMBAAI Waitlist!',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                  line-height: 1.6;
                  color: #292524;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .header {
                  background: linear-gradient(135deg, #FF8811 0%, #F4D06F 100%);
                  padding: 30px;
                  border-radius: 16px;
                  text-align: center;
                  margin-bottom: 30px;
                }
                .header h1 {
                  color: white;
                  margin: 0;
                  font-size: 32px;
                }
                .content {
                  background: #FFF8F0;
                  padding: 30px;
                  border-radius: 16px;
                  border: 2px solid #F4D06F;
                }
                .badge {
                  display: inline-block;
                  background: #9DD9D2;
                  color: #1a6b61;
                  padding: 8px 16px;
                  border-radius: 20px;
                  font-size: 14px;
                  font-weight: 600;
                  margin: 10px 0;
                }
                .footer {
                  text-align: center;
                  margin-top: 30px;
                  color: #78716c;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>✨ Welcome to MUMBAAI!</h1>
              </div>

              <div class="content">
                <p>Hi ${record.name},</p>

                <p>Thank you for joining the MUMBAAI waitlist! We're excited to have you on board.</p>

                <p>You're now among the first to know when we launch our revolutionary branching conversation platform.</p>

                <div style="margin: 20px 0;">
                  <span class="badge">✓ Early Access</span>
                  <span class="badge">✓ Beta Perks</span>
                </div>

                <p><strong>What happens next?</strong></p>
                <ul>
                  <li>We'll notify you as soon as MUMBAAI is ready</li>
                  <li>You'll get priority access during our beta launch</li>
                  <li>Your feedback will help shape the future of AI conversations</li>
                </ul>

                <p>In the meantime, feel free to check out our <a href="https://youtu.be/O620a-fz_4g" style="color: #FF8811;">demo video</a> to see what we're building.</p>

                <p>Stay tuned!</p>

                <p style="margin-top: 30px;">
                  <strong>The MUMBAAI Team</strong><br>
                  <small style="color: #78716c;">A product of The Unreal Lab</small>
                </p>
              </div>

              <div class="footer">
                <p>This email was sent because you signed up for the MUMBAAI waitlist.</p>
                <p>© ${new Date().getFullYear()} MUMBAAI. All rights reserved.</p>
              </div>
            </body>
          </html>
        `,
      }),
    })

    const data = await res.json()

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
