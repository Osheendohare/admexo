import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SubmitInput = z.object({
  full_name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  phone: z.string().min(5).max(40),
  company: z.string().max(200).optional().nullable(),
  requirement: z.string().min(3).max(2000),
});

type Classification = {
  category: string;
  priority: "High" | "Medium" | "Low";
  summary: string;
};

async function classifyRequirement(requirement: string): Promise<Classification | null> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You classify B2B sales leads. Respond ONLY with compact JSON: {\"category\":string,\"priority\":\"High\"|\"Medium\"|\"Low\",\"summary\":string}. Category is one of: AI Automation, Web Development, Mobile App, Data & Analytics, Marketing, Consulting, Other. Summary is at most 14 words.",
          },
          { role: "user", content: `Requirement: ${requirement}` },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      console.error("[ai] classify failed", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(text) as Classification;
    if (!parsed?.category || !parsed?.priority) return null;
    return parsed;
  } catch (err) {
    console.error("[ai] classify error", err);
    return null;
  }
}

function token() {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 8);
}

function renderEmail(opts: {
  name: string;
  requirement: string;
  category: string | null;
  trackableUrl: string;
  pixelUrl: string;
}) {
  return `<!doctype html><html><body style="font-family:Inter,system-ui,sans-serif;color:#13201d;background:#f7f9f7;padding:24px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e6ecea;border-radius:14px;overflow:hidden;">
<tr><td style="padding:28px 32px 8px 32px;">
<div style="font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:14px;letter-spacing:.08em;text-transform:uppercase;color:#3a8f6e;">admexo</div>
<h1 style="font-family:'Space Grotesk',sans-serif;font-size:22px;margin:14px 0 0;">Hi ${escape(opts.name)},</h1>
</td></tr>
<tr><td style="padding:8px 32px 0;">
<p style="font-size:15px;line-height:1.6;color:#3a4a45;">Thanks for reaching out. We've received your requirement:</p>
<blockquote style="margin:14px 0;padding:14px 16px;background:#f1f7f4;border-left:3px solid #3a8f6e;border-radius:8px;font-size:15px;color:#13201d;">
"${escape(opts.requirement)}"
</blockquote>
${opts.category ? `<p style="font-size:13px;color:#3a4a45;">Routed to our <b>${escape(opts.category)}</b> team.</p>` : ""}
<p style="font-size:15px;line-height:1.6;color:#3a4a45;">A specialist will follow up shortly. In the meantime, here's a quick overview of how we work:</p>
<p style="margin:22px 0;"><a href="${opts.trackableUrl}" style="display:inline-block;background:#13201d;color:#fff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:10px;font-size:14px;">View how we work →</a></p>
<p style="font-size:13px;color:#75847f;margin-top:28px;">Regards,<br/>The admexo team</p>
</td></tr></table>
<img src="${opts.pixelUrl}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;"/>
</body></html>`;
}

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SubmitInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const classification = await classifyRequirement(data.requirement);

    const { data: lead, error: leadErr } = await supabaseAdmin
      .from("leads")
      .insert({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        company: data.company || null,
        requirement: data.requirement,
        ai_category: classification?.category ?? null,
        ai_priority: classification?.priority ?? null,
        ai_summary: classification?.summary ?? null,
      })
      .select()
      .single();
    if (leadErr || !lead) throw new Error(leadErr?.message ?? "Failed to save lead");

    const openToken = token();
    const clickToken = token();
    const targetUrl = "https://admexo.com/?ref=email";

    const baseUrl =
      process.env.PUBLIC_BASE_URL ||
      `https://project--${process.env.SUPABASE_PROJECT_ID ?? ""}.lovable.app`;
    const pixelUrl = `${baseUrl}/api/public/track/open/${openToken}`;
    const trackableUrl = `${baseUrl}/api/public/track/click/${clickToken}`;

    const subject = `Hi ${data.full_name.split(" ")[0]}, we received your requirement`;
    const bodyHtml = renderEmail({
      name: data.full_name,
      requirement: data.requirement,
      category: classification?.category ?? null,
      trackableUrl,
      pixelUrl,
    });

    const { error: sendErr } = await supabaseAdmin.from("email_sends").insert({
      lead_id: lead.id,
      open_token: openToken,
      click_token: clickToken,
      target_url: targetUrl,
      subject,
      body_html: bodyHtml,
    });
    if (sendErr) console.error("[email_send] insert error", sendErr);

    return { ok: true, leadId: lead.id, classification };
  });
