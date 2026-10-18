import type { ActionFailure } from "./action";
import type { Enhancement, Expander, Item } from "./items";
import type { PurchaseFailure } from "./shop";
import type { ConfirmOptions, PopupOptions } from "./usePopup";

const ACTION_FAILURE_TITLES: Record<ActionFailure, string> = {
  no_item: "The Mbappé Special",
  target_gone: "Target is a coward",
  target_down: "Target is already deadge",
  actor_dead: "YOU are already deadge",
  not_started: "Chill outtttt",
  on_cooldown: "Keep spam clicking :)",
  not_enough_mana: "L mana sustain tbh",
  nothing_to_heal: "Being a healer in a full HP lobby be like",
  invalid: "Nuh uh",
};

const PURCHASE_FAILURE_TITLES: Record<PurchaseFailure, string> = {
  cant_afford: "You're broke... how shocking",
  already_owned: "Biblical greed",
  no_free_slot: "Scalper prevention system",
  slots_full: "Out of magic!",
  nothing_to_enhance: "An engine with no car",
  cant_expand: "Searching for a slot that doesn't exist",
  level_too_low: "Imagine still early game",
  invalid: "What !!",
};

const genericErrorMessage = "Something went wrong. Please try again. Contact @iaminnocent4298 if this error persists";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : genericErrorMessage;
}

export const popupMessages = {
  action: {
    noItemEquipped: {
      title: "What are you gonna attack with-",
      message: "Purchase a weapon or a spell first silly :3",
    } satisfies PopupOptions,
    chooseItem: (targetName: string) => ({
      title: `Use on ${targetName}`,
      message: "Pick your method of attack (or heal):",
    }),
    levelUp: (levels: number, abilityPoints: number): PopupOptions => ({
      title: "Level up, woahhhhhhh",
      message:
        `You levelled up ${levels} ${levels === 1 ? "time" : "times"} and gained ` +
        `${abilityPoints} ability ${abilityPoints === 1 ? "point" : "points"}.`,
    }),
    failure: (reason: ActionFailure, message: string): PopupOptions => ({
      title: ACTION_FAILURE_TITLES[reason],
      message,
    }),
    unexpectedFailure: (): PopupOptions => ({
      title: "Action failed",
      message: genericErrorMessage,
    }),
  },
  room: {
    startFailure: (error: unknown): PopupOptions => ({
      title: "Couldn't start",
      message: errorMessage(error),
    }),
  },
  equipment: {
    salvageConfirmation: (
      item: Item,
      refund: number,
      enhancementCount: number,
      extraSlots: number
    ): ConfirmOptions => ({
      title: "Salvage item?",
      message: (
        <>
          Salvage <strong className={`rarity-${item.rarity}`}>{item.name}</strong> for{" "}
          <strong>{refund} coins</strong>?{" "}
          {enhancementCount > 0 && (
            <>
              Its {enhancementCount} enhancement{enhancementCount === 1 ? "" : "s"} will be gone... forever.{" "}
            </>
          )}
          {extraSlots > 0 && (
            <>
              The expanders you applied will be lost forever as well.{" "}
            </>
          )}
          Its stat bonuses will be removed. This can't be undone.
        </>
      ),
      confirmLabel: "Salvage",
      cancelLabel: "Keep it",
    }),
    salvageFailure: (error: unknown): PopupOptions => ({
      title: "Couldn't salvage",
      message: errorMessage(error),
    }),
  },
  points: {
    confirmFailure: (error: unknown): PopupOptions => ({
      title: "Couldn't confirm changes",
      message: errorMessage(error),
    }),
  },
  shop: {
    failure: (reason: PurchaseFailure, message: string): PopupOptions => ({
      title: PURCHASE_FAILURE_TITLES[reason],
      message,
    }),
    unexpectedFailure: (): PopupOptions => ({
      title: "Couldn't buy",
      message: genericErrorMessage,
    }),
    applyPrompt: (
      entry: Enhancement | Expander,
      price: number
    ) => ({
      title: `Apply ${entry.name}`,
      message:
        entry.kind === "expander"
          ? `Pick the gear or spell to expand. It gains ${entry.slots} enhancement ` +
            `slot${entry.slots === 1 ? "" : "s"} and costs ${price} coins.`
          : `Pick the gear or spell to enhance. It costs ${price} coins.`,
    }),
  },
};
