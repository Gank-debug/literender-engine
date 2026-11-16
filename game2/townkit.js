// The plague town's creatures (DRAFTS): the Strigoi's true form, and the dead that come at the walls by night.
// Built the same way as the Hollow (kit3.js): sculpted from spheres, tubes and stacked ellipses on a KIT.Surf, painted 'clay',
// pale flesh and eyes flagged emissive (alpha 254) so they read in the dark.
(() => {
  const { Surf, hs } = KIT, cache = new Map();
  const finish = (S, EM, glow) => {
    S.paint('clay');
    for (const [k, mul] of glow) { for (let i = 0; i < S.w * S.h; i++) if (S.bc[i] === k && S.c[i * 4 + 3]) { S.c[i * 4] *= mul; S.c[i * 4 + 1] *= mul; S.c[i * 4 + 2] *= mul; S.c[i * 4 + 3] = 254; } }
    for (const [x, y, z] of EM) { const [sx, sy] = S.proj(x, y, z); for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const X = sx + i, Y = sy + j; if (X < 0 || Y < 0 || X >= S.w || Y >= S.h) continue; const k = Y * S.w + X; if (S.c[k * 4 + 3] && S.c[k * 4] > 150) S.c[k * 4 + 3] = 254; } }
    let x0 = S.w, y0 = S.h, x1 = -1, y1 = -1; for (let j = 0; j < S.h; j++) for (let i = 0; i < S.w; i++) if (S.c[(j * S.w + i) * 4 + 3]) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
    if (x1 < 0) { x0 = y0 = x1 = y1 = 0; } const cw = x1 - x0 + 1, ch = y1 - y0 + 1, cd = new Uint8ClampedArray(cw * ch * 4); for (let j = 0; j < ch; j++) cd.set(S.c.subarray(((j + y0) * S.w + x0) * 4, ((j + y0) * S.w + x0 + cw) * 4), j * cw * 4);
    return { w: cw, h: ch, ox: -S.ax + x0, oy: -S.ay + y0, data: cd }; };
  const key = c => (c[0] & 255) << 16 | (c[1] & 255) << 8 | (c[2] & 255);
  const F = { idle: 4, walk: 4 };

  // ---------------------------------------------------------------- the Strigoi
  // v: 'unburied' (the corpse in its winding sheet, risen: tall, stooped, the sheet torn from the face, arms to the knee and long nails)
  //    'red' (the red-haired: a gaunt grey thing, hair to the waist over its face, arms that reach the ground, moving on its knuckles)
  //    'owl' (strix, the screech owl the name comes from: a cloak that opens into rag wings, a flat pale owl's face, talons)
  const strigoi = (v = 'unburied', face = 0, pose = 'idle', frame = 0) => { frame %= F[pose] || 1; const k0 = 'S' + v + face + pose + frame; if (cache.has(k0)) return cache.get(k0);
    const S = new Surf(300, 330, 150, 290); S.scale({ unburied: 1.6, red: 1.75, owl: 1.6, folded: 1.6, maw: 1.6, twin: 1.6, float: 1.55, orlok: 1.5, count: 1.5, feeder: 1.6, batwing: 1.5 }[v] || 1.6); S.face(Math.PI / 4 + face * Math.PI / 4); const EM = [], T = frame / 4 * 6.2832, walk = pose === 'walk', snap = pose === 'idle' && frame === 2;
    const skin = [176, 168, 150], eye = [255, 70, 50], gum = [70, 20, 24], nail = [120, 110, 90];
    const em = (x, y, z, r, c) => { EM.push([x, y, z]); S.sph(x, y, z, r, r, r, () => [c, 1.6]); };
    const hand = (p, d, len, s = 1) => { S.sph(p[0], p[1], p[2], .9, .8, .7, () => [skin, 0]); for (let f = -1.5; f <= 1.5; f++) { const q = [p[0] + d[0] * len, p[1] + d[1] * len + f * .5 * s, p[2] + d[2] * len - Math.abs(f) * .3]; S.tube([p[0], p[1] + f * .35, p[2]], q, .3, .22, [skin, 0]); S.tube(q, [q[0] + d[0] * 1.4, q[1] + d[1] * 1.4 + f * .15, q[2] + d[2] * 1.4 - .6], .2, .1, [nail, .05]); } };
    const glow = [];
    if (v === 'unburied') {
      const sheet = [196, 186, 160], band = [110, 90, 60], dirt = [80, 64, 44], st = walk ? Math.sin(T) : 0, lean = 8;
      for (let k = 0; k < 8; k++) S.sph(-3 - k * 1.3, (hs(k, 3) - .5) * 2, .4, 3 - k * .25, 3.2 - k * .2, .5, () => [k > 4 ? dirt : sheet, -.08]);   // the sheet's end, dragged
      // the winding sheet: a long stooped bundle, bound at the shins, the knees and the chest; grave dirt at the hem and stains
      S.ell(0, 30, 4.4, 4.6, 4.8, 5.4, (th, z) => { const b = Math.abs(z - 8) < .7 || Math.abs(z - 19) < .7; if (b) return [band, -.05]; if (z < 3 + hs(Math.floor(th * 9), 2) * 3) return [dirt, -.1];
        if (hs(Math.floor(th * 7), Math.floor(z / 3)) > .86) return [[150, 96, 70], -.08]; return [sheet, Math.abs(Math.sin(th * 6 + z * .2)) < .15 ? -.12 : 0]; }, 0, lean * .6, 3);
      S.ell(30, 43, 4.8, 5.4, 3.6, 4.6, (th, z) => Math.abs(z - 37) < .7 ? [band, -.05] : [sheet, Math.abs(Math.sin(th * 5 + z * .3)) < .14 ? -.12 : 0], lean * .6, lean + 1, 3);
      // the head: the sheet torn open at the face; a pale face with red-ringed eyes and a black mouth; a knot of cloth on top
      const hx = lean + 3.5, hz = 46 + (snap ? 1.5 : 0), tilt = snap ? .5 : .15;
      S.sph(hx - 1, 0, hz, 3.6, 3.4, 4, (dx, dy, dz) => dx > .5 && dz < .65 && dz > -.7 && Math.abs(dy) < .7 ? null : [sheet, dz > .5 ? .06 : 0]);
      S.sph(hx + .6, tilt * 2, hz - 1, 2.4, 2.3, 3.8, (dx, dy, dz) => { if (dx < .2) return null; if (dz < -.05 && dz > -.92 && Math.abs(dy) < .5 - (dz + .5) * (dz + .5) * .5) return [gum, -.6]; if (dz > .2 && dz < .5 && Math.abs(Math.abs(dy) - .38) < .2) return [[24, 14, 14], -.6]; return [skin, 0]; });
      for (let k = 0; k < 5; k++) S.tube([lean + 3.6, -3 + k * 1.5, 34], [lean + 4.2, -3.4 + k * 1.7, 30], .45, .4, [skin, k % 2 ? -.1 : .05]);   // ribs, through a tear
      for (const s of [-1, 1]) em(hx + 2.7, s * .85 + tilt * 2, hz + .3, .3, eye);
      S.tube([hx - 2, 0, hz + 3.6], [hx - 3.4, 0, hz + 6], 1.1, .4, [band, 0]);
      // the arms: bare, out through slits in the sheet, hanging to the knee, long nails
      [1, -1].forEach((s, i) => { const ph = i ? -st : st, sh = [lean + 1, s * 5, 39], el = [lean + 2 + ph, s * 9, 30], hd = [lean + 7 + ph * 1.5, s * 8.5, 21 + (snap && i ? 8 : 0)];
        S.tube(sh, el, 1.2, 1, [skin, 0]); S.tube(el, hd, 1, .9, [skin, 0]); hand(hd, [.7, s * .2, -.6], 2.6); });
      glow.push([key(skin), .6]);
    } else if (['orlok', 'count', 'feeder', 'batwing'].includes(v)) {
      // vampire redesigns, in the Hollow's colours: near-black cloth, pale flesh that glows faintly, and now the vampire's marks:
      // fangs, red eyes, pointed ears, claws, a high collar, wings
      const dark = [46, 40, 46], inner = [10, 8, 10], blood = [110, 14, 18], st = walk ? Math.sin(T) : 0;
      const fold = th => { const f = Math.abs(Math.sin(th * 5 + .7)); return f < .08 ? -.24 : f < .2 ? -.07 : 0; };
      // the head: bald, long, pale; red eyes; pointed ears; a thin mouth with two long fangs (rat-like at the front, or at the sides)
      const vhead = (c, sc = 1, rat = false, gape = 0) => { const [x, y, z] = c;
        S.sph(x, y, z, 2.6 * sc, 2.3 * sc, 3.3 * sc, (dx, dy, dz) => [skin, dz > .7 ? .06 : 0]);
        for (const s of [-1, 1]) { S.tube([x - .4 * sc, y + s * 2 * sc, z + .4 * sc], [x - 1.6 * sc, y + s * 3.8 * sc, z + 2.6 * sc], .7 * sc, .12, [skin, -.04]); em(x + 2.1 * sc, y + s * .9 * sc, z + .7 * sc, .32 * sc, eye); }
        S.sph(x + 2.2 * sc, y, z - 1.3 * sc, .5 * sc, 1.1 * sc, .25 * sc + gape * .6 * sc, (dx, dy, dz) => dx > 0 ? [gum, -.6] : null);
        for (const s of (rat ? [-.18, .18] : [-.75, .75])) S.tube([x + 2.5 * sc, y + s * sc, z - 1.2 * sc], [x + 2.6 * sc, y + s * sc, z - (2.6 + gape) * sc], .26 * sc, .1, [[236, 230, 210], .15]); };
      const claw = (p, d, len = 3, s = 1) => hand(p, d, len, s);
      if (v === 'orlok') {   // the old one: tall, thin, hunched at the shoulders, a long black coat buttoned to the throat, a bald head, rat's fangs, claws held at the chest
        [1, -1].forEach((s, i) => { const ph = i ? -st : st; S.tube([0, s * 1.6, 20], [ph * 2, s * 1.7, 1], 1.2, .9, [dark, 0]); S.sph(ph * 2 + 1.2, s * 1.7, .6, 2, .8, .6, () => [dark, 0]); });
        S.ell(4, 46, 3.2, 3.6, 3.6, 4.8, (th, z) => [dark, Math.abs(Math.cos(th)) > .97 && Math.floor(z) % 4 === 0 ? .15 : fold(th) * .6], 0, 2.5, 3);
        S.sph(3, 0, 46, 3.8, 5.4, 2.6, () => [dark, .03]);                         // the hunched shoulders
        [1, -1].forEach((s, i) => { const el = [5, s * 4.6, 36], hd = [7, s * 1.6, 40 + (snap && i ? 2 : 0)]; S.tube([3.4, s * 4.4, 45], el, 1.1, 1, [dark, -.04]); S.tube(el, hd, 1, .9, [dark, -.06]); claw(hd, [.4, -s * .2, .7], 3.6, .9); });
        S.tube([4, 0, 47], [5.5, 0, 50], 1, .9, [skin, 0]); vhead([6.6, snap ? .8 : 0, 52.5], 1.1, true);
      } else if (v === 'count') {   // the cloak: a towering high collar, the cape held open on its arms like a bat's wings, the face pale above it, fangs
        [1, -1].forEach((s, i) => { const ph = i ? -st : st; S.tube([0, s * 1.6, 20], [ph * 2, s * 1.7, 1], 1.3, 1, [dark, 0]); S.sph(ph * 2 + 1.2, s * 1.7, .6, 1.8, .8, .6, () => [dark, 0]); });
        S.ell(18, 44, 3, 3.8, 3.2, 4.6, (th, z) => [inner, 0], 0, .5, 2);
        const open = snap ? 1 : .7;
        [1, -1].forEach((s) => { for (let k = 0; k <= 8; k++) { const t = k / 8, sh = [0, s * 4.4, 44], tip = [3 * open - 2 - t * 2, s * (6 + 12 * open * (1 - t * .3)), 44 - t * 40 + (1 - t) * 2]; S.tube(sh, tip, 1.6 - t * .5, .7, [k % 2 ? dark : dark.map(q => q * .85), fold(t * 3)]);
          if (k === 0) { const hd = [3 * open - 2, s * (6 + 12 * open), 46]; S.tube(sh, hd, 1, .9, [dark, 0]); claw(hd, [0, s * .4, .8], 2.6); } } });
        for (let k = 0; k < 9; k++) { const a = -1.2 + k * .3; S.tube([-1 + Math.cos(a) * -.5, Math.sin(a) * 4.6, 44], [-2.5 + Math.cos(a) * -1.2, Math.sin(a) * 6.2, 55], .9, .5, [[90, 14, 20], -.05]); }   // the collar, lined in red
        S.tube([0, 0, 44], [1, 0, 47], 1, .9, [skin, 0]); vhead([2, snap ? .7 : 0, 50], 1.05, false);
      } else if (v === 'feeder') {   // caught feeding: crouched, the jaw open, the fangs long, blood down the chin and the chest; claws spread
        const hip = [-3, 0, 14], sh = [4, 0, 26];
        for (let k = 0; k <= 10; k++) { const t = k / 10; S.sph(hip[0] + (sh[0] - hip[0]) * t, 0, hip[2] + (sh[2] - hip[2]) * t, 4 - t * .4, 4.6 + t * .6, 3.6, (dx, dy, dz) => [dx > .6 && t > .6 && Math.abs(dy) < .4 ? blood : dark, fold(dy * 3 + t)]); }
        S.ell(1, 15, 5.5, 6, 4.4, 5, (th, z) => z < 2 + hs(Math.floor(th * 11), 3) * 5 ? null : [dark, fold(th)], -2, -3, 3);
        [1, -1].forEach((s, i) => { const ph = i ? st : -st, el = [6 + ph, s * 8, 19], hd = [10 + ph * 2, s * 6.5, 10 + (snap && i ? 6 : 0)]; S.tube([sh[0], s * 4.6, sh[2]], el, 1.3, 1.1, [dark, 0]); S.tube(el, hd, 1.1, 1, [dark, -.05]); claw(hd, [.8, s * .3, -.4], 3.4, 1.3); });
        vhead([7.5, snap ? 1 : 0, 30 + (snap ? 2 : 0)], 1.15, false, 1.6);
        S.tube([10, 0, 26], [10.2, 0, 22], .5, .25, [blood, -.1]); S.tube([9.6, .6, 26.4], [9.2, .9, 21], .3, .2, [blood, -.1]);
      } else {   // half bat: wings folded round it like a cloak, the wing's claws hooked over its shoulders; great ears; a bat's crumpled nose above the fangs
        [1, -1].forEach((s, i) => { const ph = i ? -st : st, kn = [1.5 + ph, s * 2.4, 10], ft = [ph * 1.5, s * 2.6, .5]; S.tube([0, s * 2.2, 18], kn, 1.6, 1.1, [dark, 0]); S.tube(kn, ft, 1.1, .7, [dark, 0]); for (let f = -1; f <= 1; f++) S.tube(ft, [ft[0] + 2, ft[1] + f, 0], .3, .12, [skin, 0]); });
        S.ell(12, 46, 4.6, 6, 5, 7.4, (th, z) => [dark, Math.abs(Math.sin(th * 3 + z * .05)) < .1 ? -.22 : Math.abs(Math.cos(th)) > .9 && Math.abs(Math.sin(z * .4)) < .15 ? -.15 : 0], 0, .5, 2);
        for (const s of [-1, 1]) { S.tube([1, s * 5.5, 46], [1.5, s * 6.5, 52], 1, .6, [dark, 0]); for (let f = -1; f <= 1; f++) S.tube([1.5, s * 6.5, 52], [3.5, s * (6 + f * .6), 52.5], .35, .15, [skin, .05]); }
        S.tube([0, 0, 45], [.8, 0, 48], 1.4, 1.3, [dark, 0]); const hc = [2, snap ? .8 : 0, 51 + (snap ? 1 : 0)]; vhead(hc, 1.15, false, .4);
        for (const s of [-1, 1]) S.tube([hc[0] - .6, hc[1] + s * 2.2, hc[2] + 1], [hc[0] - 1.2, hc[1] + s * 5.2, hc[2] + 5.8], 1.3, .2, [skin, -.08]);   // the great ears
        S.sph(hc[0] + 2.6, hc[1], hc[2] - .2, .7, 1, .7, () => [skin.map(q => q * .8), -.1]);
      }
      glow.push([key(skin), .62]);
    } else if (['folded', 'maw', 'twin', 'float'].includes(v)) {
      // redesigns, all in the Hollow's near-black with its pale face (two hollows, a mouth open too wide)
      const dark = [46, 40, 46], st = walk ? Math.sin(T) : 0;
      const pface = (c, tl, sc = 1, mouth = 1) => { const ca = Math.cos(tl), sa = Math.sin(tl);
        S.sph(c[0], c[1], c[2], 1.6 * sc, 2.2 * sc, 2.9 * sc * (mouth > 1 ? 1.25 : 1), (dx, dy, dz) => { if (dx < .1) return null; const ry = dy * ca - dz * sa, rz = dy * sa + dz * ca;
          if (rz < -.2 && rz > -.25 - .55 * mouth && Math.abs(ry) < .55 - (rz + .5) * (rz + .5) * .5 / mouth) return [gum, -.5]; if (rz > .12 && rz < .42 && Math.abs(Math.abs(ry) - .38) < .17) return [[40, 34, 34], -.4]; return [skin, rz > .6 ? .05 : 0]; }); };
      const tube = (p, q, r0, r1) => S.tube(p, q, r0, r1, [dark, 0]);
      if (v === 'folded') {   // too tall to stand in a room: it stands folded in half, its head hanging upside down by its knees, looking at you
        const hip = [-1 + st * .5, 0, 44], shd = [7, 0, 26 + (snap ? 3 : 0)];
        [1, -1].forEach((s, i) => { const ph = i ? -st : st, kn = [-4 + ph * 2, s * 3, 22], ft = [ph * 3, s * 3.2, .5]; tube([hip[0], s * 2.2, hip[2]], kn, 1.6, 1.2); tube(kn, ft, 1.2, .9); S.sph(ft[0] + 1, ft[1], .5, 1.5, .8, .5, () => [dark, 0]); });
        for (let k = 0; k <= 10; k++) { const t = k / 10; S.sph(hip[0] + (shd[0] - hip[0]) * t, 0, hip[2] + (shd[2] - hip[2]) * t + Math.sin(t * 3.14) * 3, 3 - t * .3, 3.6 + t * .5, 2.8, (dx, dy, dz) => [dark, Math.abs(Math.sin(dx * 8 + t * 5)) < .2 && t > .3 ? -.16 : 0]); }
        [1, -1].forEach((s, i) => { const ph = i ? st : -st, el = [shd[0] + 2, s * 5, 13], hd = [shd[0] + 3 + ph * 2, s * 4.5, 1]; tube([shd[0], s * 3.8, shd[2]], el, 1.1, .9); tube(el, hd, .9, .8); hand(hd, [.8, 0, -.3], 2); });
        tube([shd[0] + .5, 0, shd[2] - 2], [shd[0] + 1.5, 0, shd[2] - 7], 1, .9);
        const hc = [shd[0] + 2, snap ? 1.5 : 0, shd[2] - 10]; S.sph(hc[0] - .6, hc[1], hc[2], 2.5, 2.4, 3, () => [dark, 0]); pface([hc[0] + 1.2, hc[1], hc[2]], Math.PI + (snap ? .6 : .1));
      } else if (v === 'maw') {   // a hunched bulk whose face is mostly mouth: the jaw unhinged down to the chest; thin arms, long fingers
        S.ell(14, 36, 6, 6.5, 5, 6, (th, z) => [dark, Math.abs(Math.sin(th * 4 + z * .2)) < .1 ? -.12 : 0], -2, 2, 2);
        [1, -1].forEach((s, i) => { const ph = i ? -st : st, kn = [3 + ph, s * 3.4, 8], ft = [ph * 2, s * 3.4, .5]; tube([0, s * 3, 15], kn, 2, 1.5); tube(kn, ft, 1.5, 1.1); S.sph(ft[0] + 1, ft[1], .5, 1.6, .9, .5, () => [dark, 0]); });
        [1, -1].forEach((s, i) => { const ph = i ? st : -st, el = [4 + ph, s * 7.5, 26], hd = [7 + ph * 2, s * 6.5, 12 + (snap && i ? 8 : 0)]; tube([2, s * 5.5, 33], el, 1.2, 1); tube(el, hd, 1, .8); hand(hd, [.5, 0, -.8], 3.4, 1.4); });
        const hc = [6, snap ? 1 : 0, 38 + (snap ? 2 : 0)]; S.sph(hc[0] - 1.5, hc[1], hc[2] + 1, 3.4, 3.4, 3.4, () => [dark, 0]);
        // the face: two hollows at the top, and beneath them a mouth that runs down onto the chest, rimmed with teeth
        S.sph(hc[0], hc[1], hc[2] - 3, 2.2, 3, 6.5, (dx, dy, dz) => { if (dx < .1) return null; if (dz > .55 && dz < .78 && Math.abs(Math.abs(dy) - .4) < .17) return [[40, 34, 34], -.4];
          if (dz < .48 && dz > -.85 && Math.abs(dy) < .55 - Math.abs(dz + .2) * .35) return Math.abs(dy) > .4 - Math.abs(dz + .2) * .35 && hs(Math.floor(dz * 30), 2) > .4 ? [[220, 214, 196], .1] : [gum, -.6]; return [skin, 0]; });
      } else if (v === 'twin') {   // two hearts, two souls (the old belief): a second body grows backwards out of the first, its own face, its own arms
        [1, -1].forEach((s, i) => { const ph = i ? -st : st, kn = [1 + ph, s * 2.4, 13], ft = [ph * 2, s * 2.6, .5]; tube([0, s * 2, 26], kn, 1.6, 1.2); tube(kn, ft, 1.2, .9); S.sph(ft[0] + 1, ft[1], .5, 1.5, .8, .5, () => [dark, 0]); });
        S.ell(24, 44, 3.4, 4.2, 3, 4.6, (th, z) => [dark, Math.abs(Math.sin(th * 5 + z * .3)) < .1 ? -.14 : 0], 0, .5, 2);
        [1, -1].forEach((s, i) => { const el = [1.5, s * 5.5, 34], hd = [3 + (i ? st : -st), s * 5.5, 22]; tube([.5, s * 4.4, 43], el, 1.1, .9); tube(el, hd, .9, .8); hand(hd, [.3, 0, -.9], 2.4); });
        tube([.5, 0, 44], [1, 0, 47], 1.2, 1.1); S.sph(.6, 0, 50, 2.5, 2.4, 3, () => [dark, 0]); pface([2, 0, 49.8], snap ? -.6 : .15);
        // the other: out of the back, arched over backwards, upside down, reaching behind
        const tw = (t) => [-1 - t * 3, -3 - t * 8, 40 + Math.sin(t * 3) * 7 - t * 8];
        for (let k = 0; k <= 10; k++) { const t = k / 10, c = tw(t); S.sph(c[0], c[1], c[2], 2.6 - t * .5, 2.6 - t * .5, 3 - t * .5, () => [dark, -.04]); }
        const th_ = tw(1), tz = th_[2] - 3 + (snap ? 2 : 0); S.sph(th_[0] + .5, th_[1] - 1, tz, 2.3, 2.2, 2.7, () => [dark, 0]); pface([th_[0] + 1.8, th_[1] - 1, tz - .3], Math.PI - .2 + (snap ? .8 : 0), .95);
        for (const s of [1, -1]) { const b0 = tw(.5), el = [b0[0] + 3 + s * 2, b0[1] - 5, b0[2] - 4], hd = [b0[0] + 6 + s * 3, b0[1] - 7 + st, b0[2] - 14]; tube([b0[0], b0[1], b0[2]], el, 1, .8); tube(el, hd, .8, .7); hand(hd, [.4, -.2, -.8], 2.4); }
      } else {   // the floater: thin, hung in the air with its toes pointing down, arms longer than it is tall dragging their nails, head bowed, looking up
        const lift = 7 + (walk ? Math.sin(T) * .6 : 0) + (snap ? 1 : 0);
        [1, -1].forEach((s) => { tube([0, s * 1.6, lift + 22], [.6, s * 1.4, lift + 10], 1.3, 1); tube([.6, s * 1.4, lift + 10], [-.4, s * 1.2, lift], 1, .5); });
        S.ell(lift + 21, lift + 44, 2.8, 3.6, 2.6, 4.4, (th, z) => [dark, Math.abs(Math.sin(z * 1.1)) < .2 && Math.cos(th) > .3 && z > lift + 32 ? -.16 : 0], 0, .4, 2);
        [1, -1].forEach((s, i) => { const sw = walk ? Math.sin(T + i) * 1.5 : 0, el = [1.5 + sw * .3, s * 8, lift + 30], hd = [3 + sw, s * 10.5, 4]; tube([.4, s * 4.2, lift + 42], el, 1, .8); tube(el, hd, .8, .7); hand(hd, [.2, 0, -1], 3, .8); });
        const hc = [3.5, snap ? 1 : 0, lift + 44.5]; tube([.6, 0, lift + 44], hc, 1.1, 1); S.sph(hc[0] - .4, hc[1], hc[2], 2.5, 2.4, 3, () => [dark, 0]); pface([hc[0] + 1, hc[1], hc[2] - .4], snap ? -1.1 : -.5);
      }
      glow.push([key(skin), .62]);
    } else if (v === 'red') {
      // the gaunt one (the red-haired shape, without the hair): a starved body bent forward from the hips, ribs showing, legs folded under,
      // arms like a spider's, elbows above the shoulders, knuckles on the ground; in the Hollow's colours: near-black, and the Hollow's pale
      // face with its two hollows and a mouth open too wide
      const dark = [46, 40, 46], st = walk ? Math.sin(T) : 0, hip = [-4, 0, 22], sh = [5, 0, 30 + (snap ? 2 : 0)];
      for (let k = 0; k <= 10; k++) { const t = k / 10, c = [hip[0] + (sh[0] - hip[0]) * t, 0, hip[2] + (sh[2] - hip[2]) * t]; S.sph(c[0], 0, c[2], 3.3 - t * .2, 4 + t * .6, 3, (dx, dy, dz) => [dark, Math.abs(Math.sin(dz * 9 + t * 4)) < .2 && t > .4 ? -.18 : 0]); }
      [1, -1].forEach((s, i) => { const ph = i ? -st : st, kn = [2 + ph, s * 3.4, 11], ft = [-4 + ph * 2, s * 3.2, .5]; S.tube([hip[0], s * 2.6, hip[2]], kn, 2, 1.5, [dark, 0]); S.tube(kn, ft, 1.5, 1.1, [dark, -.03]); S.sph(ft[0] + 1, s * 3.2, .6, 1.6, .8, .6, () => [dark, 0]); });
      [1, -1].forEach((s, i) => { const ph = i ? st : -st, a = [sh[0], s * 4.4, sh[2] - 1], el = [sh[0] + 2 + ph * 2, s * 10, sh[2] + 8], hd = [sh[0] + 9 + ph * 3.5, s * 9, 2];
        S.tube(a, el, 1.2, 1, [dark, 0]); S.tube(el, hd, 1, .9, [dark, 0]); hand(hd, [.6, s * .1, -.7], 1.8); });
      const hh = [sh[0] + 4.5, snap ? 1.2 : 0, sh[2] + 4 + (snap ? 2 : 0)], tl = snap ? -.9 : .3, ca = Math.cos(tl), sa = Math.sin(tl);
      S.sph(hh[0], hh[1], hh[2], 2.6, 2.4, 3, () => [dark, 0]);
      S.sph(hh[0] + 1.3, hh[1], hh[2] - .3, 1.6, 2.2, 2.9, (dx, dy, dz) => { if (dx < .1) return null; const ry = dy * ca - dz * sa, rz = dy * sa + dz * ca;
        if (rz < -.25 && rz > -.8 && Math.abs(ry) < .55 - (rz + .5) * (rz + .5) * .8) return [gum, -.5]; if (rz > .12 && rz < .42 && Math.abs(Math.abs(ry) - .38) < .17) return [[40, 34, 34], -.4]; return [skin, rz > .6 ? .05 : 0]; });
      glow.push([key(skin), .62]);
    } else {
      const cloak = [40, 34, 36], rag = [56, 46, 44], face_ = [214, 206, 186], st = walk ? Math.sin(T) : 0, spread = pose === 'idle' ? (frame === 2 ? 1 : .55) : .75;
      // the body: a cloaked hunch on bird's legs; talons
      S.ell(10, 34, 4, 4.6, 3.2, 4.4, (th, z) => [cloak, Math.abs(Math.sin(th * 7 + z * .2)) < .12 ? -.1 : 0], 0, 1, 3);
      [1, -1].forEach((s, i) => { const ph = i ? -st : st, kn = [1.5 + ph, s * 2.2, 6], ft = [ph * 1.5, s * 2.4, .4]; S.tube([0, s * 2, 11], kn, .7, .5, [[90, 80, 60], 0]); S.tube(kn, ft, .5, .4, [[90, 80, 60], 0]);
        for (let f = -1; f <= 1; f++) S.tube(ft, [ft[0] + 2.2, ft[1] + f * 1.1, 0], .3, .12, [[60, 54, 44], .05]); S.tube(ft, [ft[0] - 1.6, ft[1], 0], .3, .12, [[60, 54, 44], .05]); });
      // the wings: the cloak opens into two great rag wings, fingered at the edge
      [1, -1].forEach((s) => { for (let k = 0; k < 7; k++) { const t = k / 6, root = [-1, s * 3.6, 33 - t * 4], tip = [-3 - t * 2, s * (10 + 12 * spread) , 36 + 8 * spread - t * (16 + 6 * (1 - spread))];
        S.tube(root, tip, 1.4 - t * .4, .5, [k % 2 ? rag : cloak, -.05]); const ln = 3 + hs(k, 5) * 4; S.tube(tip, [tip[0] - .5, tip[1] + s * .5, tip[2] - ln], .5, .15, [rag, -.1]); } });
      // the head: a hood with a flat, round, pale owl's face; two wide black eyes, each with a red point; a hooked beak
      const hz = 39 + (snap ? 1.5 : 0), tw = snap ? .7 : 0; S.sph(.5, 0, hz, 4, 4.2, 4.2, (dx, dy, dz) => [cloak, dz > .5 ? .05 : 0]);
      S.sph(3, tw, hz - .3, 1.2, 3.6, 3.8, (dx, dy, dz) => { if (dx < 0) return null; if (Math.hypot(dy - .4, dz - .15) < .32 || Math.hypot(dy + .4, dz - .15) < .32) return [[10, 8, 10], -.6]; return [face_, 0]; });
      for (const s of [-1, 1]) em(4.1, s * 1.45 + tw, hz + .3, .3, eye);
      S.tube([4, tw, hz - .6], [5.3, tw, hz - 2.2], .55, .15, [[70, 60, 40], 0]);
      S.sph(3.4, tw, hz - 3.6, 1, 1.8, 1.3, (dx, dy, dz) => dx < .2 ? null : Math.abs(dz) < .35 ? [[60, 16, 20], -.6] : Math.abs(dz) < .55 ? [[230, 222, 200], .1] : [face_, 0]);   // a man's mouth, under the beak
      glow.push([key(face_), .55]);
    }
    if (v !== 'float') for (let k = 0; k < 9; k++) { const a = hs(k, 7) * 6.28, rr = 3 + hs(k, 9) * 6; S.sph(Math.cos(a) * rr, Math.sin(a) * rr, hs(k, frame + 3) * 2, .5 + hs(k, 2) * .5, .5 + hs(k, 2) * .5, .4, () => [[22, 18, 26], -.3]); }   // its darkness, pooling
    const out = finish(S, EM, glow); cache.set(k0, out); return out; };

  // ---------------------------------------------------------------- the Strigoi's true form, chosen: the Old One
  // Tall and thin, hunched at the shoulders, a long black coat buttoned to the throat, a bald pale head with pointed ears, red eyes,
  // two rat's fangs at the front, claws held up at the chest. In the Hollow's colours, and like the Hollow it changes as it comes:
  // opt.morph 0 is a townsman in a brown coat with his hair and a cap, hands at his sides; 1 is the Old One. On the way he grows
  // (1 to 1.5), the coat goes black, the hair goes, the skin goes pale, the ears grow, the hands come up, the eyes light, the fangs show.
  // opt.jerk: a one-frame head snap while it changes.
  const mixc = (a, b, t) => a.map((q, i) => q + (b[i] - q) * t), sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const oldOne = (face = 0, pose = 'idle', frame = 0, opt = {}) => { frame %= F[pose] || 1; const M = opt.morph == null ? 1 : Math.max(0, Math.min(1, Math.round(opt.morph * 20) / 20)), J = opt.jerk;
    const k0 = 'O' + face + pose + frame + '|' + M + '|' + (J == null ? '' : J.toFixed(2)); if (cache.has(k0)) return cache.get(k0);
    const S = new Surf(300, 330, 150, 290); S.scale(1 + .5 * M); S.face(Math.PI / 4 + face * Math.PI / 4); const EM = [], T = frame / 4 * 6.2832, walk = pose === 'walk', snap = pose === 'idle' && frame === 2 && M >= 1, st = walk ? Math.sin(T) : 0;
    const coat = mixc([96, 74, 56], [46, 40, 46], sm(.1, .7, M)), skin = mixc([190, 150, 120], [176, 168, 150], sm(.3, .8, M)), eye = [255, 70, 50], gum = [70, 20, 24], nail = [120, 110, 90];
    const fold = th => { const f = Math.abs(Math.sin(th * 5 + .7)); return f < .08 ? -.24 : f < .2 ? -.07 : 0; };
    const em = (x, y, z, r, c) => { EM.push([x, y, z]); S.sph(x, y, z, r, r, r, () => [c, 1.6]); };
    const claw = (p, d, len, sp) => { S.sph(p[0], p[1], p[2], .9, .8, .7, () => [skin, 0]); const L = len * (.55 + .45 * M); for (let f = -1.5; f <= 1.5; f++) { const q = [p[0] + d[0] * L, p[1] + d[1] * L + f * .5 * sp, p[2] + d[2] * L - Math.abs(f) * .3]; S.tube([p[0], p[1] + f * .35, p[2]], q, .3, .22, [skin, 0]); if (M > .5) S.tube(q, [q[0] + d[0] * 1.4 * M, q[1] + d[1] * 1.4 * M + f * .15, q[2] + d[2] * 1.4 * M - .6], .2, .1, [nail, .05]); } };
    const hunch = 3 * M, lean = 2.5 * M;
    [1, -1].forEach((s, i) => { const ph = i ? -st : st; S.tube([0, s * 1.6, 20], [ph * 2, s * 1.7, 1], 1.2, .9, [mixc([60, 50, 44], [46, 40, 46], M), 0]); S.sph(ph * 2 + 1.2, s * 1.7, .6, 2, .8, .6, () => [[34, 28, 26], 0]); });
    S.ell(4, 46, 3.2, 3.6, 3.6, 4.8, (th, z) => [coat, Math.abs(Math.cos(th)) > .97 && Math.floor(z) % 4 === 0 ? .15 : fold(th) * .6], 0, lean, 3);
    S.sph(lean + .5 * M, 0, 45 + hunch * .3, 3.6 + .2 * M, 5 + .4 * M, 2 + .6 * M, () => [coat, .03]);
    // the arms: at his sides at first; as he changes they come up and the claws open at his chest
    const up = sm(.35, .85, M);
    [1, -1].forEach((s, i) => { const sw = walk ? (i ? st : -st) * (1 - up) : 0, el = [2 + 3 * up + sw, s * (4.6 - .2 * up), 34 + 2 * up], hd = [3 + 4 * up + sw * 1.5, s * (4.6 - 3 * up), 24 + 16 * up + (snap && i ? 2 : 0)];
      S.tube([lean + .4, s * 4.4, 45], el, 1.1, 1, [coat, -.04]); S.tube(el, hd, 1, .9, [coat, -.06]); claw(hd, up > .5 ? [.4, -s * .2, .7] : [.2, 0, -1], 3.6, .9); });
    // the neck and head
    const hx = lean + 1.5 + 2 * M, hz = 50.5 + 2 * M, hy = (J != null ? J * 2 : 0) + (snap ? .8 : 0), sc = 1 + .1 * M;
    S.tube([lean + 1, 0, 46], [hx - 1.1, hy * .6, hz - 2.5], 1, .9, [skin, 0]);
    S.sph(hx, hy, hz, 2.6 * sc, 2.3 * sc, (3 + .3 * M) * sc, (dx, dy, dz) => [skin, dz > .7 ? .06 : 0]);
    if (M < .6) { const hr = 1 - sm(.2, .6, M); S.sph(hx - .6, hy, hz + 1.2, 2.7 * sc, 2.5 * sc, 2.4 * sc * hr + .1, (dx, dy, dz) => dz > -.1 + (1 - hr) * .9 && dx < .55 ? [[70, 50, 34], 0] : null); if (M < .3) S.ell(hz + 1.6, hz + 3.2, 3, 3, 2.6, 2.6, () => [[60, 52, 40], 0], hx - .4, hx - .4, 2); }
    const ear = sm(.3, .9, M); for (const s of [-1, 1]) S.tube([hx - .4 * sc, hy + s * 2 * sc, hz + .4 * sc], [hx - .4 - 1.2 * ear * sc, hy + s * (2.4 + 1.4 * ear) * sc, hz + (.6 + 2 * ear) * sc], .6 * sc, .12 + .3 * (1 - ear), [skin, -.04]);
    for (const s of [-1, 1]) { if (M > .6) em(hx + 2.1 * sc, hy + s * .9 * sc, hz + .7 * sc, .32 * sc, eye); else S.sph(hx + 2.15 * sc, hy + s * .85 * sc, hz + .7 * sc, .3, .3, .3, () => [[30, 24, 22], -.3]); }
    S.sph(hx + 2.2 * sc, hy, hz - 1.3 * sc, .5 * sc, 1.1 * sc, .25 * sc, (dx) => dx > 0 ? [gum, -.6] : null);
    const fg = sm(.65, 1, M); if (fg > 0) for (const s of [-.18, .18]) S.tube([hx + 2.5 * sc, hy + s * sc, hz - 1.2 * sc], [hx + 2.6 * sc, hy + s * sc, hz - (1.3 + 1.3 * fg) * sc], .26 * sc, .1, [[236, 230, 210], .15]);
    // its darkness, pooling at its feet as it changes
    for (let k = 0; k < 9 * M; k++) { const a = hs(k, 7) * 6.28, rr = 3 + hs(k, 9) * 6; S.sph(Math.cos(a) * rr, Math.sin(a) * rr, hs(k, frame + 3) * 2, .5 + hs(k, 2) * .5, .5 + hs(k, 2) * .5, .4, () => [[22, 18, 26], -.3]); }
    const out = finish(S, EM, M > .5 ? [[key(skin), .62]] : []); cache.set(k0, out); return out; };

  // ---------------------------------------------------------------- the dead that come at the walls
  // v: 'shroud' (a corpse sewn into its winding sheet, knotted at the head, shuffling with its arms pushing out through the cloth)
  //    'pit' (from the lime pit: bone-thin, chalk-white with lime, a rag at the hips, reaching)
  //    'neighbour' (one of the town's own, a week dead, still in his clothes; grey, the head lolled, one shoe)
  const DEADC = [[[120, 90, 60], [70, 74, 84]], [[96, 70, 56], [110, 96, 70]], [[80, 84, 70], [60, 50, 44]], [[140, 120, 90], [90, 60, 50]]];
  const dead = (v = 'shroud', face = 0, pose = 'walk', frame = 0, seed = 0) => { frame %= F[pose] || 1; const k0 = 'D' + v + face + pose + frame + seed; if (cache.has(k0)) return cache.get(k0);
    const S = new Surf(130, 150, 65, 126); S.face(Math.PI / 4 + face * Math.PI / 4); const EM = [], T = frame / 4 * 6.2832 + seed, walk = pose === 'walk', st = walk ? Math.sin(T) : 0, r = (k) => hs(seed * 13 + k, 5);
    const lime = [206, 204, 192], grey = [140, 138, 126], lol = .4 + r(1) * .6, glow = [];
    if (v === 'shroud') {
      const sheet = [178, 168, 144].map(c => c - r(2) * 30), cord = [96, 76, 50];
      S.ell(0, 38, 3.6, 3.8, 3.4, 4.2, (th, z) => { if (Math.abs(z - 4) < .6 || Math.abs(z - 22) < .6) return [cord, -.05]; if (hs(Math.floor(th * 6), Math.floor(z / 4) + seed) > .85) return [[140, 100, 74], -.08]; return [sheet, Math.abs(Math.sin(th * 5 + z * .15)) < .13 ? -.12 : 0]; }, st * .3, 2 + st * .5, 3);
      S.sph(2.8, lol, 40.5, 3, 2.9, 3.4, (dx, dy, dz) => [sheet, dz > .5 ? .05 : 0]); S.tube([2.4, lol, 43.6], [2, lol * 1.3, 46], .9, .3, [cord, 0]);
      for (const s of [-1, 1]) S.tube([2.6, s * 3.6, 31], [6.5 + st * s, s * 3, 31.5 - (seed % 2) * 2], 1.6, 1.4, [sheet, -.03]);   // the arms, out in front, still under the cloth
    } else if (v === 'pit') {
      const hip = [-1, 0, 20]; S.ell(16, 21, 2.6, 3.4, 2.4, 3.2, () => [[110, 98, 80], -.05], -1, -1, 3);
      for (let k = 0; k <= 9; k++) { const t = k / 9; S.sph(-1 + t * 4, 0, 21 + t * 12, 2.4, 3.4 - t * .2, 2, (dx, dy, dz) => [lime, Math.abs(Math.sin(dz * 10 + t * 5)) < .25 && t > .3 ? -.22 : 0]); }
      [1, -1].forEach((s, i) => { const ph = i ? -st : st, kn = [1 + ph * 2, s * 1.8, 10], ft = [-1 + ph * 3, s * 1.9, .5]; S.tube([hip[0], s * 1.6, hip[2]], kn, 1, .8, [lime, 0]); S.tube(kn, ft, .8, .7, [lime, -.03]); S.sph(ft[0] + .8, s * 1.9, .5, 1.3, .6, .5, () => [lime, 0]); });
      [1, -1].forEach((s, i) => { const ph = i ? st : -st, a = [3, s * 3.4, 32], el = [6 + ph, s * 4, 30], hd = [10 + ph * 1.5, s * 3, 31 + (i ? 2 : 0)]; S.tube(a, el, .8, .7, [lime, 0]); S.tube(el, hd, .7, .6, [lime, 0]); S.tube(hd, [hd[0] + 2, hd[1], hd[2] - .5], .4, .2, [lime, 0]); });
      S.sph(4.6, lol * .6, 36.5, 2.2, 2, 2.6, (dx, dy, dz) => { if (dx > .3 && dz > 0 && dz < .5 && Math.abs(Math.abs(dy) - .4) < .2) return [[20, 16, 14], -.6]; if (dx > .4 && dz < -.3 && Math.abs(dy) < .35) return [[40, 30, 26], -.5]; return [lime, 0]; });
      glow.push([key(lime), .5]);
    } else {
      const [shirt, legs] = DEADC[seed % DEADC.length].map(c => c.map(q => q * .8));
      [1, -1].forEach((s, i) => { const ph = i ? -st : st; S.tube([0, s * 1.6, 19], [ph * 2, s * 1.8, 9], 1.6, 1.3, [legs, 0]); S.tube([ph * 2, s * 1.8, 9], [ph * 1.2 - (i ? .6 : 0), s * 1.8, 1], 1.3, 1.1, [legs, -.03]); S.sph(ph * 1.2 + 1, s * 1.8, .8, 1.6, 1, .8, () => [i && seed % 2 ? grey : [40, 34, 30], 0]); });
      S.ell(18, 32, 3, 4, 3.4, 4.6, (th, z) => [shirt, Math.abs(Math.sin(th * 4 + z * .3)) < .1 ? -.12 : 0], 0, .8, 3);
      [1, -1].forEach((s, i) => { const ph = i ? st : -st, el = [1 + ph, s * 5, 25], hd = [i ? 4 : 1 + ph, s * (i ? 4.5 : 5.4), i ? 27 : 17]; S.tube([0, s * 4.2, 31], el, 1.3, 1.1, [shirt, -.03]); S.tube(el, hd, 1, .9, [grey, 0]); S.sph(hd[0], hd[1], hd[2], 1, 1, 1, () => [grey, 0]); });
      S.sph(1.6, lol * 2, 34.5 - lol * 1.2, 2.6, 2.4, 2.8, (dx, dy, dz) => { if (dz > .4) return [[60, 50, 40], 0]; if (dx > .4 && dz > -.1 && dz < .35 && Math.abs(Math.abs(dy) - .4) < .2) return [[30, 24, 22], -.6]; if (dx > .5 && dz < -.35 && Math.abs(dy) < .3) return [[50, 24, 24], -.5]; return [grey, 0]; });
      glow.push([key(grey), .5]);
    }
    const out = finish(S, EM, glow); cache.set(k0, out); return out; };
  window.TKIT = { strigoi, dead, oldOne, F };
})();
