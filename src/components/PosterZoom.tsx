"use client";

import Image, { type ImageProps } from "next/image";
import { useRef, useState } from "react";
import { Icon } from "./Icon";

/** If image optimisation fails or times out, loads the stored file directly rather than leaving a blank poster. */
function PosterImage({ alt, ...props }: ImageProps) {
  const [direct, setDirect] = useState(false);
  return <Image alt={alt} {...props} unoptimized={direct} onError={() => setDirect(true)} />;
}

/** A whole, uncropped poster. Tapping it opens it full width, so the small print can be read. */
export function PosterZoom({ src, alt, sizes, eager = false }: { src: string; alt: string; sizes: string; eager?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} aria-label={`Enlarge poster: ${alt}`} className="relative block size-full cursor-zoom-in border-none bg-transparent p-0">
        <PosterImage src={src} alt={alt} fill sizes={sizes} loading={eager ? "eager" : "lazy"} className="object-contain" />
      </button>
      <dialog
        ref={dialog}
        aria-label={alt}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
        className="m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto bg-black/90 p-0 open:block"
      >
        <form method="dialog" className="sticky top-0 z-10 flex justify-end p-2">
          <button type="submit" aria-label="Close enlarged poster" className="flex size-11 cursor-pointer items-center justify-center rounded-full border-none bg-white text-ink">
            <Icon name="close" size={20} strokeWidth={1.6} />
          </button>
        </form>
        <div className="mx-auto w-full max-w-3xl pb-6">
          <PosterImage src={src} alt="" width={1200} height={1700} sizes="(max-width: 768px) 100vw, 768px" className="h-auto w-full" />
        </div>
      </dialog>
    </>
  );
}
