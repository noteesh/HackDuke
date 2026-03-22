import { Resend } from 'resend';

export default async function handler(req, res) {
  try {
    console.log('[send-appeal] Request received:', {
      method: req.method,
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : []
    });

    // Only allow POST requests
    if (req.method !== 'POST') {
      console.log('[send-appeal] Method not allowed:', req.method);
      return res.status(405).json({ 
        success: false,
        error: 'Method not allowed',
        message: 'Only POST requests are accepted'
      });
    }

    // Validate request body exists
    if (!req.body) {
      console.error('[send-appeal] No request body');
      return res.status(400).json({ 
        success: false,
        error: 'Missing request body'
      });
    }

    const { recipientEmail, recipientName, subject, appealText, userEmail } = req.body;

    console.log('[send-appeal] Request payload:', {
      recipientEmail: recipientEmail ? '***@' + recipientEmail.split('@')[1] : 'missing',
      recipientName: recipientName || 'not provided',
      hasAppealText: !!appealText,
      appealTextLength: appealText ? appealText.length : 0,
      userEmail: userEmail ? '***@' + userEmail.split('@')[1] : 'not provided'
    });

    // Validation
    if (!recipientEmail || !recipientEmail.includes('@')) {
      console.error('[send-appeal] Invalid recipient email:', recipientEmail);
      return res.status(400).json({ 
        success: false,
        error: 'Valid recipient email is required' 
      });
    }

    if (!appealText || appealText.trim().length === 0) {
      console.error('[send-appeal] Missing appeal text');
      return res.status(400).json({ 
        success: false,
        error: 'Appeal text is required' 
      });
    }

    // Email configuration
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.MAIL_FROM;
    const appName = process.env.APP_NAME || 'The Override';
    const defaultSubject = 'Formal Appeal Regarding Denial Decision';

    console.log('[send-appeal] Environment check:', {
      hasResendKey: !!resendApiKey,
      hasMailFrom: !!fromEmail,
      mailFrom: fromEmail || 'NOT SET',
      appName
    });

    // Check if required environment variables are configured
    if (!resendApiKey) {
      console.error('[send-appeal] Missing RESEND_API_KEY');
      return res.status(500).json({ 
        success: false,
        error: 'Missing RESEND_API_KEY',
        message: 'Email service not configured - RESEND_API_KEY environment variable is required'
      });
    }

    if (!fromEmail) {
      console.error('[send-appeal] Missing MAIL_FROM');
      return res.status(500).json({ 
        success: false,
        error: 'Missing MAIL_FROM',
        message: 'Email service not configured - MAIL_FROM environment variable is required'
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

    console.log('[send-appeal] Email body constructed, length:', emailBody.length);

    // Initialize Resend client
    let resend;
    try {
      resend = new Resend(resendApiKey);
      console.log('[send-appeal] Resend client initialized');
    } catch (initError) {
      console.error('[send-appeal] Failed to initialize Resend:', initError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to initialize email service',
        message: initError.message
      });
    }

    // Prepare email data
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

    console.log('[send-appeal] Sending email via Resend:', {
      from: fromEmail,
      to: recipientEmail,
      subject: emailData.subject,
      hasReplyTo: !!emailData.reply_to,
      bodyLength: emailBody.length
    });

    // Send email using Resend SDK
    try {
      const { data, error } = await resend.emails.send(emailData);

      if (error) {
        console.error('[send-appeal] Resend API returned error:', JSON.stringify(error, null, 2));
        return res.status(500).json({ 
          success: false,
          error: error.message || 'Failed to send email',
          message: error.message || 'Unknown error from Resend',
          details: error
        });
      }

      console.log('[send-appeal] Email sent successfully! ID:', data.id);
      return res.status(200).json({ 
        success: true, 
        message: 'Appeal sent successfully to ' + recipientEmail,
        emailId: data.id 
      });

    } catch (emailError) {
      console.error('[send-appeal] Resend SDK threw exception:', emailError);
      console.error('[send-appeal] Error stack:', emailError.stack);
      return res.status(500).json({ 
        success: false,
        error: emailError.message || 'Failed to send email',
        message: emailError.message,
        details: emailError.toString()
      });
    }

  } catch (err) {
    console.error('[send-appeal] Unexpected error in handler:', err);
    console.error('[send-appeal] Error stack:', err.stack);
    return res.status(500).json({ 
      success: false,
      error: err.message || 'Internal server error',
      message: err.message,
      details: err.toString()
    });
  }
}
