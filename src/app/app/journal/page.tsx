import { SectionHeading, InlineNotice } from "@/components/moriva/status";
import { JournalClient } from "@/components/moriva/journal-client";

export const metadata = { title: "Journal" };

export default function JournalPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <SectionHeading title="Private journal" description="Optional notes that belong to you alone." level={1} />
      <InlineNotice kind="info" title="Never analysed, never shared automatically" className="mb-4">
        Journal entries are only visible to you. They are never scored, never sent to a provider, and never used for
        analytics. Deleting an entry removes it from your journal.
      </InlineNotice>
      <JournalClient />
    </div>
  );
}
