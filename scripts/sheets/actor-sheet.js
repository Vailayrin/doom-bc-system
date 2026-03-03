export class DoomBCActorSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["doom-bc", "sheet", "actor"],
      width: 820,
      height: 740,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }]
    });
  }

  get template() {
    switch (this.actor.type) {
      case "npc":
        return "templates/actor/npc-sheet.hbs";
      case "vehicle":
        return "templates/actor/vehicle-sheet.hbs";
      case "pc":
      default:
        return "templates/actor/pc-sheet.hbs";
    }
  }

  async getData(options) {
    const data = await super.getData(options);
    data.system = data.actor.system;
    return data;
  }
}
