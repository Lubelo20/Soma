import Image from "next/image";
import { Suspense } from "react";
import { IdleLock } from "../IdleLock";

// The signing screen is handed to the client, so it has no dashboard menu and no links of its own: only the
// logo and the page. It sits outside the (app) group on purpose.
export default function SignLayout({ children }: LayoutProps<"/dashboard/sign">) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-6 px-4 pt-6 pb-10 sm:pt-10">
      <Image src="/images/logo.png" alt="Infinity Soma" width={31} height={32} className="h-8 w-auto self-center" />
      <Suspense fallback={<p className="text-ink-subtle">Loading…</p>}>{children}</Suspense>
      <IdleLock />
    </div>
  );
}
