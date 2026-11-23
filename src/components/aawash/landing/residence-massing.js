export const buildingProfiles = {
  avenue: { texture: "avenue-stone.webp", angle: .38, width: 15.2 },
  savitri: { texture: "savitri-stucco.webp", angle: -.54, width: 15.7 },
  shree: { texture: "shree-concrete.webp", angle: -.48, width: 16.7 },
};

export function buildResidence(project, { box, facade, leaf, finish }) {
  const savitri = project === "savitri";
  const floors = savitri ? 4 : 5;
  const floorHeight = savitri ? 1.11 : 1.04;
  const wings = savitri
    ? [[-4.15, 2.55, -1.18], [-1.55, 2.56, -.62], [1.07, 2.65, -.07], [3.85, 2.9, .45]]
    : [[-4.8, 2.5, -.64], [-2.15, 2.85, -.3], [.8, 3.05, 0], [4.03, 3.45, .36]];
  const depth = savitri ? 4.1 : 4.7;
  const plinth = .7;

  function window(x, y, z, width, height, lit) {
    box("frame", x, y, z, width, height, .09);
    box(lit ? "warm" : "glass", x, y, z + .055, width - .09, height - .08, .028);
    for (const offset of [-.24, 0, .24]) {
      box("frame", x + width * offset, y, z + .073, .023, height - .025, .019);
    }
  }

  function rail(x, y, z, width) {

    for (const height of savitri ? [.26] : [.05, .12, .19, .27]) {
      box("frame", x, y + height, z + .012, width, .025, .039);
    }
    for (const offset of [-.47, -.16, .16, .47]) {
      box("frame", x + width * offset, y + .125, z, .029, .28, .034);
    }
  }

  box("asphalt", 0, .055, .3, 12.5, .1, 6.6);
  for (const [x, width, z] of wings) {
    box("charcoal", x, .32, z - .16, width - .19, .57, depth - .23);
    for (const side of [-1, 1]) {
      box("trim", x + side * (width / 2 - .18), .34, z + depth / 2, .18, .63, .24);
    }
  }
  const entryX = savitri ? -1.45 : 1.65;
  const entryZ = 3.75;
  for (const side of [-1, 1]) {
    box("trim", entryX + side * 1.08, .39, entryZ, .23, .76, .25);
    box("stone", entryX + side * 2, .19, entryZ, 1.6, .33, .18);
  }
  box(savitri ? "trim" : "charcoal", entryX, .79, entryZ, 2.38, .16, .34);
  for (let slat = -11; slat <= 11; slat++) {
    box("frame", entryX + slat * .08, .31, entryZ, .023, .52, .049);
  }
  box("frame", entryX, .17, entryZ, 1.79, .045, .057);
  box("frame", entryX, .52, entryZ, 1.79, .045, .057);
  finish();

  for (let floor = 1; floor <= floors; floor++) {
    const y = plinth + (floor - .5) * floorHeight;
    for (const [index, [x, width, z]] of wings.entries()) {
      const front = z + depth / 2;
      box(savitri ? "concrete" : "trim", x, y, z, width, floorHeight, depth);
      const balcony = width * (index === 3 ? .75 : .91);
      const balconyX = index === 3 ? x + width * .075 : x;
      const slab = y - .42;
      box(savitri ? "trim" : "stone", balconyX, slab, front + .28, balcony, .17, .87);
      box("trim", balconyX, slab + .09, front + .28, balcony - .04, .035, .83);
      rail(balconyX, slab + .09, front + .703, balcony - .035);
      for (const offset of [-1, 1]) {
        const sideX = balconyX + offset * (balcony / 2 - .022);
        if (savitri) box("railing", sideX, slab + .22, front + .32, .027, .22, .73);
        for (const height of savitri ? [.26] : [.05, .12, .19, .27]) {
          box("frame", sideX, slab + .09 + height, front + .33, .026, .023, .745);
        }
      }
      window(balconyX, y + .01, front + .03, balcony * .64, .67, savitri && (floor + index) % 3 !== 0);
      facade((floor + index) % 3, balconyX, y + .005, front + .51, balcony - .11, .64);
      if (index === 3) window(x - width * .37, y + .08, front + .036, .32, .41, savitri);

      const columnX = x + width / 2 - .055;
      box(savitri ? "stone" : "trim", columnX, y, front + (savitri ? -.04 : .21), savitri ? .13 : .2, floorHeight, savitri ? .38 : .94);
      box(savitri ? "charcoal" : "stone", x - width * .45, y, front - .05, savitri ? .12 : .37, floorHeight, .3);

      for (const offset of [-.31, .08, .34]) {
        box("frame", x + width * offset, y, z - depth / 2, .55, .56, .067);
        box("glass", x + width * offset, y, z - depth / 2 - .038, .47, .48, .025);
      }
      if (index === 0 || index === wings.length - 1) {
        const side = index === 0 ? -1 : 1;
        const outer = x + side * width / 2;
        for (const dz of [-1.28, 0, 1.29]) {
          box("frame", outer, y, z + dz, .075, .58, .67);
          box("glass", outer + side * .042, y, z + dz, .03, .5, .59);
          if (side === 1) facade(3, outer + .07, y - .02, z + dz, .59, .49, Math.PI / 2);
        }
        if (savitri && side === 1) {
          box("trim", outer + .25, slab, front - .52, .82, .17, 1.8);
          box("railing", outer + .635, slab + .21, front - .54, .028, .23, 1.73);
          box("frame", outer + .647, slab + .342, front - .54, .04, .027, 1.75);
          box("frame", outer + .64, slab + .21, front - 1.38, .035, .26, .035);
        } else if (!savitri) {
          box("stone", outer + side * .18, slab, z + .43, .56, .17, 2.14);
          for (const line of [.14, .21, .28, .35]) {
            box("frame", outer + side * .45, slab + line, z + .43, .026, .023, 2.1);
          }
        }
      }
      if (savitri) {
        box("lamp", balconyX, y + .415, front + .27, .105, .025, .105);
        const planterX = balconyX + (index % 2 ? -.34 : .34) * balcony;
        box("stone", planterX, slab + .16, front + .48, .22, .15, .21);
        leaf(planterX, slab + .31, front + .48);
      }
    }
    finish(floor === 2 ? "two" : floor === floors ? "three" : undefined);
  }

  const top = plinth + floors * floorHeight;
  for (const [index, [x, width, z]] of wings.entries()) {
    const front = z + depth / 2;
    box("trim", x, top + .11, z, width + .1, .22, depth + .15);
    box("trim", x, top + .39, front + .04, width, .37, .14);
    box("concrete", x, top + .29, z - depth / 2, width, .19, .13);
    if (savitri) {
      box("concrete", x - width * .3, top + .37, z - .5, .48, .62, 1.25);
      box("trim", x - width * .3, top + .7, z - .5, .56, .12, 1.36);
    } else {
      box("trim", x, top + .74, front + .22, width, .19, .96);
      box("trim", x + width / 2 - .11, top + .4, front + .22, .2, .7, .96);
      box("stone", x - width / 2 + .15, top + .43, front - .08, .31, .69 + index * .06, .55);
    }
  }
  finish("roof");
}
