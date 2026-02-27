# Gemini API Quota Exceeded – Resolution Guide

## Issue

Your chat system is showing: **"⚠️ Failed to get AI response. Please try again later."**

The root cause: **Your Gemini API free tier quota has been exceeded.**

## Error Details

```
Status: 429 (Too Many Requests)
Quota exceeded for:
- generativelanguage.googleapis.com/generate_content_free_tier_input_token_count
- generativelanguage.googleapis.com/generate_content_free_tier_requests
```

The Gemini API free tier has daily and per-minute limits. Once exceeded, you can't make requests until:
- The daily quota resets (typically at UTC 00:00)
- OR you enable billing on your Google Cloud project

## Solutions

### Option 1: Wait for Quota Reset (24 hours)
The free tier quota resets daily. You can use the chat feature again tomorrow.

### Option 2: Enable Billing (Recommended for Production)
This allows unlimited requests within Google's rate limits.

**Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Click on the project name → "Billing"
4. Link a payment method
5. Enable billing for the project

Once billing is enabled, there's typically a **free monthly allowance** ($300 in credits) that covers many API calls.

### Option 3: Use a Different API Key
If you have another Google Cloud project with available quota, you can:

1. Get a new API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Update `.env` with the new key:
   ```
   GOOGLE_GEMINI_API_KEY="your_new_api_key_here"
   ```

### Option 4: Switch to Mock Responses (Temporary)
To test your chat system without API calls, temporarily remove the API key:

1. Edit `backend/.env`
2. Comment out or empty the `GOOGLE_GEMINI_API_KEY` line:
   ```
   # GOOGLE_GEMINI_API_KEY=""
   ```
3. The system will automatically use pre-defined mock responses for testing

## Recent Updates

The code has been updated to:
- ✅ Use `gemini-2.5-flash` model (more reliable and available)
- ✅ Better error logging to show quota status
- ✅ Support for newer Gemini models

## Pricing Information

**Free Tier Limits:**
- Requests per minute: Limited
- Requests per day: Limited
- Input tokens per day: Limited

**Paid Tier (with billing enabled):**
- Much higher limits
- Monthly free credit ($300)
- Pay-as-you-go for usage beyond free limits

Pricing is very affordable: ~$0.075 per 1M input tokens for most models.

## Check Your Quota

Monitor your usage at: https://ai.google.dev/rate-limit

## Questions?

- [Gemini API Documentation](https://ai.google.dev/gemini-api)
- [Rate Limits Guide](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Pricing Information](https://ai.google.dev/pricing)

---

**Status:** Chat system is working correctly. The API integration is functional. You just need to resolve the quota issue by enabling billing or waiting for the daily reset.
