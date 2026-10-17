import { useEffect, useState } from "react";
import { confirmPoints, getPointsChangeCooldownUntil } from "./points";
import { POINT_RATES, STATS, describeField, withDefaults, type Stats } from "./stats";
import { getDisplayStats } from "./statCalc";
import Tooltip from "./Tooltip";
import { useRoomData } from "./useRoomData";
import { formatNumber as round } from "./format";
import Countdown from "./Countdown";
import { usePopup } from "./usePopup";
import { popupMessages } from "./PopupMessages";

export default function PointsMenu({ uid, onBack }: { uid: string; onBack: () => void }) {
  const { me, room } = useRoomData();
  const { showPopup } = usePopup();
  const pointStateKey = JSON.stringify(
    [me?.id, ...Object.keys(POINT_RATES).map((field) => me?.points?.[field] ?? 0)]
  );
  const [draftState, setDraftState] = useState<{ source: string; values: Stats } | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const activeRoom = room;
  if (!me || !activeRoom) return <p>Loading...</p>;

  const roomMode = activeRoom.mode;
  const committed = me.points ?? {};
  const draft = draftState?.source === pointStateKey ? draftState.values : committed;
  const available = withDefaults(me.stats).abilityPoints;
  const spentChange = Object.keys(POINT_RATES).reduce(
    (sum, field) => sum + (draft[field] ?? 0) - (committed[field] ?? 0),
    0
  );
  const draftAvailable = available - spentChange;
  const stats = getDisplayStats(me.stats, draft, me.equipment, me.enhancements);
  stats.abilityPoints = draftAvailable;
  const lastChangedAt = me.pointsChangedAt;
  const lastChangedLevel = me.pointsChangedLevel;
  const cooldownUntil = getPointsChangeCooldownUntil(
    lastChangedAt,
    lastChangedLevel,
    withDefaults(me.stats).level,
    roomMode
  );
  const hasChanges = Object.keys(POINT_RATES).some(
    (field) => (draft[field] ?? 0) !== (committed[field] ?? 0)
  );
  const cooldownActive = now < cooldownUntil;
  const ap = describeField("abilityPoints");

  function stepButton(field: string, spent: number, step: number) {
    const impossible = step > 0 ? draftAvailable < step : spent < -step;
    return (
      <button
        key={step}
        disabled={impossible || busy}
        onClick={() => {
          setDraftState({
            source: pointStateKey,
            values: { ...draft, [field]: spent + step },
          });
        }}
      >
        {step > 0 ? `+${step}` : step}
      </button>
    );
  }

  async function handleConfirm() {
    setBusy(true);
    try {
      await confirmPoints(uid, draft, roomMode);
    } catch (error) {
      showPopup(popupMessages.points.confirmFailure(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="menu-head">
        <button onClick={onBack}>← Back</button>
        <h2>Modify points</h2>
      </div>

      <div className="box points-ap stat-abilityPoints">
        {ap.icon} Ability Points remaining: <strong>{round(draftAvailable)}</strong>
      </div>

      <div className="points-layout">
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
                  const spent = draft[field] ?? 0;
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
          <Tooltip
            content={cooldownActive ? (
              <>
                <Countdown until={cooldownUntil} /> remaining
                (or level up)
              </>
            ) : null}
          >
            <span className="points-confirm-trigger">
              <button
                disabled={busy || !hasChanges || cooldownActive || draftAvailable < 0}
                onClick={handleConfirm}
              >
                {busy ? "Confirming..." : "Confirm changes"}
              </button>
            </span>
          </Tooltip>
        </section>

        <section className="points-section">
          <h3>Preview stats</h3>
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
                    <td>{def.display(stats)}</td>
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
