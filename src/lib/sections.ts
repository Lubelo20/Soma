/** Splits treatments into their page sections ("Massage Therapy", "Ladies' Waxing"…), keeping the order they're sorted in. */
export function bySection<T extends { section: string }>(treatments: T[]) {
  const sections = new Map<string, T[]>();
  for (const t of treatments) sections.set(t.section, [...(sections.get(t.section) ?? []), t]);
  return [...sections].map(([title, items]) => ({ title, items }));
}
