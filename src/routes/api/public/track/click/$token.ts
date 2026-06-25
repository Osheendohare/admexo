import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/track/click/$token")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        let target = "https://admexo.com";
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: send } = await supabaseAdmin
            .from("email_sends")
            .select("id, target_url")
            .eq("click_token", params.token)
            .maybeSingle();
          if (send) {
            target = send.target_url;
            await supabaseAdmin.from("email_events").insert({
              email_send_id: send.id,
              event_type: "click",
              user_agent: request.headers.get("user-agent") ?? null,
            });
          }
        } catch (err) {
          console.error("[track click]", err);
        }
        return new Response(null, { status: 302, headers: { Location: target } });
      },
    },
  },
});
