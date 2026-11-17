// Stat icons. An icon is just a name (the `icon` field in stats.ts):
//  - if a PNG with that name exists in src/icons/ (e.g. "health" -> src/icons/health.png), it's drawn as pixel art
//  - otherwise the name is shown as text, so Unicode symbols like "❤" keep working while you migrate
// To add an icon: drop an 8x8 PNG (transparent background) into src/icons/ and set `icon: "<file name>"`.
const files = import.meta.glob<string>("./icons/*.png", {
  eager: true,
  query: "?url",
  import: "default",
});

const ICONS: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.slice(path.lastIndexOf("/") + 1, -".png".length), url])
);

type Props = {
  name: string; // a file name in src/icons/ (without .png), or a text symbol
  label?: string; // what a screen reader should say, if the icon stands alone (not followed by a label)
};

export default function Icon({ name, label }: Props) {
  const src = ICONS[name];
  if (src) return <img className="icon" src={src} alt={label ?? ""} />;

  // Looks like a file name but there's no such file: a typo would otherwise show as odd text
  if (import.meta.env.DEV && /^[A-Za-z][\w-]+$/.test(name)) {
    console.warn(`Icon "${name}" not found: add src/icons/${name}.png`);
  }
  return <>{name}</>;
}