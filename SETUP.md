# Fleet Management System - Setup Guide

## 🚀 Quick Start

### 1. Supabase Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose your organization and create a project
   - Wait for the project to be ready

2. **Get Your Credentials**
   - Go to Settings > API in your Supabase dashboard
   - Copy the "Project URL" and "anon public" key

3. **Set Up Database Schema**
   - Go to SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `supabase/schema.sql`
   - Run the SQL script to create all tables and policies

### 2. Environment Configuration

1. **Create Environment File**
   ```bash
   # Copy the example file
   cp env.example .env.local
   ```

2. **Update .env.local with your credentials**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 3. Install Dependencies and Run

```bash
# Install dependencies
npm install

# Test Supabase connection
npm run test-supabase

# Start development server
npm run dev
```

## 🧪 Testing the Setup

### 1. Connection Test
```bash
npm run test-supabase
```

### 2. Browser Test
- Visit `http://localhost:3000/test-connection`
- All tests should pass green

### 3. Authentication Test
- Visit `http://localhost:3000/login`
- Try to access `http://localhost:3000/dashboard` (should redirect to login)

## 📊 System Overview

### Default User Roles
The system includes 3 user roles:
- **Admin**: Full system access
- **Manager**: Operational management 
- **Driver**: Trip logging and payout viewing

### Core Features
- ✅ Driver Management
- ✅ Vehicle Management  
- ✅ Trip Logging & Tracking
- ✅ Automated Payout System
- ✅ Incident Management
- ✅ Assignment Management
- ✅ Reports & Analytics

### Payout Formula
```
pay = min(revenue, 2250) * 0.30 + max(revenue - 2250, 0) * 0.70
```
- First ₹2,250: 30% commission
- Above ₹2,250: 70% commission

## 🔧 Troubleshooting

### Common Issues

1. **"Environment variables not found"**
   - Ensure `.env.local` exists in the root directory
   - Check that variable names match exactly
   - Restart the development server

2. **"Connection failed"**
   - Verify your Supabase project is active
   - Check URL and key are correct
   - Ensure your IP is not blocked

3. **"Table not found" errors**
   - Run the SQL schema in your Supabase dashboard
   - Check that all tables were created successfully
   - Verify Row Level Security is enabled

4. **Authentication issues**
   - Check that auth is enabled in Supabase
   - Verify email confirmation settings
   - Check user creation policies

### Getting Help

1. **Check Connection**: `npm run test-supabase`
2. **View Logs**: Check browser console and terminal
3. **Supabase Dashboard**: Monitor logs and users
4. **Test Page**: Visit `/test-connection` for detailed diagnostics

## 📱 Usage Guide

### For Admins
1. Login at `/login`
2. Access full dashboard at `/dashboard`
3. Manage drivers at `/dashboard/drivers`
4. Manage vehicles at `/dashboard/vehicles`
5. View reports at `/dashboard/reports`

### For Managers
1. Same login process
2. Access to operational features
3. Approve payouts at `/dashboard/payouts`
4. Monitor incidents at `/dashboard/incidents`

### For Drivers
1. Login with phone number as username
2. Log trips at `/dashboard/my-trips`
3. View payouts at `/dashboard/my-payouts`
4. Track daily targets and earnings

## 🚀 Production Deployment

1. **Environment Variables**
   - Set up production environment variables
   - Use strong database passwords
   - Enable SSL/HTTPS

2. **Supabase Configuration**
   - Configure custom domain
   - Set up proper CORS settings
   - Enable database backups

3. **Next.js Deployment**
   - Deploy to Vercel, Netlify, or your preferred platform
   - Ensure environment variables are set
   - Test all functionality in production

## 🎯 Success Metrics

When everything is working correctly:
- ✅ All connection tests pass
- ✅ Login/logout works smoothly
- ✅ Role-based access functions properly
- ✅ Data operations work across all modules
- ✅ Real-time updates function
- ✅ Payout calculations are accurate

Your Fleet Management System is now ready for production use! 🎉
