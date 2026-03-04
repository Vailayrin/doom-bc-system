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
    data.isTrait = data.item.type === "trait";
    data.isTalent = data.item.type === "talent";
    const talentAptitudes = ["WS", "BS", "S", "T", "A", "I", "P", "W", "F", "Off", "Fin", "Def", "Knw", "FC", "Psy", "Soc", "Gen", "Tec"];
    data.talentAptitudeFirstOptions = talentAptitudes.map((value) => ({ value, label: value }));
    data.talentAptitudeSecondOptions = talentAptitudes.map((value) => ({ value, label: value }));
    data.talentTierOptions = [1, 2, 3].map((value) => ({ value, label: String(value) }));
    return data;
  }
}

