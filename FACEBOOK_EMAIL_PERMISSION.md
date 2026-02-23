# Facebook Email Permission Fix

## Error
```
Invalid Scopes: email. This message is only shown to developers. Users of your app will ignore these permissions if present.
```

## Root Cause
Your Facebook app hasn't been granted permission to request the `email` scope from users.

## Solution

### Quick Fix (Without Email Permission)
The code has been updated to gracefully handle the missing email permission. Users will see:
- **Required:** Enable email permission OR log in manually
- The error prompts users to either approve email access or use traditional login

### Proper Fix (Enable Email Permission)

Follow these steps in your Facebook Developer Console:

#### Step 1: Go to App Settings
1. Open https://developers.facebook.com/apps
2. Select your StyleHub app (ID: 4318310011783198)
3. Go to **Settings → Basic**

#### Step 2: Request Email Permission
1. Go to **Products → Facebook Login → Settings**
2. Scroll down to **Permissions**
3. Add permission: `email`
4. Save changes

#### Step 3: Update Privacy URL
1. Go to **Settings → Basic**
2. Under **App Domains**, ensure `localhost` is added
3. Add **Privacy Policy URL** (required for email permission):
   - For development: `http://localhost:8000/privacy`
   - Or create a simple privacy page

#### Step 4: Submit for Review (Optional)
If you're going to production:
1. Go to **App Roles → Test Users**
2. Add test users to test with email permission
3. Then submit app for review when ready

#### Step 5: Test
Now try logging in with Facebook - you should see permission for email access.

## How It Works Now

1. **User clicks "Login with Facebook"**
2. Requests: name, picture, email
3. User grants permissions (including email)
4. Frontend receives user data with email
5. Backend creates/links user account
6. User is logged in ✅

## If Email Permission Still Not Available

If you don't want to set up email permission yet, users can:
- ✅ Use Google OAuth
- ✅ Use traditional email/password login
- ✅ Wait until you configure email permission

## Development vs Production

- **Development**: Use your test Facebook app
- **Production**: Need a separate production Facebook app with proper permissions and app review

## Troubleshooting

### Still getting error?
1. Clear browser cookies/cache
2. Log out and try again
3. Check that App ID in `.env` is correct

### Email not showing up?
1. Make sure user's Facebook has email set to public
2. Try with a different Facebook account
3. Check app's permission settings again

## Next Steps

1. Follow the steps above to add email permission
2. Test login with Facebook again
3. Reset cache if needed: `Ctrl+Shift+Delete` then reload

---

**Need Help?**
- [Facebook App Roles & Permissions](https://developers.facebook.com/docs/facebook-login/permissions)
- [Privacy Policies](https://developers.facebook.com/docs/apps/review/login-permissions)
