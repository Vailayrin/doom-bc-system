import { DoomBCActorSheet } from "./sheets/actor-sheet.js";
import { DoomBCItemSheet } from "./sheets/item-sheet.js";

Hooks.once("init", () => {
  console.log("Doom BC | Initializing system");

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("doom-bc-system", DoomBCActorSheet, {
    types: ["pc", "npc", "vehicle"],
    makeDefault: true
  });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("doom-bc-system", DoomBCItemSheet, {
    makeDefault: true
  });
});

Hooks.on("renderChatMessage", (_message, html) => {
  html.find(".doom-bc-reroll").on("click", async (event) => {
    event.preventDefault();
    const button = event.currentTarget;
    const actorId = button.dataset.actorId;
    const characteristicKey = button.dataset.characteristic;
    const testName = button.dataset.testName ?? "Characteristic Test";
    const finalModifier = Number.parseInt(button.dataset.finalModifier ?? "0", 10) || 0;

    const actor = game.actors.get(actorId);
    if (!actor) {
      ui.notifications?.warn(game.i18n.localize("DOOMBC.Roll.actorMissing"));
      return;
    }

    await DoomBCActorSheet.rollCharacteristicTest({
      actor,
      characteristicKey,
      testName,
      finalModifier,
      isReroll: true,
      canReroll: false
    });
  });
});
