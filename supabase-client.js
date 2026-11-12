import { createClient } from
  'https://esm.sh/@supabase/supabase-js@2';
// Replace with your Supabase Project URL
const SUPABASE_URL = 'https://xkbnvmdrdgwfhkxcovsg.supabase.co';

// Replace with your Publishable Key
const SUPABASE_KEY = 'sb_publishable_rTO3vhAmk6XncRlw6m6SGw_5JfKQRJL';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);