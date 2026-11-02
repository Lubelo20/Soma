import { describe, expect, it } from "vitest";
import { isBlobUrl, posterFileError } from "./poster";

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
