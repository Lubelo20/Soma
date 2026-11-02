import { describe, expect, it } from "vitest";
import { POSTER_MAX_EDGE, fitWithin, isBlobUrl, posterFileError } from "./poster";

describe("fitWithin", () => {
  it("leaves posters within the limit alone", () => {
    expect(fitWithin(1284, 1925)).toEqual({ width: 1284, height: 1925 });
    expect(fitWithin(POSTER_MAX_EDGE, 100)).toEqual({ width: POSTER_MAX_EDGE, height: 100 });
  });

  it("shrinks a tall poster to the limit, keeping its shape", () => {
    expect(fitWithin(2123, 4600)).toEqual({ width: 1015, height: POSTER_MAX_EDGE });
  });

  it("shrinks a wide poster to the limit, keeping its shape", () => {
    expect(fitWithin(4400, 2200)).toEqual({ width: POSTER_MAX_EDGE, height: 1100 });
  });
});

const MB = 1024 * 1024;

describe("posterFileError", () => {
  it("accepts JPG and PNG up to 10 MB, including phone PNGs over Vercel's 4.5 MB request limit", () => {
    expect(posterFileError({ type: "image/png", size: 6 * MB })).toBeNull();
    expect(posterFileError({ type: "image/jpeg", size: 10 * MB })).toBeNull();
  });

  it("rejects files over 10 MB", () => {
    expect(posterFileError({ type: "image/png", size: 10 * MB + 1 })).toMatch(/10 MB/);
  });

  it.each(["image/heic", "application/pdf", ""])("rejects type %j", (type) => {
    expect(posterFileError({ type, size: MB })).toMatch(/JPG or PNG/);
  });
});

describe("isBlobUrl", () => {
  it("accepts https Vercel Blob URLs", () => {
    expect(isBlobUrl("https://abc.public.blob.vercel-storage.com/p.png")).toBe(true);
  });

  it.each(["https://evil.example.com/p.png", "http://abc.public.blob.vercel-storage.com/p.png", "https://public.blob.vercel-storage.com.evil.com/p.png", "not a url"])(
    "rejects %s",
    (url) => {
      expect(isBlobUrl(url)).toBe(false);
    },
  );
});
