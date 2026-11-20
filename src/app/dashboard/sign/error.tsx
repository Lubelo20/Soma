"use client";

// The signing screen is in the client's hands, so a failure shows only a neutral message: no clinic details, no links.
export default function SignError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="card flex flex-col items-start gap-4">
      <p className="m-0 text-[17px] leading-relaxed text-ink-strong">Something went wrong. Please hand the phone back to your therapist.</p>
      <button type="button" onClick={() => retry()} className="btn btn-solid min-h-12 px-6 max-sm:w-full">
        Try again
      </button>
    </div>
  );
}
