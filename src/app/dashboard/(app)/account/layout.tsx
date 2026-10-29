import type { Metadata } from "next";

// The account page is a client component, so its title is set here.
export const metadata: Metadata = { title: "Password" };

export default function AccountLayout({ children }: LayoutProps<"/dashboard/account">) {
  return children;
}
