# AI Chat Support - Debugging Guide

## Issues Fixed

1. **Variable naming inconsistency** - Fixed `messageinput` to `messageInput` for proper camelCase
2. **Duplicate context destructuring** - Removed duplicate `loading` import
3. **API URL configuration** - Fixed hardcoded API endpoints and added proper URL fallback
4. **Error display** - Added error message display in the chat widget UI
5. **Environment variable** - Updated `VITE_API_URL` to use correct backend port (5000)

## Troubleshooting Checklist

### 1. **Verify Backend is Running**
```bash
cd backend
npm run dev
```
Should show: `Server running on port 5000`

### 2. **Check Frontend Environment**
Verify `.env.local` in frontend folder has:
```
VITE_API_URL=http://localhost:5000/api
```

### 3. **Verify You're Logged In**
- The chat widget only works for authenticated users
- Make sure you're logged into your account before opening the chat
- If not logged in, you'll see error: "Please login to use the chat feature"

### 4. **Check Browser Console for Errors**
1. Open Developer Tools (F12)
2. Go to **Console** tab
3. Look for any red error messages
4. Screenshot and share the error if chat still doesn't work

### 5. **Test API Endpoint Directly**
Open a new terminal and test:
```bash
# Get your JWT token from localStorage first (from your app)
curl -X POST http://localhost:5000/api/chat/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"message":"Hello","session":"default","category":"general"}'
```

### 6. **Verify MongoDB is Running**
Chat messages are stored in MongoDB. Make sure it's running:
```bash
# On Windows, MongoDB should start with XAMPP or separately
# You can check if it's running by visiting http://localhost:27017 in browser
```

### 7. **Check Network Requests**
1. Open Developer Tools (F12)
2. Go to **Network** tab
3. Try sending a chat message
4. Look for request to `/api/chat/send`
5. Click on it to see:
   - Request status (should be 200)
   - Response body
   - Any error messages

### 8. **Enable OpenAI (Optional)**
Chat works with mock responses by default. For real AI responses:

1. Get OpenAI API key from https://platform.openai.com/api-keys
2. Add to backend `.env`:
```
OPENAI_API_KEY=sk_test_...
```
3. Restart backend

## Common Error Messages

| Error | Solution |
|-------|----------|
| "Please login to use the chat feature" | Not logged in - Login first |
| "Failed to send message" | Backend not running - Start with `npm run dev:backend` |
| "Cannot read property 'data' of null" | API response invalid - Check backend logs |
| CORS error | Backend CORS not configured - Check server.js middleware |
| "404 not found /api/chat/send" | Chat routes not registered - Restart backend |

## What Should Happen

1. **Open Chat**: Click the floating button in bottom-right corner
2. **See Categories**: Product, Order, Shipping, Payment, Returns, General buttons
3. **Type Message**: "What products do you have?"
4. **See Response**: AI response appears below your message
5. **Rate Response**: Click 👍 or 👎 to provide feedback

## If Still Not Working

Run these diagnostic commands:

```bash
# Check if backend is running on correct port
netstat -ano | findstr :5000  # Windows
lsof -i :5000                # Mac/Linux

# Check if MongoDB is running
mongosh --eval "db.adminCommand('ping')"

# Check backend logs (in the running terminal)
# Look for errors related to ChatMessage model or chat routes

# Reinstall dependencies if needed
cd backend
npm install
```

## Advanced Debugging

Add this to your chat component temporarily to see detailed logs:
```javascript
// In ChatContext.jsx - add before the catch block
console.log('API URL:', chatApiUrl);
console.log('Request body:', { message, session: currentSession, category });
console.log('Response:', response.data);
```

Then check the browser console while sending messages.

---

**Need Help?** Check the full guide in: `AI_CHAT_SUPPORT_GUIDE.md`
