import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jexlbpafyiffxpwfkrur.supabase.co'; // Dán URL của bạn vào đây
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpleGxicGFmeWlmZnhwd2ZrcnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MTQzOTksImV4cCI6MjA3NzE5MDM5OX0.DAIERLf4LSGWABGGqpeplDuJH1rI7LNtV7yxWj4iamw'; // Dán anon key của bạn vào đây

export const supabase = createClient(supabaseUrl, supabaseKey);