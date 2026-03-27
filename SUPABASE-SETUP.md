# Civic Sense - Supabase Setup Guide

## Step 1: Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Sign up or login
3. Click "New Project"
4. Enter project details:
   - Name: `civic-sense`
   - Database Password: (create a strong password)
   - Region: Choose closest to your users
5. Click "Create new project"

## Step 2: Get Your Credentials
1. Go to Project Settings → API
2. Copy these values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: `eyJ...` (long string)
   - **service_role key**: `eyJ...` (long string, keep secret!)

## Step 3: Create Database Tables
1. Go to SQL Editor in Supabase dashboard
2. Copy the contents of `supabase-schema.sql`
3. Paste and click "Run"
4. This creates all tables, indexes, and security policies

## Step 4: Update Your Configuration

### Update supabase-client.js
Open `supabase-client.js` and replace:
```javascript
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```
With your actual values.

### Update .env file
Create or update `.env` file:
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here
```

## Step 5: Test Connection
1. Open your website
2. Open browser console (F12)
3. Look for "Supabase initialized successfully"
4. Try creating a user or report
5. Check Supabase Table Editor to see data

## Database Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts and profiles |
| `reports` | Civic issue reports |
| `posts` | Community posts |
| `media` | Videos and images |
| `map_issues` | Location-based issues |
| `comments` | Comments on posts/reports |

## Features Enabled

### Real-time Updates
Supabase supports real-time subscriptions. Data updates instantly across all users.

### Authentication (Optional)
You can enable Supabase Auth for secure login:
```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});
```

### File Storage (Optional)
Upload images/videos to Supabase Storage:
```javascript
const { data, error } = await supabase.storage
  .from('civic-uploads')
  .upload('photos/image.jpg', file);
```

## Troubleshooting

### "Failed to initialize Supabase"
- Check your URL and anon key
- Make sure you copied the full key
- Check browser console for errors

### "Row Level Security" errors
- Make sure you ran the SQL schema
- Check RLS policies are enabled
- For testing, you can disable RLS temporarily

### Data not saving
- Check Supabase Table Editor
- Look at browser console for errors
- Verify table names match

## Free Tier Limits
- 500 MB database storage
- 1 GB file storage
- 50,000 monthly active users
- Unlimited API requests

This is plenty for development and small production apps!
