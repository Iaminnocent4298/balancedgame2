import { useEffect, useState } from "react";

type ChangelogResult = { html: string } | { error: true };

const changelogPromise: Promise<ChangelogResult> = fetch(
  `${import.meta.env.BASE_URL}changelog.html`,
  { cache: "no-cache" }
)
  .then((res) => {
    if (!res.ok) throw new Error("Not found");
    return res.text();
  })
  .then((html) => {
    // The dev server answers a missing file with the app's own page, so catch that too
    if (html.includes('id="root"')) throw new Error("Not found");
    return { html };
  })
  .catch((): ChangelogResult => ({ error: true }));

export default function ChangelogTab() {
  const [html, setHtml] = useState<string | undefined>(undefined);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    changelogPromise.then((result) => {
      if (cancelled) return;
      if ("error" in result) setError(true);
      else setHtml(result.html);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p>Couldn't load the changelog.</p>;
  if (html === undefined) return <p>Loading changelog...</p>;

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}