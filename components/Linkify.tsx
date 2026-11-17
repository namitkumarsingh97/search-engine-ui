import { Fragment } from "react";

// Web addresses only (http or https). Anything else stays plain text.
const URL_RE = /\bhttps?:\/\/[^\s<>"]+/gi;
// Punctuation that usually ends a sentence rather than the link: "see https://a.com/page."
const TRAILING = /[.,;:!?)\]}'"]+$/;

/**
 * Shows plain text with its web links clickable. It builds React elements (never HTML), so
 * message text can't inject markup, and links open in a new tab without passing on any
 * information about this page.
 */
export default function Linkify({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;

  for (const match of text.matchAll(URL_RE)) {
    const start = match.index ?? 0;
    let url = match[0];
    const trailing = url.match(TRAILING)?.[0] ?? "";
    if (trailing) url = url.slice(0, -trailing.length);

    // A link must still be a valid web address after trimming.
    let valid = false;
    try {
      const parsed = new URL(url);
      valid = parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      valid = false;
    }
    if (!valid) continue;

    if (start > last) parts.push(text.slice(last, start));
    parts.push(
      <a key={start} href={url} target="_blank" rel="noopener noreferrer nofollow" className="link break-all">
        {url}
      </a>,
    );
    last = start + url.length;
  }
  if (last < text.length) parts.push(text.slice(last));

  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>{p}</Fragment>
      ))}
    </>
  );
}
