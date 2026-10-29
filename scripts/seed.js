const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env or .env.local
const envPath = fs.existsSync(path.join(__dirname, '..', '.env'))
  ? path.join(__dirname, '..', '.env')
  : path.join(__dirname, '..', '.env.local');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const medicines = [
  { name: 'Amoxicillin 500mg', generic_name: 'Amoxicillin', category: 'Antibiotics' },
  { name: 'Lisinopril 10mg', generic_name: 'Lisinopril', category: 'Blood Pressure' },
  { name: 'Lantus Solostar', generic_name: 'Insulin Glargine', category: 'Diabetes' },
  { name: 'Atorvastatin 20mg', generic_name: 'Atorvastatin', category: 'Cholesterol' },
  { name: 'Albuterol Inhaler', generic_name: 'Albuterol', category: 'Asthma' }
];

async function seed() {
  console.log('Seeding medicines into the database...');
  for (const med of medicines) {
    // Check if it already exists
    const { data: existing } = await supabase
      .from('medicines')
      .select('id')
      .eq('name', med.name)
      .maybeSingle();

    if (!existing) {
      const { data, error } = await supabase
        .from('medicines')
        .insert([med])
        .select();
      if (error) {
        console.error(`Error inserting ${med.name}:`, error.message);
      } else {
        console.log(`Inserted: ${med.name}`);
      }
    } else {
      console.log(`Already exists: ${med.name}`);
    }
  }
  console.log('Seeding complete!');
}

seed();
