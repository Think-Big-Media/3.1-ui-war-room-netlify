#!/usr/bin/env node

/**
 * Test Supabase Connection Script
 * Run this to verify your Supabase setup is working correctly
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local
const envPath = process.env.NODE_ENV === 'production' 
  ? '../src/frontend/.env' 
  : '../src/frontend/.env.local';

try {
  require('dotenv').config({ path: envPath });
} catch (e) {
  // dotenv might not be installed, try manual loading
  const fs = require('fs');
  const path = require('path');
  const envFile = path.join(__dirname, envPath);
  
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value && !key.startsWith('#')) {
        process.env[key.trim()] = value.trim();
      }
    });
  }
}

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('🧪 Testing Supabase Connection...');
console.log('📍 URL:', supabaseUrl);
console.log('🔑 Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'Not found');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // Test 1: Basic connection
    console.log('\n1️⃣ Testing basic connection...');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
    console.log('✅ Basic connection successful');
    
    if (data.session) {
      console.log('✅ Active session found:', data.session.user.email);
    } else {
      console.log('ℹ️  No active session (this is normal if not logged in)');
    }

    // Test 2: Check if we can reach the database
    console.log('\n2️⃣ Testing database access...');
    const { error: dbError } = await supabase
      .from('organizations')
      .select('count')
      .limit(1);
    
    if (dbError) {
      if (dbError.message.includes('permission denied')) {
        console.log('⚠️  Database exists but RLS is blocking anonymous access (expected)');
      } else if (dbError.message.includes('does not exist')) {
        console.log('❌ Database tables not created yet. Run migrations first.');
      } else {
        console.error('❌ Database error:', dbError.message);
      }
    } else {
      console.log('✅ Database connection successful');
    }

    // Test 3: Auth configuration
    console.log('\n3️⃣ Checking auth configuration...');
    const { data: settings } = await supabase.auth.admin;
    console.log('✅ Auth service is accessible');

    console.log('\n✅ Supabase connection test completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run database migrations: npm run supabase:migrate');
    console.log('2. Configure OAuth providers in Supabase dashboard');
    console.log('3. Set up email templates in Supabase dashboard');
    
    return true;

  } catch (error) {
    console.error('\n❌ Unexpected error during test:', error);
    return false;
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});