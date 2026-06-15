import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("PROJECT_URL")!;
    const anonKey = Deno.env.get("ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const {
      data: { user: caller },
      error: callerError,
    } = await userClient.auth.getUser();

    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: "Invalid user session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (caller.user_metadata?.role !== "superadmin") {
      return new Response(JSON.stringify({ error: "Only superadmin allowed" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { adminId } = await req.json();

    if (!adminId) {
      return new Response(JSON.stringify({ error: "Missing adminId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (adminId === caller.id) {
      return new Response(
        JSON.stringify({ error: "You cannot delete your own account" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: adminRecord, error: adminRecordError } = await adminClient
      .from("admins")
      .select("id, email, full_name, role")
      .eq("id", adminId)
      .maybeSingle();

    if (adminRecordError) {
      return new Response(JSON.stringify({ error: adminRecordError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!adminRecord) {
      return new Response(JSON.stringify({ error: "Admin record not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: authDeleteError } =
      await adminClient.auth.admin.deleteUser(adminId);

      await adminClient.from("admins").delete().eq("id", adminId);

    if (authDeleteError) {
      return new Response(JSON.stringify({ error: authDeleteError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await adminClient.from("admin_activity_logs").insert({
      admin_id: caller.id,
      admin_email: caller.email,
      admin_name: caller.user_metadata?.full_name || caller.email,
      admin_role: caller.user_metadata?.role || "superadmin",
      action: "DELETE_ADMIN",
      module: "Admin Users",
      description: `Deleted admin account ${adminRecord.email}`,
      target_id: adminRecord.id,
      target_type: "admin",
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Admin deleted from Auth and admins table",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});