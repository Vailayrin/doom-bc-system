export class DoomBCItemSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["doom-bc", "sheet", "item"],
      width: 620,
      height: 520
    });
  }

  get template() {
    return "systems/doom-bc-system/templates/item/item-sheet.hbs";
  }

  async getData(options) {
    const data = await super.getData(options);
    data.system = data.item.system;
    return data;
  }
}
