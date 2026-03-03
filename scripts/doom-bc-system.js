import { DoomBCActorSheet } from "./sheets/actor-sheet.js";
import { DoomBCItemSheet } from "./sheets/item-sheet.js";

Hooks.once("init", () => {
  console.log("Doom BC | Initializing system");

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("doom-bc", DoomBCActorSheet, {
    types: ["pc", "npc", "vehicle"],
    makeDefault: true
  });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("doom-bc", DoomBCItemSheet, {
    makeDefault: true
  });
});
