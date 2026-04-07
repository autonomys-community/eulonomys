import { ModerationQueue } from "@/components/ModerationQueue";

export const metadata = {
  title: "Moderation — Eulonomys Admin",
};

export default function ModerationPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-bold text-foreground">Moderation Queue</h1>
      <p className="mt-2 text-sm text-muted">
        Review flagged eulogies before they appear in the public browse page.
      </p>
      <div className="mt-8">
        <ModerationQueue />
      </div>
    </div>
  );
}
