import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s | Infinity Soma Dashboard" },
  robots: { index: false, follow: false },
};

export default function DashboardRootLayout({ children }: LayoutProps<"/dashboard">) {
  return <div className="min-h-screen bg-cream">{children}</div>;
}
