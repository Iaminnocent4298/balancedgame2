import { useEffect, useState } from "react";

export default function ChangelogTab() {
  const [html, setHtml] = useState<string | undefined>(undefined);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`${import.meta.env.BASE_URL}changelog.html`, { cache: "no-cache" })
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.text();
      })
      .then((text) => {
        // The dev server answers a missing file with the app's own page, so catch that too
        if (text.includes('id="root"')) throw new Error("Not found");
        if (!cancelled) setHtml(text);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p>Couldn't load the changelog.</p>;
  if (html === undefined) return <p>Loading changelog...</p>;

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}