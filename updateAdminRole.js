import { createClient } from "@supabase/supabase-js";

// Use your SERVICE ROLE key here, NOT anon key
const SUPABASE_URL = "https://rspwglpkbwitntcnoxcr.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzcHdnbHBrYndpdG50Y25veGNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTgwMDk2MiwiZXhwIjoyMDc1Mzc2OTYyfQ.hpeKRb9VMEEYXVSr4qa_UsMxKYItYB2eQEDWuR1uyjw";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const updateRole = async () => {
  const USER_ID = "4d2e0cc8-4509-4fb1-8808-d19e7862188c"; // find it in Supabase Dashboard -> Users -> ID
  const { data, error } = await supabase.auth.admin.updateUserById(USER_ID, {
    user_metadata: { role: "superadmin" },
  });

  if (error) console.error("Error updating role:", error);
  else console.log("Updated user metadata:", data);
};

updateRole();
