import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SignalIndicator } from "@/components/ui/signal-indicator";

const swatches = [
  { name: "route-blue (primary)", className: "bg-primary" },
  { name: "signal-green (success)", className: "bg-success" },
  { name: "caution-amber (warning)", className: "bg-warning" },
  { name: "alert-red (danger)", className: "bg-danger" },
];

const neutrals = [
  { step: 50, className: "bg-neutral-50" },
  { step: 100, className: "bg-neutral-100" },
  { step: 200, className: "bg-neutral-200" },
  { step: 300, className: "bg-neutral-300" },
  { step: 400, className: "bg-neutral-400" },
  { step: 500, className: "bg-neutral-500" },
  { step: 600, className: "bg-neutral-600" },
  { step: 700, className: "bg-neutral-700" },
  { step: 800, className: "bg-neutral-800" },
  { step: 900, className: "bg-neutral-900" },
];

export function DesignSystem() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-12">
      <header>
        <h1 className="text-2xl font-semibold text-ink">RoadGuard AI — Design System</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Tokens and primitives. Every page should compose from these, not
          introduce one-off styles.
        </p>
      </header>

      {/* Color tokens */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-ink">Color tokens</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {swatches.map((s) => (
            <div key={s.name} className="space-y-2">
              <div className={`h-16 rounded-md ${s.className}`} />
              <p className="text-xs text-ink-muted">{s.name}</p>
            </div>
          ))}
        </div>
        <h3 className="mb-3 mt-6 text-sm font-medium text-ink-muted">
          Neutral scale ("concrete")
        </h3>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
          {neutrals.map((n) => (
            <div key={n.step} className="space-y-1">
              <div className={`h-10 rounded-sm border border-border ${n.className}`} />
              <p className="text-center text-[11px] text-ink-muted">{n.step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-ink">Typography</h2>
        <Card>
          <CardContent className="space-y-3">
            <p className="text-2xl font-semibold text-ink">2xl / 28px — Page titles</p>
            <p className="text-xl font-semibold text-ink">xl / 22px — Section headers</p>
            <p className="text-lg font-medium text-ink">lg / 18px — Card titles</p>
            <p className="text-md text-ink">md / 15px — Emphasized body</p>
            <p className="text-base text-ink">base / 14px — Body text, table cells</p>
            <p className="text-sm text-ink-muted">sm / 13px — Secondary text, labels</p>
            <p className="text-xs text-ink-muted">xs / 12px — Captions, timestamps</p>
            <p className="font-mono text-sm text-ink">
              font-mono — Complaint IDs, GPS coords: 27.8974, 78.0880
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Buttons - all variants and states */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-ink">Buttons</h2>
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="success">Approve</Button>
            <Button variant="danger">Reject</Button>
            <Button variant="primary" loading>
              Saving
            </Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
            <Button variant="primary" size="sm">
              Small
            </Button>
            <Button variant="primary" size="lg">
              Large
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Signal indicators - the signature element */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-ink">
          Signal indicators <span className="text-sm font-normal text-ink-muted">(signature element)</span>
        </h2>
        <Card>
          <CardContent className="flex flex-wrap gap-3">
            <SignalIndicator tone="success" label="Low severity" />
            <SignalIndicator tone="warning" label="Medium severity" />
            <SignalIndicator tone="danger" label="High severity" />
            <SignalIndicator tone="info" label="Assigned" />
            <SignalIndicator tone="neutral" label="Pending" />
            <SignalIndicator tone="success" label="Approved" />
            <SignalIndicator tone="danger" label="Fraud flag" />
          </CardContent>
        </Card>
      </section>

      {/* Inputs - all states */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-ink">Inputs</h2>
        <Card>
          <CardContent className="grid max-w-md gap-3">
            <Input placeholder="Default state" />
            <Input placeholder="Focused (tab to me)" />
            <Input placeholder="Disabled" disabled />
            <Input placeholder="Error state" error defaultValue="invalid@" />
          </CardContent>
        </Card>
      </section>

      {/* Card anatomy */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-ink">Card anatomy</h2>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Complaint #RG-2041</CardTitle>
            <SignalIndicator tone="warning" label="Medium severity" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-ink-muted">
              Pothole detected near MG Road junction. Reported 2 days ago.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
