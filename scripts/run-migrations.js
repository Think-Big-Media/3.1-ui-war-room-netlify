#!/usr/bin/env node

/**
 * Run Supabase Migrations Script
 * This script runs the database migrations using Supabase service role key
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = '../src/frontend/.env.local';
try {
  require('dotenv').config({ path: path.join(__dirname, envPath) });
} catch (e) {
  // Manual loading if dotenv not available
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

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

console.log('🚀 Running Supabase Migrations...');
console.log('📍 URL:', supabaseUrl);

// Note: For running DDL statements (CREATE TABLE, etc.), we need service role key
// Since we don't have it, we'll need to use Supabase Dashboard or CLI
console.log('\n⚠️  Important: Database migrations require service role access.');
console.log('\nTo run migrations, you have two options:');
console.log('\n1. Use Supabase Dashboard:');
console.log('   - Go to: https://supabase.com/dashboard/project/ksnrafwskxaxhaczvwjs/editor');
console.log('   - Navigate to SQL Editor');
console.log('   - Copy and paste the migration SQL from:');
console.log('     /1.0-war-room/supabase/migrations/001_initial_schema.sql');
console.log('   - Click "Run"');
console.log('\n2. Get service role key:');
console.log('   - Go to: https://supabase.com/dashboard/project/ksnrafwskxaxhaczvwjs/settings/api');
console.log('   - Copy the service role key (keep it secret!)');
console.log('   - Add to .env.local as SUPABASE_SERVICE_ROLE_KEY');
console.log('   - Re-run this script');

// If service role key is available, uncomment below:
/*
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (serviceRoleKey) {
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const migrationSql = fs.readFileSync(
    path.join(__dirname, '../supabase/migrations/001_initial_schema.sql'), 
    'utf8'
  );

  async function runMigration() {
    try {
      const { data, error } = await supabaseAdmin.rpc('exec_sql', {
        sql: migrationSql
      });

      if (error) {
        console.error('❌ Migration failed:', error);
        return false;
      }

      console.log('✅ Migrations completed successfully!');
      return true;
    } catch (error) {
      console.error('❌ Error running migrations:', error);
      return false;
    }
  }

  runMigration().then(success => {
    process.exit(success ? 0 : 1);
  });
} else {
  console.log('\n❌ Service role key not found. Please follow the instructions above.');
  process.exit(1);
}
*/

console.log('\n📋 Migration file location:');
console.log(path.join(__dirname, '../supabase/migrations/001_initial_schema.sql'));