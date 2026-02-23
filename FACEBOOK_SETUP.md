# Facebook OAuth Setup Guide

This guide explains how to set up Facebook OAuth authentication for StyleHub.

## Prerequisites
- A Facebook Developer Account (create one at https://developers.facebook.com)
- Access to your application's frontend and backend configuration

## Step 1: Create a Facebook App

1. Go to [Facebook Developers Console](https://developers.facebook.com/apps)
2. Click **"Create App"**
3. Choose **"Consumer"** as the app type
4. Fill in the app details:
   - **App Name**: StyleHub
   - **App Contact Email**: your-email@example.com
   - **App Purpose**: Select appropriate category
5. Complete the setup process

## Step 2: Set Up Facebook Login Product

1. In your app dashboard, click **"Add Product"**
2. Find **"Facebook Login"** and click **"Set Up"**
3. Choose **"Web"** as your platform
4. Enter your website URL (for development: `http://localhost:8000`)

## Step 3: Configure OAuth Redirect URIs

1. Go to **Facebook Login > Settings**
2. Add these URLs to **Valid OAuth Redirect URIs**:
   ```
   http://localhost:8000/
   http://localhost:8000/checkout/success
   http://localhost:8000/orders
   ```
3. Save changes

## Step 4: Get Your App ID

1. Go to **Settings > Basic**
2. Copy your **App ID**
3. Add it to your `.env` file:
   ```
   VITE_FACEBOOK_APP_ID=your_app_id_here
   ```

## Step 5: Configure App Domains

1. Go to **Settings > Basic**
2. Add your app domains:
   - For development: `localhost`
   - For production: `yourdomain.com`

## Step 6: Enable Permissions

1. Go to **Facebook Login > Settings**
2. Ensure these permissions are requested:
   - `public_profile` (default)
   - `email`

## Step 7: Test Facebook Login

1. Start your development server:
   ```bash
   npm run dev
   ```
2. Go to the login/register page
3. Click the **"Login with Facebook"** button
4. If prompted, approve the requested permissions
5. You should be logged in and redirected to the home page

## Environment Variables

Add the following to your `frontend/.env` file:

```env
VITE_API_URL=http://localhost:7000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_FACEBOOK_APP_ID=your_facebook_app_id_here
```

## Troubleshooting

### "Facebook App Not Set Up" Error
- Ensure your App ID is correct in `.env`
- Check that your app domain is registered in Facebook Developer Console

### "Permission Denied" During Login
- Verify that the email permission is enabled
- Check that your app is not in development restriction mode

### CORS or Network Errors
- Ensure `VITE_API_URL` points to your backend (usually `http://localhost:7000/api`)
- Check that your backend server is running

### User Not Found After Login
- The user will be automatically created on first login
- Check backend logs for any database errors

## Backend Setup

The backend already has Facebook login support configured in:
- **Controller**: `backend/controllers/authController.js` (has `facebookLogin` function)
- **Route**: `backend/routes/authRoutes.js` (endpoint: `POST /api/auth/facebook-login`)
- **Model**: `backend/models/User.js` (has `facebookId` field)

### Endpoint
**POST** `/api/auth/facebook-login`

**Request Body:**
```json
{
  "facebookId": "user_facebook_id",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "picture": "https://url-to-profile-picture.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Facebook login successful",
  "data": {
    "user": {
      "id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "user@example.com",
      "role": "user",
      "profileImage": "https://url-to-profile-picture.jpg"
    },
    "token": "jwt_token_here"
  }
}
```

## Security Notes

1. **Never share your App Secret** - Only use App ID in frontend
2. **Use HTTPS in Production** - Facebook requires secure connections
3. **Keep tokens secure** - Never log tokens to console in production
4. **Validate Data** - Always validate user data from social providers
5. **Update Redirect URIs** - When deploying to production, update your OAuth redirect URIs

## Linking Existing Accounts

When a user logs in with Facebook using an email that already exists in the system:
- The existing user account will be linked to their Facebook ID
- No new account will be created
- The user can now log in using either password or Facebook

## Next Steps

1. Test the Facebook login functionality
2. Set up production Facebook app settings when ready to deploy
3. Configure email notifications for successful authentications
4. Monitor login analytics in Facebook Developer Console

For more information, visit [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
