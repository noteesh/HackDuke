const { Resend } = require('resend');

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are accepted'
    });
  }

  try {
    const { recipientEmail, recipientName, subject, appealText, userEmail } = req.body;

    // Validation
    if (!recipientEmail || !recipientEmail.includes('@')) {
      return res.status(400).json({ error: 'Valid recipient email is required' });
    }

    if (!appealText || appealText.trim().length === 0) {
      return res.status(400).json({ error: 'Appeal text is required' });
    }

    // Email configuration
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.MAIL_FROM;
    const appName = process.env.APP_NAME || 'The Override';
    const defaultSubject = 'Formal Appeal Regarding Denial Decision';

    // Check if required environment variables are configured
    if (!resendApiKey) {
      return res.status(500).json({ 
        error: 'Email service not configured',
        message: 'RESEND_API_KEY environment variable is required'
      });
    }

    if (!fromEmail) {
      return res.status(500).json({ 
        error: 'Email service not configured',
        message: 'MAIL_FROM environment variable is required'
      });
    }

    // Construct email body with intro
    const emailBody = `Dear ${recipientName || 'Legal Counsel'},

I am writing to formally appeal a recent denial decision. Please find the complete appeal letter below.

────────────────────────────────────────────────────────────────────────────

${appealText}

────────────────────────────────────────────────────────────────────────────

This appeal was prepared with the assistance of ${appName}, an AI-powered legal analysis tool.

Best regards`;

    // Initialize Resend client
    const resend = new Resend(resendApiKey);

    // Send email using Resend SDK
    try {
      const emailData = {
        from: fromEmail,
        to: recipientEmail,
        subject: subject || defaultSubject,
        text: emailBody,
      };

      // Add reply-to if user email is available
      if (userEmail) {
        emailData.reply_to = userEmail;
      }

      const { data, error } = await resend.emails.send(emailData);

      if (error) {
        console.error('[send-appeal] Resend error:', error);
        return res.status(500).json({ 
          error: 'Failed to send email',
          details: error.message || 'Unknown error from Resend'
        });
      }

      console.log('[send-appeal] Email sent successfully via Resend:', data.id);
      return res.status(200).json({ 
        success: true, 
        message: 'Appeal sent successfully to ' + recipientEmail,
        emailId: data.id 
      });

    } catch (emailError) {
      console.error('[send-appeal] Resend SDK error:', emailError);
      return res.status(500).json({ 
        error: 'Failed to send email',
        details: emailError.message 
      });
    }

  } catch (err) {
    console.error('[send-appeal] Error:', err);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: err.message 
    });
  }
}
