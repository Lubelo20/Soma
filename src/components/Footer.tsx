import Image from "next/image";
import Link from "next/link";
import { business, navLinks } from "@/lib/site";

async function CopyrightYear() {
  "use cache";
  return new Date().getFullYear();
}

export function Footer() {
  return (
    <footer className="bg-forest-deep pt-14 pb-8 text-mint-line">
      <div className="wrap flex flex-col gap-8">
        <div className="flex flex-wrap justify-between gap-8">
          <div className="flex max-w-[360px] flex-col gap-3">
            <div className="flex items-center gap-3">
              <Image src="/images/logo.png" alt="" width={35} height={36} className="h-9 w-auto" />
              <span className="text-base font-bold tracking-[.06em] text-white">INFINITY SOMA WELLNESS CLINIC</span>
            </div>
            <p className="m-0 text-sm leading-[1.6]">Integrated wellness, aesthetics and skills development in Durban.</p>
            <p className="m-0 text-sm leading-[1.6]">
              {business.address.lines.join(", ")}
              <br />
              <a href={`tel:${business.phoneE164}`} className="text-mint-line hover:text-white">
                {business.phoneDisplay}
              </a>{" "}
              ·{" "}
              <a href={`mailto:${business.email}`} className="text-mint-line hover:text-white">
                {business.email}
              </a>
            </p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 content-start gap-x-10 gap-y-2.5 text-sm">
            {[...navLinks, { href: "/book", label: "Book online" }].map((l) => (
              <Link key={l.href} href={l.href} className="text-mint-line no-underline hover:text-white">
                {l.label}
              </Link>
            ))}
            <a href={business.instagram} target="_blank" rel="noopener noreferrer" className="text-mint-line no-underline hover:text-white">
              Instagram
            </a>
          </nav>
        </div>
        <div className="flex flex-wrap justify-between gap-4 border-t border-[#1e3a2b] pt-5 text-[12.5px] text-[#9fb8a7]">
          <span>
            © <CopyrightYear /> {business.legalName} · Reg. {business.registration}
          </span>
          <span>
            QCTO SDP {business.qcto} · HWSETA {business.hwseta}
          </span>
        </div>
      </div>
    </footer>
  );
}
