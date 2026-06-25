import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Inbox, MailOpen, MousePointerClick, Send, Sparkles, AlertCircle, Eye } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — admexo" },
      { name: "description", content: "Live lead and email engagement analytics." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

type Lead = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  company: string | null;
  requirement: string;
  ai_category: string | null;
  ai_priority: string | null;
  ai_summary: string | null;
  created_at: string;
};

type DashboardData = {
  leads: Lead[];
  sentCount: number;
  openCount: number;
  clickCount: number;
};

const dashboardQuery = queryOptions({
  queryKey: ["dashboard"],
  queryFn: async (): Promise<DashboardData> => {
    const [leadsRes, sentRes, eventsRes] = await Promise.all([
      supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("email_sends").select("id", { count: "exact", head: true }),
      supabase.from("email_events").select("email_send_id, event_type"),
    ]);
    if (leadsRes.error) throw leadsRes.error;

    const events = eventsRes.data ?? [];
    const opensBySend = new Set<string>();
    const clicksBySend = new Set<string>();
    for (const e of events) {
      if (e.event_type === "open") opensBySend.add(e.email_send_id);
      if (e.event_type === "click") clicksBySend.add(e.email_send_id);
    }
    return {
      leads: (leadsRes.data ?? []) as Lead[],
      sentCount: sentRes.count ?? 0,
      openCount: opensBySend.size,
      clickCount: clicksBySend.size,
    };
  },
  refetchInterval: 5000,
});

function DashboardPage() {
  const { data, isLoading, error } = useQuery(dashboardQuery);

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Home
            </Link>
            <span className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <span className="font-display text-base font-semibold tracking-tight">admexo · dashboard</span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">Auto-refreshes every 5s</span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {error ? (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" /> Failed to load: {(error as Error).message}
          </div>
        ) : null}

        <Stats data={data} loading={isLoading} />
        <LeadsTable leads={data?.leads ?? []} loading={isLoading} />
      </main>
    </div>
  );
}

function Stats({ data, loading }: { data?: DashboardData; loading: boolean }) {
  const leads = data?.leads.length ?? 0;
  const sent = data?.sentCount ?? 0;
  const opens = data?.openCount ?? 0;
  const clicks = data?.clickCount ?? 0;
  const openRate = sent ? Math.round((opens / sent) * 100) : 0;
  const clickRate = sent ? Math.round((clicks / sent) * 100) : 0;

  const cards = [
    { icon: Inbox, label: "Total leads", value: leads },
    { icon: Send, label: "Emails sent", value: sent },
    { icon: MailOpen, label: "Emails opened", value: opens, rate: `${openRate}% open rate` },
    { icon: MousePointerClick, label: "Links clicked", value: clicks, rate: `${clickRate}% click rate` },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ icon: Icon, label, value, rate }) => (
        <div key={label} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-3 font-display text-3xl font-semibold tabular-nums">
            {loading ? <span className="text-muted-foreground/40">—</span> : value.toLocaleString()}
          </div>
          {rate && <div className="mt-1 text-xs text-success">{rate}</div>}
        </div>
      ))}
    </div>
  );
}

function LeadsTable({ leads, loading }: { leads: Lead[]; loading: boolean }) {
  const [preview, setPreview] = useState<Lead | null>(null);
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="font-display text-base font-semibold">Recent leads</h2>
        <span className="text-xs text-muted-foreground">{leads.length} shown</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Lead</th>
              <th className="px-5 py-3">Requirement</th>
              <th className="px-5 py-3">AI category</th>
              <th className="px-5 py-3">Priority</th>
              <th className="px-5 py-3">Submitted</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {!loading && leads.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">No leads yet. Submit the form on the homepage to see one appear.</td></tr>
            )}
            {leads.map((l) => (
              <tr key={l.id} className="border-t border-border/60 align-top hover:bg-surface/60">
                <td className="px-5 py-4">
                  <div className="font-medium text-foreground">{l.full_name}</div>
                  <div className="text-xs text-muted-foreground">{l.email}</div>
                  <div className="text-xs text-muted-foreground">{l.phone}{l.company ? ` · ${l.company}` : ""}</div>
                </td>
                <td className="px-5 py-4 max-w-md">
                  <div className="line-clamp-2 text-foreground">{l.requirement}</div>
                  {l.ai_summary && <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">AI: {l.ai_summary}</div>}
                </td>
                <td className="px-5 py-4">
                  {l.ai_category ? (
                    <span className="inline-flex rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">{l.ai_category}</span>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </td>
                <td className="px-5 py-4">
                  {l.ai_priority ? <PriorityBadge value={l.ai_priority} /> : <span className="text-xs text-muted-foreground">—</span>}
                </td>
                <td className="px-5 py-4 text-xs text-muted-foreground">
                  {new Date(l.created_at).toLocaleString()}
                </td>
                <td className="px-5 py-4">
                  <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => setPreview(l)}>
                    <Eye className="h-3.5 w-3.5" /> Email
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <EmailPreview lead={preview} onClose={() => setPreview(null)} />
    </div>
  );
}

function EmailPreview({ lead, onClose }: { lead: Lead | null; onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ["email-send", lead?.id],
    enabled: !!lead,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_sends")
        .select("subject, body_html, open_token, click_token")
        .eq("lead_id", lead!.id)
        .order("sent_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <Sheet open={!!lead} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="font-display">{data?.subject ?? "Email preview"}</SheetTitle>
          <SheetDescription>
            Open the preview in a new tab to register an open event. Click the in-email link to register a click.
          </SheetDescription>
        </SheetHeader>
        {data ? (
          <div className="mt-4 space-y-3">
            <iframe
              title="email preview"
              srcDoc={data.body_html}
              className="h-[520px] w-full rounded-xl border border-border bg-white"
            />
            <div className="text-xs text-muted-foreground">
              Tip: open this email in a real browser tab to fire the tracking pixel, then click the CTA inside it to test click tracking.
            </div>
          </div>
        ) : (
          <div className="mt-6 text-sm text-muted-foreground">Loading…</div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function PriorityBadge({ value }: { value: string }) {
  const tone =
    value === "High" ? "bg-destructive/10 text-destructive"
    : value === "Medium" ? "bg-warning/15 text-warning-foreground"
    : "bg-muted text-muted-foreground";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{value}</span>;
}

