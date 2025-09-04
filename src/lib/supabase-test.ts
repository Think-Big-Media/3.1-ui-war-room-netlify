/**
 * Supabase Connection Test
 * Run this to verify your Supabase setup is working correctly
 */

import { supabase } from './supabase';

export async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase Connection...');
  console.log('📍 URL:', import.meta.env.VITE_SUPABASE_URL);

  try {
    // Test 1: Basic connection
    console.log('\n1️⃣ Testing basic connection...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('organizations')
      .select('count')
      .limit(1);

    if (healthError) {
      console.error('❌ Connection failed:', healthError.message);
      return false;
    }
    console.log('✅ Basic connection successful');

    // Test 2: Auth status
    console.log('\n2️⃣ Checking auth status...');
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('❌ Auth check failed:', sessionError.message);
    } else if (session) {
      console.log('✅ Active session found:', session.user.email);
    } else {
      console.log('ℹ️  No active session (this is normal if not logged in)');
    }

    // Test 3: Test anonymous access
    console.log('\n3️⃣ Testing anonymous access...');
    const { count, error: countError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('is_public', true);

    if (countError) {
      console.log('⚠️  Cannot access public events (RLS might be blocking):', countError.message);
    } else {
      console.log(`✅ Can see ${count || 0} public events`);
    }

    // Test 4: Storage buckets
    console.log('\n4️⃣ Checking storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.log('⚠️  Cannot list buckets:', bucketsError.message);
    } else {
      console.log(
        '✅ Storage buckets available:',
        buckets?.map((b) => b.name).join(', ') || 'none'
      );
    }

    console.log('\n✅ Supabase connection test completed successfully!');
    return true;
  } catch (error) {
    console.error('\n❌ Unexpected error during test:', error);
    return false;
  }
}

// Run test if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  (window as any).testSupabase = testSupabaseConnection;
  console.log('💡 Run testSupabase() in the console to test your connection');
} else {
  // Node environment
  testSupabaseConnection();
}
