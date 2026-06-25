import { createFileRoute } from "@tanstack/react-router";

// 1x1 transparent GIF
const PIXEL = Uint8Array.from([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff,
  0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
  0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
]);

export const Route = createFileRoute("/api/public/track/open/$token")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: send } = await supabaseAdmin
            .from("email_sends")
            .select("id")
            .eq("open_token", params.token)
            .maybeSingle();
          if (send) {
            await supabaseAdmin.from("email_events").insert({
              email_send_id: send.id,
              event_type: "open",
              user_agent: request.headers.get("user-agent") ?? null,
            });
          }
        } catch (err) {
          console.error("[track open]", err);
        }
        return new Response(PIXEL, {
          status: 200,
          headers: {
            "Content-Type": "image/gif",
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            Pragma: "no-cache",
          },
        });
      },
    },
  },
});
