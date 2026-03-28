import { createClient } from '@supabase/supabase-js';

// TODO: Înlocuiește aceste valori cu cele din proiectul tău Supabase
const supabaseUrl = 'https://rbcfgetprlhhgwfomjxg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiY2ZnZXRwcmxoaGd3Zm9tanhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MzQzNzEsImV4cCI6MjA5MDIxMDM3MX0.UTghw_o4wwi8M9cmBgtiaFW9rVGJMp2D5saRF8kXMlE';

export const supabase = createClient(supabaseUrl, supabaseKey);
