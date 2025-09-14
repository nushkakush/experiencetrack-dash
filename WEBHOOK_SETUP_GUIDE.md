# Webflow Webhook Setup Guide

This guide will help you configure Webflow to send form submissions directly to your database in real-time, eliminating the need for manual syncing.

## What We've Built

✅ **Webhook Edge Function**: `webflow-enquiry-webhook` deployed to Supabase
✅ **Real-time Processing**: Form submissions are processed immediately
✅ **Duplicate Prevention**: Prevents duplicate enquiries from being created
✅ **Form Type Detection**: Automatically detects and maps different form types
✅ **Test Component**: Built-in testing interface in the enquiries page

## Webhook URL

Your webhook endpoint is:

```
https://ghmpaghyasyllfvamfna.supabase.co/functions/v1/webflow-enquiry-webhook
```

## Step 1: Configure Webflow Webhook

### Option A: Using Webflow Designer (Recommended)

1. **Open your Webflow project** in the Designer
2. **Go to Project Settings** → **Integrations** → **Webhooks**
3. **Click "Add Webhook"**
4. **Configure the webhook:**
   - **Name**: `Enquiry Form Submissions`
   - **URL**: `https://ghmpaghyasyllfvamfna.supabase.co/functions/v1/webflow-enquiry-webhook`
   - **Events**: Select "Form Submission"
   - **Method**: POST
   - **Headers**:
     ```
     Content-Type: application/json
     ```

### Option B: Using Webflow API

If you prefer to set up via API, you can use this curl command:

```bash
curl -X POST "https://api.webflow.com/v2/sites/YOUR_SITE_ID/webhooks" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "accept-version: 1.0.0" \
  -H "Content-Type: application/json" \
  -d '{
    "triggerType": "form_submission",
    "url": "https://ghmpaghyasyllfvamfna.supabase.co/functions/v1/webflow-enquiry-webhook",
    "filter": {
      "formId": "YOUR_FORM_ID"
    }
  }'
```

## Step 2: Test the Webhook

1. **Open your Enquiries page** in the dashboard
2. **Click "Test Webhook"** button in the header
3. **Fill out the test form** with sample data
4. **Click "Test Webhook"** to send a test submission
5. **Check the enquiries list** to see if the new enquiry appears

## Step 3: Verify Real-time Processing

1. **Submit a real form** on your Webflow site
2. **Check the enquiries page** - the enquiry should appear immediately
3. **No manual sync needed** - data flows directly from form to database

## Supported Form Types

The webhook automatically handles these form types:

### 1. Contact Form

- **Fields**: name, email, phone, age, professional status, location, career goals, course interest, UTM parameters
- **Mapping**: Maps all standard contact form fields

### 2. Program files-Brochure

- **Fields**: First Name, Email, Phone, Age, Professional Status
- **Mapping**: Simplified mapping for brochure download forms

### 3. Email Form

- **Fields**: Email, UTM parameters
- **Mapping**: Email-only forms with marketing tracking

## Webhook Payload Structure

The webhook expects this payload format from Webflow:

```json
{
  "name": "Form Submission",
  "site": "your-site-id",
  "data": {
    "id": "submission-id",
    "formId": "form-id",
    "siteId": "site-id",
    "formResponse": {
      "field1": "value1",
      "field2": "value2"
    },
    "dateSubmitted": "2024-01-15T10:30:00.000Z"
  },
  "createdOn": "2024-01-15T10:30:00.000Z",
  "lastUpdated": "2024-01-15T10:30:00.000Z"
}
```

## Troubleshooting

### Webhook Not Receiving Data

1. **Check Webflow webhook configuration** - ensure URL is correct
2. **Verify form submissions** - test with a real form submission
3. **Check Supabase logs** - look for webhook function logs
4. **Test with the built-in test component** - use the test interface

### Duplicate Enquiries

- The webhook includes duplicate prevention
- Checks for same email + submission date
- Prevents exact duplicates and same-day duplicates

### Form Data Not Mapping Correctly

1. **Check form field names** in Webflow
2. **Verify form type detection** - ensure form names match expected values
3. **Review webhook logs** for field mapping issues

## Monitoring

### View Webhook Logs

1. Go to Supabase Dashboard
2. Navigate to Edge Functions
3. Select `webflow-enquiry-webhook`
4. View logs for debugging

### Test Webhook Status

- Use the built-in test component in the enquiries page
- Check for success/error messages
- Verify data appears in the enquiries list

## Benefits

✅ **Real-time data**: No more manual syncing
✅ **Immediate visibility**: See enquiries as they come in
✅ **Better user experience**: Faster response to leads
✅ **Reduced errors**: Automated processing eliminates manual mistakes
✅ **Scalable**: Handles high volume of submissions automatically

## Next Steps

1. **Configure the webhook** in Webflow using the steps above
2. **Test thoroughly** with the built-in test component
3. **Monitor for a few days** to ensure everything works correctly
4. **Remove manual sync** once you're confident the webhook is working

## Support

If you encounter any issues:

1. Check the webhook logs in Supabase
2. Use the test component to debug
3. Verify Webflow webhook configuration
4. Check form field names and data structure

The webhook is now ready to handle real-time form submissions! 🚀
