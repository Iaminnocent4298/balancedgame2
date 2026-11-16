import { Fragment, useEffect, useState } from "react";
import Tooltip from "./Tooltip";
import type { Choice, ChoiceGroup } from "./usePopup";

type Props = {
  groups: ChoiceGroup<unknown>[];
  multiple: boolean; // true: cards are tick-boxes. false: clicking a card picks it
  selected: unknown[]; // the values ticked so far (multiple only)
  onPick: (choice: Choice<unknown>) => void; // a click on a card that isn't locked or disabled
};

// The rows of cards inside a choice popup
export default function ChoiceGroups({ groups, multiple, selected, onPick }: Props) {
  // A choice can be locked until a certain time (such as a weapon cooldown). This clock
  // lets it unlock by itself while the popup is open. It only runs if some choice is timed.
  const [now, setNow] = useState(() => Date.now());
  const timed = groups.some((g) => g.choices.some((c) => c.lockedUntil !== undefined));

  useEffect(() => {
    if (!timed) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [timed]);

  return (
    <div className="popup-groups">
      {groups.map((group, g) => (
        <div key={g} className="popup-group">
          {group.title && <h3>{group.title}</h3>}
          <div className="popup-row">
            {group.choices.map((choice, i) => {
              const locked = choice.lockedUntil !== undefined && choice.lockedUntil > now;
              const disabled = Boolean(choice.disabled) || locked;
              const pick = () => {
                // Re-checked at the moment of the click, not just at the last tick
                const stillLocked = choice.lockedUntil !== undefined && choice.lockedUntil > Date.now();
                if (!choice.disabled && !stillLocked) onPick(choice);
              };
              const card = (
                <div
                  className={`choice-card${multiple ? " choice-card-multiple" : ""}${
                    disabled ? " choice-card-disabled" : ""
                  }`}
                  onClick={pick}
                >
                  {multiple ? (
                    <>
                      <span className="choice-label">{choice.label}</span>
                      <input
                        className="choice-checkbox"
                        type="checkbox"
                        checked={selected.includes(choice.value)}
                        disabled={disabled}
                        aria-label="Select target"
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => {
                          event.stopPropagation();
                          pick();
                        }}
                      />
                    </>
                  ) : (
                    <>
                      {choice.label}
                      <button className="choice-pick" disabled={disabled}>
                        {locked ? (choice.lockedLabel ?? "Locked") : (choice.buttonLabel ?? "Choose")}
                      </button>
                    </>
                  )}
                </div>
              );
              const tip = locked ? (choice.lockedTooltip ?? choice.tooltip) : choice.tooltip;
              return tip ? (
                <Tooltip key={i} content={tip}>{card}</Tooltip>
              ) : (
                <Fragment key={i}>{card}</Fragment>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
