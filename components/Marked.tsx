// The API wraps matched words in control characters (\u0001 ... \u0002).
// We render them as <mark> elements ourselves instead of injecting HTML, so
// page content can never inject markup.
const PIECES = /(\u0001[^\u0002]*\u0002)/;

export default function Marked({ text }: { text: string }) {
  return (
    <>
      {text.split(PIECES).map((part, i) =>
        part.startsWith("\u0001") ? (
          <mark key={i} className="bg-mustard px-0.5 text-ink">
            {part.slice(1, -1)}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
