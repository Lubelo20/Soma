import "server-only";

// Audit trail in the hosting logs (Vercel → Logs): sign-ins and every staff change, with no client details.
export const audit = (event: string, detail: Record<string, string | number | boolean> = {}) => console.info(`[audit] ${event}`, JSON.stringify(detail));
