# 🗄️ Database Setup Guide - Fleet Management System

## ⚠️ Issue Resolution

The error `ERROR: 42501: must be owner of table users` occurs because the original schema tried to modify Supabase's built-in `auth.users` table. This has been fixed in the new schema.

## 📋 Step-by-Step Setup

### 1. **Create Supabase Project**
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose your organization
4. Set project name: `pls-travels-fleet`
5. Set database password (save this!)
6. Choose region closest to you
7. Click "Create new project"
8. Wait for project to be ready (~2 minutes)

### 2. **Get Your Credentials**
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (starts with `https://`)
   - **anon public key** (starts with `eyJ`)

### 3. **Set Up Environment Variables**
1. In your project root (`E:\AK`), create `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 4. **Run the Database Schema**

#### Option A: Use the Fixed Schema (Recommended)
1. Go to your Supabase dashboard
2. Click **SQL Editor** in the sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase/schema-fixed.sql`
5. Paste it into the SQL editor
6. Click **Run** (bottom right)
7. ✅ All tables should be created successfully!

#### Option B: If you prefer the original schema
1. Remove the problematic line from `supabase/schema.sql`:
   ```sql
   -- DELETE THIS LINE:
   ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
   ```
2. Then run the modified schema in SQL Editor

### 5. **Verify Setup**
1. In the Supabase dashboard, go to **Table Editor**
2. You should see all these tables:
   - ✅ `roles` (with 3 default roles)
   - ✅ `user_profiles`
   - ✅ `drivers`
   - ✅ `vehicles`
   - ✅ `trips`
   - ✅ `payouts`
   - ✅ `incidents`
   - ✅ `assignments`
   - ✅ And 7 more tables...

### 6. **Test the Connection**
```bash
# In your project directory (E:\AK)
npm run test-supabase
```

Expected output:
```
🧪 Testing Supabase Connection...
✅ Environment variables found
✅ Basic connection successful!
📊 Testing database tables...
✅ roles: 3 records
✅ user_profiles: 0 records
✅ drivers: 0 records
... (all tables should show ✅)
```

### 7. **Test in Browser**
1. Start your development server:
   ```bash
   npm run dev
   ```
2. Visit: `http://localhost:3000/test-connection`
3. All tests should show green ✅

## 🔧 Troubleshooting

### Common Issues & Solutions

#### ❌ "Environment variables not found"
**Solution:**
- Ensure `.env.local` is in the root directory (`E:\AK\.env.local`)
- Check variable names match exactly (case-sensitive)
- Restart your development server

#### ❌ "Connection failed"
**Solution:**
- Verify your Supabase project is active (not paused)
- Check URL and key are copied correctly (no extra spaces)
- Try regenerating your anon key in Supabase dashboard

#### ❌ "Table 'xyz' doesn't exist"
**Solution:**
- Run the schema again in SQL Editor
- Check for any SQL errors in the Supabase logs
- Make sure you're using `schema-fixed.sql`

#### ❌ "Permission denied" or RLS errors
**Solution:**
- The fixed schema includes proper RLS policies
- Make sure you ran the complete schema, not just table creation
- Check that RLS is enabled on tables in Supabase dashboard

### 🔍 Verification Checklist

- [ ] Supabase project created and active
- [ ] Environment variables set correctly
- [ ] Database schema executed successfully
- [ ] All 15 tables visible in Table Editor
- [ ] 3 default roles inserted in `roles` table
- [ ] `npm run test-supabase` passes all tests
- [ ] `/test-connection` page shows all green
- [ ] Can access login page at `/login`
- [ ] Dashboard redirects to login when not authenticated

## 🎯 What's Next?

Once your database is set up:

1. **Create Test Users**: Use Supabase Auth to create test accounts
2. **Set User Roles**: Insert records in `user_profiles` table linking users to roles
3. **Add Sample Data**: Create test drivers and vehicles
4. **Test Features**: Try logging trips, managing payouts, etc.

## 🆘 Still Having Issues?

1. **Check Supabase Logs**: Dashboard → Logs → Real-time logs
2. **Browser Console**: Check for JavaScript errors
3. **Network Tab**: Look for failed API requests
4. **SQL Editor**: Test queries directly in Supabase

The system is designed to work perfectly with Supabase once the database is properly set up! 🚀
