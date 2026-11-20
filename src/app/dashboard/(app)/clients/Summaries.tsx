import { HEALTH_CONDITIONS, SKIN_ROWS, areaLabels } from "@/lib/record-card";
import { SIGNATURE_VIEWBOX, isValidSignaturePath } from "@/lib/signature";
import { formatDate } from "@/lib/slots";

// Read-only summaries of a record card, shared by the card page, the history page and the consent viewer.
// Answers come from jsonb, so every reader here tolerates a missing or unexpected shape.

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown) => (typeof v === "string" ? v : "");
const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

const DETAIL_FIELDS: readonly [string, string][] = [
  ["fullName", "Name"],
  ["phone", "Phone"],
  ["email", "Email"],
  ["idNumber", "ID number"],
  ["dateOfBirth", "Date of birth"],
  ["gender", "Gender"],
  ["address", "Address"],
  ["emergencyContact", "Emergency contact"],
  ["occupation", "Occupation"],
  ["initialAppointment", "Initial appointment"],
  ["clientType", "Client"],
];

const DATE_FORMAT: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
const isDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

function detailValue(key: string, raw: unknown): string {
  const v = str(raw);
  if (key === "clientType") return v === "first" ? "First time" : v === "returning" ? "Returning" : "";
  if ((key === "dateOfBirth" || key === "initialAppointment") && isDay(v)) return formatDate(v, DATE_FORMAT);
  return v;
}

function Grid({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[15px]">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-ink-subtle">{label}</dt>
          <dd className="m-0 break-words whitespace-pre-line text-ink-body">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

const Empty = ({ children }: { children: React.ReactNode }) => <p className="m-0 text-sm text-ink-muted">{children}</p>;

export function DetailsSummary({ details }: { details: unknown }) {
  if (!isObj(details)) return <Empty>Details unavailable</Empty>;
  const rows = DETAIL_FIELDS.map(([key, label]): [string, string] => [label, detailValue(key, details[key])]).filter(([, v]) => v !== "");
  return rows.length === 0 ? <Empty>Details unavailable</Empty> : <Grid rows={rows} />;
}

export function HealthSummary({ answers }: { answers: unknown }) {
  if (!isObj(answers)) return <Empty>Not filled in</Empty>;
  const entry = (key: string) => (isObj(answers[key]) ? answers[key] : {});
  const by = (a: "yes" | "no" | null) =>
    HEALTH_CONDITIONS.filter((c) => (a === null ? entry(c.key).answer !== "yes" && entry(c.key).answer !== "no" : entry(c.key).answer === a));
  const yes = by("yes");
  const no = by("no");
  const open = by(null);
  return (
    <div className="flex flex-col gap-3 text-[15px]">
      {yes.length === 0 ? (
        <Empty>No conditions answered Yes.</Empty>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {yes.map((c) => {
            const note = str(entry(c.key).note);
            return (
              <li key={c.key} className="text-ink-strong">
                <span className="font-semibold">{c.label}</span>: Yes
                {note && <span className="text-ink-body"> ({c.noteLabel ? `${c.noteLabel}: ` : ""}{note})</span>}
              </li>
            );
          })}
        </ul>
      )}
      {no.length > 0 && <p className="m-0 text-ink-muted">No: {no.map((c) => c.label).join(", ")}</p>}
      {open.length > 0 && <p className="m-0 text-ink-muted">Not answered: {open.map((c) => c.label).join(", ")}</p>}
    </div>
  );
}

export function MassageSummary({ answers }: { answers: unknown }) {
  if (!isObj(answers)) return <Empty>Not filled in</Empty>;
  const areas = strings(answers.areas);
  const notes = str(answers.notes);
  if (areas.length === 0 && !notes) return <Empty>Nothing marked.</Empty>;
  return (
    <Grid
      rows={[
        ...(areas.length > 0 ? ([["Areas", areaLabels(areas)]] as [string, string][]) : []),
        ...(notes ? ([["Notes", notes]] as [string, string][]) : []),
      ]}
    />
  );
}

export function SkinSummary({ answers }: { answers: unknown }) {
  if (!isObj(answers)) return <Empty>Not filled in</Empty>;
  const rows: [string, string][] = [];
  for (const row of SKIN_ROWS) {
    const e = isObj(answers[row.key]) ? answers[row.key] : {};
    const selected = strings((e as Obj).selected);
    const other = str((e as Obj).other);
    // "Other" is shown once, with its text, when there is some.
    const parts = row.options.filter((o) => selected.includes(o.value) && !(o.value === "other" && other)).map((o) => o.label);
    const note = str((e as Obj).note);
    if (other) parts.push(`Other: ${other}`);
    if (note) parts.push(`${row.noteLabel ?? "Note"}: ${note}`);
    if (parts.length > 0) rows.push([row.label, parts.join("; ")]);
  }
  return rows.length === 0 ? <Empty>Nothing selected.</Empty> : <Grid rows={rows} />;
}

/** A stored signature, drawn only if it passes the path check. */
export function SignatureView({ path }: { path: string }) {
  if (!isValidSignaturePath(path)) return <p className="m-0 text-sm text-ink-muted">Signature unavailable</p>;
  return (
    <svg
      viewBox={`0 0 ${SIGNATURE_VIEWBOX.width} ${SIGNATURE_VIEWBOX.height}`}
      role="img"
      aria-label="Client signature"
      className="h-auto w-full max-w-md rounded-[3px] border border-line bg-white"
    >
      <path d={path} fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const SubHeading = ({ children }: { children: React.ReactNode }) => (
  <h4 className="m-0 mb-2 text-[11.5px] font-medium tracking-[.16em] text-ink-subtle uppercase">{children}</h4>
);

/** The card as it was when signed. The shape is unknown, so an unexpected one shows a plain message. */
export function SnapshotView({ snapshot }: { snapshot: unknown }) {
  if (!isObj(snapshot)) return <Empty>Snapshot unavailable</Empty>;
  const { details, health, massage, skin } = snapshot;
  if (!isObj(details) && !isObj(health) && !isObj(massage) && !isObj(skin)) return <Empty>Snapshot unavailable</Empty>;
  return (
    <div className="flex flex-col gap-4">
      {isObj(details) && (
        <div>
          <SubHeading>Details</SubHeading>
          <DetailsSummary details={details} />
        </div>
      )}
      {isObj(health) && (
        <div>
          <SubHeading>Health</SubHeading>
          <HealthSummary answers={health} />
        </div>
      )}
      {isObj(massage) && (
        <div>
          <SubHeading>Massage</SubHeading>
          <MassageSummary answers={massage} />
        </div>
      )}
      {isObj(skin) && (
        <div>
          <SubHeading>Skin</SubHeading>
          <SkinSummary answers={skin} />
        </div>
      )}
    </div>
  );
}
