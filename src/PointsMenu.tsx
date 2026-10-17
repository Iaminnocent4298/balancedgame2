import { useEffect, useState } from "react";
import { changePoints, subscribeToPoints, type PointsState } from "./points";
import { POINT_RATES, STATS, describeField } from "./stats";
import { getDisplayStats } from "./statCalc";
import Tooltip from "./Tooltip";

const round = (v: number) => String(Math.round(v * 100) / 100);

export default function PointsMenu({ uid, onBack }: { uid: string; onBack: () => void }) {
  // undefined = still loading
  const [state, setState] = useState<PointsState | undefined>(undefined);

  useEffect(() => subscribeToPoints(uid, setState), [uid]);

  if (!state) return <p>Loading...</p>;

  const ap = describeField("abilityPoints");
  // Same totals as the Stats tab: base + points + equipment
  const live = getDisplayStats(state.stats, state.spent, state.equipment, state.enhancements);

  // One button. Disabled when the change isn't possible (no popups, as requested).
  function stepButton(field: string, spent: number, step: number) {
    const impossible = step > 0 ? state!.available < step : spent < -step;
    return (
      <button
        key={step}
        disabled={impossible}
        onClick={() => {
          changePoints(uid, field, step).catch((err) => console.error(err));
        }}
      >
        {step > 0 ? `+${step}` : step}
      </button>
    );
  }

  return (
    <div>
      <div className="menu-head">
        <button onClick={onBack}>← Back</button>
        <h2>Modify points</h2>
      </div>

      <div className="box points-ap stat-abilityPoints">
        {ap.icon} Ability Points: <strong>{round(state.available)}</strong>
      </div>

      <div className="points-layout">
        {/* Left: spend points */}
        <section className="points-section">
          <h3>Spend points</h3>
          <div className="table-scroll">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Stat</th>
                  <th>AP spent</th>
                  <th>Stat change</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(POINT_RATES).map(([field, rate]) => {
                  const { icon, label, suffix, statId } = describeField(field);
                  const spent = state.spent[field] ?? 0;
                  return (
                    <tr key={field} className={`stat-${statId}`}>
                      <Tooltip content={`Each point gives +${round(rate)}${suffix} ${label}`}>
                        <th scope="row">
                          {icon} {label}
                        </th>
                      </Tooltip>
                      <td>
                        <div className="points-controls">
                          {stepButton(field, spent, -5)}
                          {stepButton(field, spent, -1)}
                          <span className="points-value">{round(spent)}</span>
                          {stepButton(field, spent, 1)}
                          {stepButton(field, spent, 5)}
                        </div>
                      </td>
                      <td>
                        +{round(spent * rate)}
                        {suffix}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right: your live stats */}
        <section className="points-section">
          <h3>Your stats</h3>
          <div className="table-scroll">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Stat</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {STATS.map((def) => (
                  <tr key={def.id} className={`stat-${def.id}`}>
                    <Tooltip content={def.description}>
                      <th scope="row">
                        {def.icon} {def.label}
                      </th>
                    </Tooltip>
                    <td>{def.display(live)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}