export const metadata = {
  title: "Community Guidelines — Eulonomys",
};

export default function GuidelinesPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold text-foreground">
        Community Guidelines
      </h1>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-base font-semibold text-foreground">Purpose</h2>
          <p className="mt-2">
            Eulonomys is a platform for creating permanent memorials. Every
            eulogy stored here becomes an immutable part of the Autonomys
            Network. Because content cannot be removed once stored, we ask all
            creators to write with care and respect.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            What belongs here
          </h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              Genuine eulogies, memorials, and tributes to people who have
              passed away
            </li>
            <li>Personal memories, reflections, and expressions of grief</li>
            <li>
              Photos of the deceased (with appropriate rights to share)
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            What does not belong here
          </h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Spam, advertisements, or promotional content</li>
            <li>Hate speech, harassment, or content targeting individuals</li>
            <li>Content that is not a genuine memorial or eulogy</li>
            <li>
              Copyrighted material you do not have the right to publish
              permanently
            </li>
            <li>
              Content about living individuals without their explicit consent
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            Moderation
          </h2>
          <p className="mt-2">
            Public eulogies are screened before appearing in the browse page.
            Content that does not meet these guidelines will be excluded from
            the browse index and search. However, because eulogies are stored
            on-chain, the content itself cannot be deleted — it remains
            accessible via its direct CID link.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            Privacy
          </h2>
          <p className="mt-2">
            You can choose to make your eulogy private (link-only). However,
            the Autonomys Network uses content-addressed storage. Anyone who
            knows the CID can access the content directly, regardless of
            visibility settings. &ldquo;Private&rdquo; means the eulogy will not
            appear in browse or search — it does not mean the content is
            encrypted or access-controlled.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            Permanence
          </h2>
          <p className="mt-2">
            Every eulogy stored on Eulonomys is permanent. Once uploaded to the
            Autonomys Distributed Storage Network, it cannot be altered or
            deleted by anyone — including us. Please be certain before you
            publish.
          </p>
        </section>
      </div>
    </div>
  );
}
