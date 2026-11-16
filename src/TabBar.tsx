type Props<T extends string> = {
  tabs: readonly { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
};

export default function TabBar<T extends string>({ tabs, active, onChange }: Props<T>) {
  return (
    <nav className="tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          className="tab"
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
