import { supabase } from "../supabaseClient";

export const logAdminActivity = async ({
  action,
  module,
  description,
  targetId = null,
  targetType = null,
}) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("admin_activity_logs").insert({
    admin_id: user.id,
    admin_email: user.email,
    admin_name: user.user_metadata?.full_name || user.email,
    admin_role: user.user_metadata?.role || "admin",
    action,
    module,
    description,
    target_id: targetId,
    target_type: targetType,
  });
};