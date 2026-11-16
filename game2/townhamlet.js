// The plague town as built: the Crossing, in the Die2Nite look. Two streets cross at the well in a dirt square; the church, tavern,
// apothecary and watch house along the north; ten plank-and-tin cottages in two blocks; spikes outside the stakes; the Wastes beyond.
mkTown('town', 'The Plague Town', { WALL: [5, 12, 43, 38.5], GATE: [22, 26], CHURCH: [6.5, 13.5], TAVERN: [14.5, 13.5], APOTH: [27, 13.5], WATCH: [35.5, 13.5], cottage: 1, spikes: 1, d2n: 1, plaza: [24, 24.6, 4.6],
  HOUSES: [[6.2, 26], [11.1, 26], [16, 26], [6.2, 32.2], [11.1, 32.2], [16, 32.2], [32.3, 26], [37.2, 26], [32.3, 32.2], [37.2, 32.2]],
  WELL: [23, 23.6], SHOP: [27.4, 27.6], PYRE: [28.4, 33.2], CART: [30, 40.2], GDN: [11, 40.4], TOWER: [40.6, 11.8],
  roads: [[[24, 38.5], [24, 19]], [[6, 23.6], [42, 23.6]], [[24, 50], [24, 38.5]]],
  lamps: [[21.6, 21.8], [26.4, 21.8], [21.6, 27.4], [26.4, 27.4], [24.8, 37], [13.6, 24.8], [34.4, 24.8]], trees: [], dead: [[20.4, 35.6], [42, 37.4], [5.8, 21]] });
Object.assign(MAPS.town, { stash: [29.5, 26.9], gibbet: [20.8, 31], gather: [10, 17.5], hangFrom: [24, 28], center: [24, 26], drift: [8, 6], complineCam: [10, 21.5],
  hordeW: q => 1 + Math.max(0, q.y - 28) / 3 });
MAPS.town.plan.rooms.fields.name = 'The Wastes';
