// Simple Supabase connection test
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase Connection...\n')

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Environment variables not found!')
    console.log('Please ensure you have:')
    console.log('- NEXT_PUBLIC_SUPABASE_URL in your .env.local file')
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file')
    return
  }

  console.log('✅ Environment variables found')
  console.log(`📍 Supabase URL: ${supabaseUrl.substring(0, 30)}...`)
  console.log(`🔑 Anon Key: ${supabaseKey.substring(0, 30)}...\n`)

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Test basic connection
    console.log('🔍 Testing basic connection...')
    const { data, error } = await supabase.from('roles').select('count').limit(1)
    
    if (error) {
      throw error
    }
    
    console.log('✅ Basic connection successful!\n')

    // Test each table
    const tables = ['roles', 'user_profiles', 'drivers', 'vehicles', 'trips', 'payouts', 'incidents', 'assignments']
    
    console.log('📊 Testing database tables...')
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`)
        } else {
          console.log(`✅ ${table}: ${count || 0} records`)
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`)
      }
    }

    console.log('\n🎉 Supabase connection test completed!')
    console.log('\n📝 Next steps:')
    console.log('1. If any tables failed, run the SQL schema in your Supabase dashboard')
    console.log('2. Visit /test-connection in your browser for detailed tests')
    console.log('3. Start using the Fleet Management System!')

  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('1. Check your Supabase project is active')
    console.log('2. Verify your URL and key are correct')
    console.log('3. Ensure your database has the required tables')
  }
}

testSupabaseConnection()
