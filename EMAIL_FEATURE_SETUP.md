# Send Appeal Email Feature - Setup Guide

## Overview

The "Send Appeal" feature allows users to email generated appeal letters directly to lawyers or law firms from the Appeal tab. The email is sent from the app's email service (not the user's personal email) with the user's email set as reply-to.

## Architecture

- **Frontend**: Email input form in `AppealLetter.jsx` component
- **Backend**: `/api/send-appeal` endpoint in `backend/index.js`
- **Email Provider**: Resend (optional - works in demo mode without it)
- **Auth**: Uses Auth0 user email for reply-to field

## Files Changed

### Backend
- `backend/index.js` - Added `/api/send-appeal` POST endpoint (lines 430-532)
- `backend/.env.example` - Added email configuration variables

### Frontend
- `frontend/src/components/AppealLetter.jsx` - Added email form UI and send logic

## Environment Variables

### Backend Configuration

Add these to your `backend/.env` file:

```bash
# Email Service Configuration (Optional - for sending appeals)
RESEND_API_KEY=re_xxxxxxxxxxxxx
APP_EMAIL_FROM=appeals@yourdomain.com
APP_NAME=The Override
```

**Note**: The feature works in demo mode without these variables. It will log email details to the console instead of actually sending.

## Setup Instructions

### Option 1: Demo Mode (No Email Provider)

The feature works out of the box without any configuration:

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Generate an appeal letter
4. Fill in the recipient email and click "Send to Lawyer"
5. Check the backend console logs to see the email preview

### Option 2: Production Mode with Resend

#### Step 1: Get Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Create a new API key
3. Verify your sending domain (or use Resend's test domain for development)

#### Step 2: Configure Backend

1. Copy `backend/.env.example` to `backend/.env` if you haven't already
2. Add your Resend configuration:

```bash
RESEND_API_KEY=re_your_actual_api_key_here
APP_EMAIL_FROM=appeals@yourdomain.com
APP_NAME=The Override
```

**Important**: 
- The `APP_EMAIL_FROM` domain must be verified in Resend
- For testing, you can use `onboarding@resend.dev` (Resend's test domain)

#### Step 3: Restart Backend

```bash
cd backend
npm run dev
```

## How It Works

### User Flow

1. User generates an appeal letter on the Appeal tab
2. After generation completes, a "Send to Lawyer" section appears
3. User enters:
   - Recipient email (required)
   - Recipient name (optional)
4. User clicks "Send to Lawyer" button
5. Success/error message displays

### Email Details

**From**: App email address (configured in `APP_EMAIL_FROM`)  
**To**: Recipient email entered by user  
**Reply-To**: Authenticated user's email from Auth0  
**Subject**: "Formal Appeal Regarding Denial Decision"  
**Body**: Formatted email with intro + full appeal letter

### Backend Endpoint

**URL**: `POST /api/send-appeal`

**Request Body**:
```json
{
  "recipientEmail": "lawyer@lawfirm.com",
  "recipientName": "Smith & Associates",
  "subject": "Optional custom subject",
  "appealText": "Full appeal letter text...",
  "userEmail": "user@example.com"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Appeal sent successfully",
  "emailId": "abc123"
}
```

**Response (Demo Mode)**:
```json
{
  "success": true,
  "message": "Appeal prepared successfully (email provider not configured - check server logs)",
  "demo": true
}
```

**Response (Error)**:
```json
{
  "error": "Valid recipient email is required"
}
```

## Testing Locally

### Test Without Email Provider (Demo Mode)

1. Start both frontend and backend
2. Generate an appeal letter
3. Enter test email: `test@example.com`
4. Click "Send to Lawyer"
5. Check backend console for email preview:

```
[send-appeal] Email provider not configured. Email details:
  From: appeals@override.app
  To: test@example.com
  Reply-To: user@auth0.com
  Subject: Formal Appeal Regarding Denial Decision
  Body length: 1234 characters

--- Email Preview ---
Dear Legal Counsel,

I am writing to formally appeal...
```

### Test With Resend

1. Configure Resend API key in `.env`
2. Use a real email address you control as recipient
3. Send the appeal
4. Check your inbox for the email
5. Verify reply-to is set correctly

## Validation

The frontend validates:
- ✅ Appeal text exists
- ✅ Recipient email is valid (contains @ and .)
- ✅ Not currently streaming
- ✅ Not already sending

The backend validates:
- ✅ Recipient email is present and contains @
- ✅ Appeal text is present and not empty

## Error Handling

### Frontend Errors
- Network errors display: "Network error: [message]"
- Server errors display the error message from backend
- Demo mode shows: "Appeal prepared successfully (email provider not configured - check server logs)"

### Backend Errors
- Invalid email: 400 status
- Missing appeal text: 400 status
- Resend API errors: 500 status with details
- Internal errors: 500 status

## Security Notes

1. **Email is sent FROM the app**, not the user's Gmail/Auth0 account
2. **Reply-to is set to user's email** so lawyers can respond directly
3. **No Gmail API permissions needed** - Auth0 login doesn't require Gmail send scope
4. **Input validation** on both frontend and backend
5. **Email provider API key** is server-side only (never exposed to frontend)

## Customization

### Change Email Subject

Edit `backend/index.js` line 448:
```javascript
const defaultSubject = 'Your Custom Subject Here';
```

### Change Email Template

Edit the `emailBody` construction in `backend/index.js` lines 450-463:
```javascript
const emailBody = `Your custom template here

${appealText}

Your custom footer`;
```

### Change Button Text

Edit `frontend/src/components/AppealLetter.jsx` line 228:
```javascript
Send to Lawyer
```

## Troubleshooting

### "Email provider not configured" message

**Cause**: `RESEND_API_KEY` not set in backend `.env`  
**Solution**: Add Resend API key or use demo mode for testing

### Email not received

**Checks**:
1. Check spam folder
2. Verify sending domain in Resend dashboard
3. Check Resend logs for delivery status
4. Verify `APP_EMAIL_FROM` domain is verified

### "Failed to send email via Resend"

**Checks**:
1. Verify API key is correct
2. Check Resend dashboard for errors
3. Verify sending domain is verified
4. Check backend console for detailed error

### Button disabled

**Checks**:
1. Appeal letter must be fully generated (not streaming)
2. Recipient email must be valid
3. Appeal text must exist

## Next Steps

### For Production Deployment

1. **Set up custom domain** in Resend
2. **Verify domain** with DNS records
3. **Update `APP_EMAIL_FROM`** to use your domain
4. **Set up email templates** in Resend (optional)
5. **Add email tracking** (optional)
6. **Set up webhooks** for delivery notifications (optional)

### Potential Enhancements

- [ ] Add CC/BCC fields
- [ ] Custom email templates
- [ ] Attachment support (PDF)
- [ ] Email delivery tracking
- [ ] Send history/log
- [ ] Retry failed sends
- [ ] Email preview before sending
- [ ] Multiple recipient support

## Support

For issues with:
- **Resend**: Check [resend.com/docs](https://resend.com/docs)
- **Auth0**: Check Auth0 dashboard for user email availability
- **Feature bugs**: Check backend console logs for detailed errors
