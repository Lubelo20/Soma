"use client";

import { upload } from "@vercel/blob/client";
import { useRef, useState, useTransition } from "react";
import { saveSpecial } from "../../actions";
import { Icon } from "@/components/Icon";
import { POSTER_TYPES, posterFileError } from "@/lib/poster";
import { parsePriceCents } from "@/lib/price";

export type EditableSpecial = { id: number; name: string; durationMin: number; priceCents: number | null; posterUrl: string | null };

export function SpecialEditor({ special }: { special?: EditableSpecial }) {
  const [details, setDetails] = useState({
    name: special?.name ?? "",
    price: special?.priceCents == null ? "" : String(special.priceCents / 100),
    durationMin: String(special?.durationMin ?? 60),
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pending, startSaving] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  // Keeps a finished upload, so retrying after an error doesn't upload the same file twice.
  const uploaded = useRef<{ file: File; url: string } | null>(null);

  const bind = (key: keyof typeof details) => ({
    value: details[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setDetails((d) => ({ ...d, [key]: e.target.value })),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    setError(null);
    const file = fileInput.current?.files?.[0];

    // Checked before uploading, so a mistyped price doesn't waste a large upload.
    if (!file && !special?.posterUrl) return setError("Please choose a poster image.");
    const fileProblem = file ? posterFileError(file) : null;
    if (fileProblem) return setError(fileProblem);
    const price = parsePriceCents(details.price);
    if (!price.ok || price.cents === null) return setError("Enter the package price from the poster, e.g. 1489 or 1462,50.");

    startSaving(async () => {
      let posterUrl = special?.posterUrl ?? "";
      if (file) {
        if (uploaded.current?.file === file) {
          posterUrl = uploaded.current.url;
        } else {
          setUploading(true);
          try {
            const blob = await upload(`posters/${file.name}`, file, { access: "public", handleUploadUrl: "/dashboard/specials/upload" });
            posterUrl = blob.url;
            uploaded.current = { file, url: blob.url };
          } catch (err) {
            console.error("[specials] upload failed", err);
            setError("The poster didn't upload. Please check your connection and try again.");
            return;
          } finally {
            setUploading(false);
          }
        }
      }

      const fd = new FormData();
      if (special) fd.set("id", String(special.id));
      fd.set("name", details.name);
      fd.set("price", details.price);
      fd.set("durationMin", details.durationMin);
      fd.set("posterUrl", posterUrl);
      const result = await saveSpecial({}, fd);
      if (result.error) return setError(result.error);

      uploaded.current = null;
      if (fileInput.current) fileInput.current.value = "";
      if (!special) setDetails({ name: "", price: "", durationMin: "60" });
      setSaved(true);
    });
  }

  return (
    <form onSubmit={submit} noValidate className="grid grid-cols-2 gap-4">
      <p className="col-span-2 m-0 text-sm leading-relaxed text-ink-muted">
        Specials are packages. Clients book the first session here and you arrange the rest. Enter the full package price shown on the poster.
      </p>
      <label className="label col-span-2">
        <span>
          Poster image <span className="hint">(JPG or PNG, up to 10 MB{special ? "; leave empty to keep the current poster" : ""})</span>
        </span>
        <input ref={fileInput} name="poster" type="file" accept={POSTER_TYPES.join(",")} className="field py-2" />
      </label>
      <label className="label col-span-2">
        Name of the special
        <input name="name" {...bind("name")} maxLength={120} required className="field" />
      </label>
      <label className="label">
        Package price (R)
        <input name="price" {...bind("price")} inputMode="decimal" required className="field" />
      </label>
      <label className="label">
        First session (minutes)
        <input name="durationMin" {...bind("durationMin")} type="number" min={10} max={480} step={5} required className="field" />
      </label>
      <div className="col-span-2 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className="btn btn-solid min-h-10 px-5">
          {uploading ? "Uploading poster…" : pending ? "Saving…" : special ? "Save" : "Add special"}
        </button>
        {error && <span className="text-sm font-medium text-red-700">{error}</span>}
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand">
            <Icon name="check" size={16} strokeWidth={2} />
            {special ? "Saved" : "Added. Switch it on below when you're ready."}
          </span>
        )}
      </div>
    </form>
  );
}
