import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Sparkles, BarChart3, MailCheck, MousePointerClick, ShieldCheck, CheckCircle2 } from "lucide-react";
import { submitLead } from "@/lib/leads.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "admexo — Automated Lead Management & Email Tracking" },
      { name: "description", content: "Capture leads, auto-send personalized emails, and track every open and click in real time." },
      { property: "og:title", content: "admexo — Automated Lead Management & Email Tracking" },
      { property: "og:description", content: "Capture leads, auto-send personalized emails, and track every open and click in real time." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-hero">
      <Toaster richColors position="top-center" />
      <Nav />
      <main>
        <Hero />
        <Features />
        <LeadFormSection />
        <Footer />
      </main>
    </div>
  );
}

function Nav() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <Link to="/" className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="font-display text-lg font-semibold tracking-tight">admexo</span>
      </Link>
      <nav className="flex items-center gap-1 text-sm">
        <a href="#features" className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground">Features</a>
        <a href="#contact" className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground">Get a demo</a>
        <Link to="/dashboard" className="ml-2 inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          Dashboard <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-16 pt-12 text-center md:pt-20">
      <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" /> AI-powered lead routing — live
      </div>
      <h1 className="mt-6 font-display text-5xl font-semibold tracking-tight md:text-6xl">
        Every lead, replied to in <span className="text-success">60 seconds.</span>
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
        admexo captures inbound requests, classifies them with AI, and sends a personalized email — then tracks every open and click in one dashboard.
      </p>
      <div className="mt-8 flex items-center justify-center gap-3">
        <a href="#contact">
          <Button size="lg" className="h-11 rounded-xl px-5 shadow-glow">Start capturing leads</Button>
        </a>
        <Link to="/dashboard">
          <Button size="lg" variant="outline" className="h-11 rounded-xl px-5">View dashboard</Button>
        </Link>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: Sparkles, title: "AI lead routing", desc: "Each requirement is classified into a category and priority the moment it lands." },
    { icon: MailCheck, title: "Personalized email", desc: "A tailored, on-brand reply goes out automatically — no templates to manage." },
    { icon: MousePointerClick, title: "Open & click tracking", desc: "Tracking pixels and link wrapping log every interaction in real time." },
    { icon: BarChart3, title: "Live analytics", desc: "Watch open rate, click rate, and lead volume on a single dashboard." },
  ];
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-12">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-success/15 text-success">
              <Icon className="h-4 w-4" />
            </div>
            <h3 className="mt-4 font-display text-base font-semibold">{title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function LeadFormSection() {
  return (
    <section id="contact" className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid gap-10 rounded-3xl border border-border bg-card p-8 shadow-soft md:grid-cols-2 md:p-12">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
            <ShieldCheck className="h-3.5 w-3.5" /> Your details are private
          </div>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Tell us what you need.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Submit the form and you'll get a personalized email within seconds — and we'll route your request to the right specialist.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm">
            {["AI-classified into the correct team", "Instant confirmation email", "Tracked end-to-end in our dashboard"].map((t) => (
              <li key={t} className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="h-4 w-4 text-success" /> {t}
              </li>
            ))}
          </ul>
        </div>
        <LeadForm />
      </div>
    </section>
  );
}

function LeadForm() {
  const submit = useServerFn(submitLead);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", company: "", requirement: "" });
  const [done, setDone] = useState<null | { category?: string; priority?: string }>(null);

  const mutation = useMutation({
    mutationFn: async () =>
      submit({
        data: {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          company: form.company.trim() || null,
          requirement: form.requirement.trim(),
        },
      }),
    onSuccess: (res) => {
      setDone({ category: res.classification?.category, priority: res.classification?.priority });
      toast.success("Thanks! Check your inbox for the confirmation email.");
      setForm({ full_name: "", email: "", phone: "", company: "", requirement: "" });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    },
  });

  if (done) {
    return (
      <div className="grid place-items-center rounded-2xl border border-border bg-surface p-8 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-success/20 text-success">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="mt-4 font-display text-xl font-semibold">Submission received</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">A personalized email is on its way.</p>
        {done.category && (
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="rounded-full bg-card px-2.5 py-1 font-medium">{done.category}</span>
            {done.priority && (
              <span className="rounded-full bg-success/15 px-2.5 py-1 font-medium text-success">{done.priority} priority</span>
            )}
          </div>
        )}
        <Button variant="outline" className="mt-6" onClick={() => setDone(null)}>Submit another</Button>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required>
          <Input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Rahul Sharma" />
        </Field>
        <Field label="Email" required>
          <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" />
        </Field>
        <Field label="Phone" required>
          <Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
        </Field>
        <Field label="Company" hint="optional">
          <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="ABC Pvt Ltd" />
        </Field>
      </div>
      <Field label="Requirement" required>
        <Textarea required value={form.requirement} onChange={(e) => setForm({ ...form, requirement: e.target.value })} rows={4} placeholder="Briefly describe what you're looking for…" />
      </Field>
      <Button type="submit" disabled={mutation.isPending} className="h-11 w-full rounded-xl text-base">
        {mutation.isPending ? "Submitting…" : "Submit request"}
      </Button>
    </form>
  );
}

function Field({ label, children, required, hint }: { label: string; children: React.ReactNode; required?: boolean; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span>{label}{required && <span className="ml-0.5 text-success">*</span>}</span>
        {hint && <span className="text-[10px] normal-case text-muted-foreground/70">{hint}</span>}
      </Label>
      {children}
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-sm text-muted-foreground">
        <span>© {new Date().getFullYear()} admexo</span>
        <Link to="/dashboard" className="hover:text-foreground">Open dashboard →</Link>
      </div>
    </footer>
  );
}
