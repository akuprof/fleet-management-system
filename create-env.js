const fs = require('fs');

const envContent = `NEXT_PUBLIC_SUPABASE_URL=https://dfrsnrowdqalckbvhwyf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmcnNucm93ZHFhbGNrYnZod3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzE3MDksImV4cCI6MjA3MTUwNzcwOX0.Qy6fy3HuCsT5iQMeSgsZhsWxiIqUQqRMTV4dvudnVug`;

fs.writeFileSync('.env.local', envContent, 'utf8');
console.log('.env.local created successfully');
