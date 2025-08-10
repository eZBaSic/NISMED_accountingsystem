import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const users = [
  'ragutierrez@up.edu.ph',
  'jgmejilla@up.edu.ph', 
  'mtsasing@up.edu.ph'
];

const password = 'Agham@Matematika!';

async function createUsers() {
  console.log('🚀 Creating users in Supabase...\n');
  
  for (const email of users) {
    try {
      console.log(`📧 Creating user: ${email}`);
      
      // Try to sign up the user
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation redirect
          data: {
            email_confirm: true // Skip email confirmation
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          console.log(`⚠️  User ${email} already exists`);
        } else {
          console.error(`❌ Error creating ${email}:`, error.message);
        }
      } else if (data.user) {
        console.log(`✅ Successfully created user: ${email}`);
        console.log(`   User ID: ${data.user.id}`);
        
        // If the user needs email confirmation, log that
        if (!data.user.email_confirmed_at) {
          console.log(`   ⚠️  Email confirmation may be required`);
        }
      }
    } catch (error) {
      console.error(`❌ Exception creating ${email}:`, error.message);
    }
    
    // Small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎉 User creation process completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Check Supabase Dashboard > Authentication > Users');
  console.log('2. If email confirmation is required, disable it in:');
  console.log('   Dashboard > Authentication > Settings > "Enable email confirmations"');
  console.log('3. Test login with any of the created users');
}

createUsers().catch(console.error);
