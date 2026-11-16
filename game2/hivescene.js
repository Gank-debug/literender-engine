// Draft: a hive-world map ("The Stack"): a settlement on a steel deck bolted to the face of an endless megastructure,
// with catwalks out over the abyss to salvage platforms. Visual draft only (not wired into the rules).
window.MAPS = window.MAPS || {};
MAPS.hive = { key: 'hive', name: 'The Stack', view: { W: 1240, H: 860, ox: 640, oy: 250 } };
MAPS.hive.scene = function (t = 0, N = 4) {
  const e = ENG({ ...MAPS.hive.view, K: 1, t, N, noVig: 1, noWeather: 1, zt: 1, amb: { in: [.27, .25, .26], out: [.24, .25, .28] }, fog: [30, 34, 34], fogMax: .1 });
  const { S, px, dark, hs, vn, sh, mix, iso, box, light, add, drawAll, ground, smoke, finish, PH, T } = e;
  const inR = (r, x, y) => x >= r[0] && x < r[2] && y >= r[1] && y < r[3];
  const segd = (x, y, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], t2 = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy))); return Math.hypot(x - a[0] - dx * t2, y - a[1] - dy * t2); };
  // ---- the plan
  const DECK = [3, 3, 45, 35], GATE = [21.5, 26.5];
  const SHRINE = [5, 5, 13, 13], MESS = [15, 5, 24, 11], MED = [27, 5, 33, 10.5], POST = [35, 5, 42, 10.5];
  const HABS = [[5, 18], [9.8, 18], [14.6, 18], [5, 25.6], [9.8, 25.6], [14.6, 25.6], [29.4, 18], [34.2, 18], [39, 18], [34.2, 25.6]];
  const PLAT = [{ r: [5, 41, 16, 49], n: 'The Pump Station' }, { r: [30, 40, 41, 48], n: 'The Dead Hab' }, { r: [18, 50, 29, 58], n: 'The Cable Farm' }, { r: [3, 55, 13, 63], n: 'The Sump' }, { r: [33, 54, 44, 63], n: 'The Old Lift' }];
  const WALKS = [[[24, 35], [24, 50]], [[24, 44.5], [15.5, 44.5]], [[24, 43.5], [30.5, 43.5]], [[24, 57.5], [24, 61]], [[24, 61], [12.5, 61]], [[28.5, 56], [33.5, 56]], [[9, 49], [9, 55.5]]];
  // ---- palettes
  const STEEL = [[92, 92, 88], [84, 86, 84], [100, 98, 92]], RUST = [128, 74, 42], GRIME = [46, 44, 40], HAZ = [[196, 160, 40], [30, 28, 26]];
  const plate = (x, y, n) => { const X = x * 1, Y = y * 1, fx = X - Math.floor(X), fy = Y - Math.floor(Y); let c = sh(STEEL[Math.floor(hs(Math.floor(X), Math.floor(Y)) * 3)], .82 + n * .12);
    if (fx < .05 || fy < .05) return sh(c, .55); if ((fx < .14 || fx > .9) && (fy < .14 || fy > .9)) return sh(c, 1.25);
    const dm = ((x * 5 + y * 5) % 1 + 1) % 1, dm2 = ((x * 5 - y * 5) % 1 + 1) % 1; if (dm < .12 && dm2 < .4) c = sh(c, 1.12);
    const r = vn(x * .35 + 3, y * .35); if (r > .58) c = mix(c, sh(RUST, .8 + n * .2), Math.min(.75, (r - .58) * 3)); if (vn(x * .9, y * .9 + 7) > .74) c = mix(c, GRIME, .5); return c; };
  const grate = (x, y, n, rot) => { const a = rot ? y : x, b = rot ? x : y; if (((a * 4) % 1) < .32 || ((b * 1.5) % 1) < .1) return voidC(x, y, n, .6); return sh([86, 84, 78], .7 + n * .15 - (vn(x, y) > .65 ? .15 : 0)); };
  const voidC = (x, y, n, k = 1) => { const d = Math.min(1, Math.max(0, (x + y - 40) / 90)); let c = mix([14, 16, 20], [6, 7, 10], d); const q = hs(Math.floor(x * 4), Math.floor(y * 4)), cl = vn(x * .09 + 11, y * .09); if (cl > .6 && Math.floor(y * 4) % 3 === 0 && Math.floor(x * 4) % 2 === 0 && q > .93 - (cl - .6) * .8 || q > .9985) { S.E = 1; const dim = .45 + (1 - d) * .35; return sh(hs(Math.floor(x * 4) + 1, Math.floor(y * 4)) > .5 ? [220, 150, 70] : [150, 200, 210], dim); }
    if (vn(x * .15 + PH * .05, y * .15) > .6) c = mix(c, [34, 40, 40], .5); return sh(c, k * (.9 + n * .1)); };
  const corr = (seed, base = [104, 104, 98]) => (u, z) => { S.E = 0; let c = sh(base, .78 + Math.sin(u * .9) * .12 + hs(Math.floor(u / 40) + seed, 1) * .1);
    const rs = vn(u / 7 + seed, z / 34); if (rs > .6) c = mix(c, RUST, Math.min(.8, (rs - .6) * 3)); if (z < 5) c = mix(c, GRIME, .55); if (Math.floor(u) % 40 === 0) c = sh(c, .6); return c; };
  const iron = (u, z) => { S.E = 0; const p = Math.floor(u / 24), pz = Math.floor(z / 30); if (u % 24 < 1.2 || z % 30 < 1.2) return [34, 32, 30]; if ((u % 24 < 3 || u % 24 > 21) && z % 6 < 1) return [120, 110, 96];
    let c = sh([66, 62, 58], .8 + hs(p, pz) * .25); const rs = vn(u / 9, z / 22); if (rs > .64) c = mix(c, RUST, (rs - .64) * 2.4); return c; };
  // the megastructure: panels the size of houses, ribs, pipe bundles, rows of tiny lit windows going up into the dark
  const mega = seed => (u, z) => { S.E = 0; const U = u + seed * 300, fade = Math.max(.25, 1 - z / 520);
    const rib = U % 160; if (rib < 14) { const cy = Math.sin(rib / 14 * Math.PI); return sh([70, 68, 64], (.4 + cy * .6) * fade); }
    const pb = U % 160 - 30; if (pb > 0 && pb < 26) { const k = Math.floor(pb / 6.5), f = (pb % 6.5) / 6.5, cy = Math.sin(f * Math.PI); let c = sh([[96, 84, 68], [82, 86, 84], [110, 80, 54], [74, 72, 70]][k], (.35 + cy * .65) * fade); if (z % 90 < 4) c = sh([40, 38, 36], fade); return c; }
    if (z % 120 < 8) return sh(z % 120 < 2 ? [30, 28, 26] : [88, 84, 78], fade);
    const wx = U % 160, wz = z % 120; if (wx > 70 && wx < 150 && wz > 30 && wz < 90 && (Math.floor(wx) % 8 < 4) && (Math.floor(wz) % 10 < 4)) { const on = hs(Math.floor(U / 8) + 5, Math.floor(z / 10)) > .9; if (on) { S.E = 1; return hs(Math.floor(U / 8), Math.floor(z / 10) + 2) > .7 ? [140, 190, 200] : [220, 160, 80]; } return sh([20, 22, 24], fade); }
    if (wx > 62 && wx < 158 && wz > 96 && wz < 112 && Math.floor(wx / 4) % 2) return sh([30, 30, 30], fade);
    let c = sh([70, 68, 64], (.7 + vn(U / 60, z / 40) * .3) * fade); const st = vn(U / 6, z / 60); if (st > .62) c = mix(c, [60, 40, 28], (st - .62) * 2 * fade); return c; };
  // ---- the ground: the deck, the platforms, the catwalks, and the drop
  const { W, H, ox, oy } = MAPS.hive.view, ground2 = fn => { for (let sy = 0; sy < H; sy++) for (let sx = 0; sx < W; sx++) { const dx = sx + .5 - ox, dy = sy + .5 - oy, gx = (dx / 10 + dy / 5) / 2, gy = (dy / 5 - dx / 10) / 2; S.D = -1e9; const r = fn(gx, gy); S.Z = r[1] || 0; S.E = r[2] || 0; if (r[3]) S.D = gx + gy - .5; px(sx, sy, r[0]); } S.E = 0; S.D = -1e9; };
  ground2((x, y) => { S.E = 0; const n = hs(Math.floor(x * 10), Math.floor(y * 10));
    for (const r of [SHRINE, MESS, MED, POST]) if (inR(r, x, y)) { let c;
      if (r === SHRINE) { const X = x / 1.1, Y = y / 1.1 + (Math.floor(X) % 2) * .5; c = ((X % 1) < .08 || (Y % 1) < .08) ? [36, 34, 34] : sh([[72, 66, 64], [64, 60, 58], [80, 72, 66]][Math.floor(hs(Math.floor(X), Math.floor(Y)) * 3)], .85 + n * .15); if (x > 8.3 && x < 9.7 && y > 6.6) c = sh([96, 22, 20], .8 + n * .15); }
      else if (r === MED) { const X = x * 2, Y = y * 2; c = ((X % 1) < .06 || (Y % 1) < .06) ? [70, 84, 80] : sh([164, 176, 170], .7 + n * .1 - (vn(x, y) > .7 ? .2 : 0)); }
      else c = plate(x, y, n); const ao = Math.min(x - r[0], y - r[1]); return [ao < 1 ? sh(c, .6 + ao * .4) : c, 1, 0, 1]; }
    for (const h of HABS) if (inR([h[0], h[1], h[0] + 4, h[1] + 4], x, y)) return [sh(plate(x, y, n), .8), 1, 0, 1];
    if (inR(DECK, x, y)) { let c = plate(x, y, n); const ed = Math.min(x - DECK[0], y - DECK[1], DECK[2] - x, DECK[3] - y); if (ed < .5) { const st = Math.floor((x + y) * 1.6) % 2; c = sh(HAZ[st], .8 + n * .15); }
      if (Math.abs(x - 24) < 2.2 && y > 13 || Math.abs(y - 15.2) < 1.6) c = mix(c, [60, 58, 54], .4); if (Math.abs(x - 24) < .08 && y > 13 && Math.floor(y * 2) % 2) c = [170, 140, 40];
      return [c, 0, 0, 1]; }
    for (const p of PLAT) if (inR(p.r, x, y)) { let c = sh(plate(x, y, n), .9); const ed = Math.min(x - p.r[0], y - p.r[1], p.r[2] - x, p.r[3] - y); if (ed < .4) c = sh(HAZ[Math.floor((x + y) * 1.6) % 2], .7); return [c, 0, 0, 1]; }
    for (const [a, b] of WALKS) { const d = segd(x, y, a, b); if (d < 1) { const rot = Math.abs(b[0] - a[0]) > Math.abs(b[1] - a[1]); if (d > .86) return [[70, 66, 60], 0, 0, 1]; return [grate(x, y, n, rot), 0, 0, 1]; } }
    return [voidC(x, y, n), 0, S.E]; });
  // ---- the underside: the deck is a slab of girders hanging off the wall; the platforms are thinner plates
  const under = k => (u, z) => { S.E = 0; const zz = -z; if (Math.floor(u) % 30 < 2) return sh([40, 38, 34], .9); if (z > 26 || z < 2) return sh([70, 66, 58], .8); const tr = (Math.floor(u + z * 1.5) % 30 < 2 || Math.floor(u - z * 1.5 + 300) % 30 < 2); let c = tr ? sh([84, 78, 66], .8) : sh([28, 28, 30], 1); if (vn(u / 20 + k, z / 10) > .65) c = mix(c, [90, 54, 32], .4); return c; };
  box(DECK[0], DECK[1], -30, DECK[2] - DECK[0], DECK[3] - DECK[1], 30, null, under(1), (u, z) => sh(under(2)(u, z), .7));
  for (const p of PLAT) box(p.r[0], p.r[1], -8, p.r[2] - p.r[0], p.r[3] - p.r[1], 8, null, (u, z) => sh([70, 66, 58], .6 + (Math.floor(u) % 20 < 2 ? -.2 : 0)), (u, z) => sh([70, 66, 58], .45));
  S.D = -1e9;
  // ---- the megastructure behind: north and west faces climbing out of sight; columns rising from the drop
  S.Z = 0; box(-6, -2, -300, 80, 2, 1500, null, mega(1), null); box(-2, -6, -300, 2, 90, 1500, null, null, (u, z) => sh(mega(2)(u, z), .74));
  const column = (x, y, w, k) => add(x + y + w * 2, () => { S.E = 0; const f = (u, z, side) => { const cy = Math.sin(Math.min(1, u / (w * 10)) * Math.PI); let c = sh([54, 52, 50], (.3 + cy * .4) * side); if (z % 140 < 6) c = sh([40, 38, 34], side); if (vn(u / 8 + k, z / 70) > .62) c = mix(c, [90, 56, 34], .5 * side); if (z % 140 > 60 && z % 140 < 64 && u > w * 4 && u < w * 6 && hs(k, Math.floor(z / 140)) > .5) { S.E = 1; return [230, 120, 60]; } return c; };
    box(x, y, -500, w, w, 1400, null, (u, z) => f(u, z, 1), (u, z) => f(u, z, .7)); });
  column(50, 8, 4, 1); column(-1, 46, 5, 2);
  // ---- the deck's edge: railings round the deck and the platforms; the scrap barricade along the south and east
  const rail = (a, b, h = 9) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]); for (let s2 = 0; s2 <= L; s2 += .9) { const x = a[0] + (b[0] - a[0]) * s2 / L, y = a[1] + (b[1] - a[1]) * s2 / L; add(x + y + .1, () => { S.E = 0; box(x - .05, y - .05, 0, .1, .1, h, [120, 116, 104], [96, 92, 84], [70, 68, 62]); box(x - .05, y - .05, h - 1, .95 * (b[0] - a[0]) / L + .1, .95 * (b[1] - a[1]) / L + .1, 1, [140, 120, 50], [120, 100, 40], [96, 80, 30]); }); } };
  for (const p of PLAT) { const r = p.r; rail([r[0], r[1]], [r[2], r[1]]); rail([r[0], r[1]], [r[0], r[3]]); rail([r[0], r[3]], [r[2], r[3]]); rail([r[2], r[1]], [r[2], r[3]]); }
  for (const [a, b] of WALKS) { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L; rail([a[0] + nx * .95, a[1] + ny * .95], [b[0] + nx * .95, b[1] + ny * .95], 7); rail([a[0] - nx * .95, a[1] - ny * .95], [b[0] - nx * .95, b[1] - ny * .95], 7); }
  // the barricade: sheets of plate and corrugated scrap welded up along the south and east of the deck, the bulkhead in the middle
  const sheet = (x, y, w, d, h, k) => add(x + w + y + d, () => { S.E = 0; box(x, y, 0, w, d, h, [80, 76, 70], corr(k, [[104, 104, 98], [96, 88, 76], [112, 100, 82]][k % 3]), (u, z) => sh(corr(k + 5)(u, z), .72)); });
  for (let x = DECK[0]; x < DECK[2]; x += 2.2) if (x + 2.2 < GATE[0] - 1.6 || x > GATE[1] + 1.6) sheet(x, DECK[3] - .5, 2.25, .5, 24 + hs(x, 3) * 14, Math.floor(x));
  for (let y = DECK[1] + 6; y < DECK[3]; y += 2.2) sheet(DECK[2] - .5, y, .5, 2.25, 24 + hs(y, 5) * 14, Math.floor(y) + 3);
  for (const [x, y] of [[GATE[0] - 2.2, 34.2], [GATE[1] + .2, 34.2], [44.2, 10.5]]) light(x + 1, y, 60, 50, .6, [1.2, .25, .2]);
  // the bulkhead: two great hazard-striped pillars and a lintel with a blast door hauled up into it
  const pillar = (x) => add(x + 2 + DECK[3] + 1, () => { S.E = 0; const hz = (u, z) => { if (z > 16 && z < 46) return sh(HAZ[((Math.floor((u + z) / 7) % 2) + 2) % 2], .85); if (z > 86 && z < 90 && u > 4 && u < 14) { S.E = 1; return [255, 70, 50]; } return iron(u, z); };
    box(x, DECK[3] - 1, 0, 1.6, 1.4, 100, [70, 66, 60], hz, (u, z) => sh(hz(u, z), .7)); });
  pillar(GATE[0] - 1.6); pillar(GATE[1]);
  add(GATE[1] + 1.6 + DECK[3] + .5, () => { S.E = 0; box(GATE[0] - 1.6, DECK[3] - 1, 84, GATE[1] - GATE[0] + 3.2, 1.4, 22, [60, 56, 52], (u, z) => { if (z < 6) return sh(HAZ[((Math.floor((u - z) / 6) % 2) + 2) % 2], .8); return iron(u, z); }, (u, z) => sh(iron(u, z), .7)); });
  drawAll();
  // ---- the shrine: iron walls with pointed niches full of skulls and candles, a red runner to the altar, a great gear on the wall
  const niches = (u, z) => { S.E = 0; const k = Math.floor(u / 16), m = u % 16; if (z > 14 && z < 44 && m > 3 && m < 13) { const top = 34 + (1 - Math.abs(m - 8) / 5) * 10; if (z < top) { if (z < 22 && z > 16 && (m > 5 && m < 11)) return (Math.floor(m) + Math.floor(z)) % 3 ? [196, 186, 160] : [60, 54, 46]; return sh([24, 22, 22], 1); } if (z < top + 2) return [130, 116, 90]; } return iron(u, z); };
  box(SHRINE[0] - .4, SHRINE[1] - .4, 0, SHRINE[2] - SHRINE[0] + .4, .4, 70, [40, 36, 34], niches, null); box(SHRINE[0] - .4, SHRINE[1] - .4, 0, .4, SHRINE[3] - SHRINE[1] + .4, 70, [40, 36, 34], null, (u, z) => sh(niches(u, z), .74));
  // the gear: drawn on the back wall
  add(9.5, () => { const [cx, cy] = iso(9, SHRINE[1], 56); S.E = 0; for (let a = 0; a < 6.283; a += .02) for (let r = 0; r < 15; r++) { const tooth = Math.floor(a / 6.283 * 12) % 2, R = 11 + tooth * 4; if (r > R || r < 5 && r > 3) continue; px(cx + Math.cos(a) * r, cy + Math.sin(a) * r * .9, r < 3 ? [40, 34, 28] : sh([150, 120, 60], .6 + (r / 15) * .4)); } });
  for (const [x, y, z] of [[6, 5.6, 22], [7.4, 5.6, 22], [10.8, 5.6, 22], [12.2, 5.6, 22], [5.6, 7.2, 22], [5.6, 9.6, 22], [8.3, 6.4, 12], [9.7, 6.4, 12]]) e.candle(x, y, z, 50, .85);
  e.B(8, 6.2, 0, 2, 1, 12, [80, 70, 62]);
  for (let k = 0; k < 4; k++) { e.B(6.4 + 0, 8 + k * 1.2, 0, 1.6, .4, 5, [70, 56, 44]); e.B(10, 8 + k * 1.2, 0, 1.6, .4, 5, [70, 56, 44]); }
  // ---- the mess: long steel tables, a ration vat with a pipe from above, cold strip-lights
  const tubeW = (u, z) => { S.E = 0; if (z > 48 && z < 51 && u % 40 > 6 && u % 40 < 34) { S.E = 1; return [180, 220, 230]; } return corr(7, [96, 98, 96])(u, z); };
  box(MESS[0] - .4, MESS[1] - .4, 0, MESS[2] - MESS[0] + .4, .4, 60, [40, 36, 34], tubeW, null); box(MESS[0] - .4, MESS[1] - .4, 0, .4, MESS[3] - MESS[1] + .4, 60, [40, 36, 34], null, (u, z) => sh(tubeW(u, z), .74));
  light(19.5, 5.4, 50, 120, .9, [.75, .95, 1.1]);
  for (let k = 0; k < 2; k++) { e.B(16.5, 7.4 + k * 2, 0, 5.4, .9, 7, [120, 120, 116]); }
  e.B(22.2, 5.6, 0, 1.4, 1.4, 22, [110, 96, 70]); e.B(22.7, 6.1, 22, .4, .4, 400, [80, 76, 70]);
  // ---- the medicae: white tile gone grey, green light, a cot, a cabinet
  const tileW = (u, z) => { S.E = 0; if (u % 8 < .8 || z % 8 < .8) return [90, 104, 100]; let c = sh([170, 182, 176], .7 + hs(Math.floor(u / 8), Math.floor(z / 8)) * .15); if (vn(u / 10, z / 20) > .64) c = mix(c, [110, 120, 70], .4); return c; };
  box(MED[0] - .4, MED[1] - .4, 0, MED[2] - MED[0] + .4, .4, 50, [40, 36, 34], tileW, null); box(MED[0] - .4, MED[1] - .4, 0, .4, MED[3] - MED[1] + .4, 50, [40, 36, 34], null, (u, z) => sh(tileW(u, z), .74));
  light(30, 7, 40, 90, 1, [.45, 1.15, .7], .3); e.B(28, 7.2, 0, 2.4, 1, 6, [180, 186, 180]); e.B(31.4, 5.3, 0, 1.2, .7, 20, [120, 130, 126]);
  // ---- the wardens' post: a cage of mesh, a desk, a lockbox, a red lamp
  const meshW = (u, z) => { S.E = 0; if (z > 10 && z < 44 && (Math.floor(u + z) % 4 === 0 || Math.floor(u - z + 400) % 4 === 0)) return [110, 108, 100]; if (z > 10 && z < 44) return [26, 26, 28]; return iron(u, z); };
  box(POST[0] - .4, POST[1] - .4, 0, POST[2] - POST[0] + .4, .4, 50, [40, 36, 34], meshW, null); box(POST[0] - .4, POST[1] - .4, 0, .4, POST[3] - POST[1] + .4, 50, [40, 36, 34], null, (u, z) => sh(meshW(u, z), .74));
  light(38.5, 6, 40, 70, .8, [1.2, .3, .25]); e.B(36.4, 7.6, 0, 2.6, 1.1, 7, [90, 80, 64]); e.B(40.2, 5.4, 0, 1.2, 1.2, 14, [70, 72, 70]);
  // front walls of the four (low, so you see in): steel plate kerbs
  for (const r of [SHRINE, MESS, MED, POST]) { const dw = (r[0] + r[2]) / 2; e.B(r[0], r[3] - .4, 0, dw - 1 - r[0], .4, 10, [90, 86, 80]); e.B(dw + 1, r[3] - .4, 0, r[2] - dw - 1, .4, 10, [90, 86, 80]); e.B(r[2] - .4, r[1], 0, .4, r[3] - r[1], 10, [90, 86, 80]); }
  drawAll();
  // ---- the hab-cells: closed steel containers, a hatch, a lit slot, some with a second box welded on top and a ladder up
  HABS.forEach((h, i) => { const [x, y] = h, lit = hs(i, 9) < .65, two = i === 0 || i === 2 || i === 7 || i === 4;
    const front = (u, z) => { S.E = 0; if (u > 13 && u < 27 && z < 24) { if (u < 14.5 || u > 25.5 || z > 22.5) return [40, 38, 36]; return sh([84, 80, 72], .8 + (Math.floor(z / 4) % 2) * .08); } if (u > 30 && u < 38 && z > 14 && z < 18) { if (lit) { S.E = 1; return [240, 170, 90]; } return [24, 24, 26]; } if (u > 2 && u < 10 && z > 12 && z < 22) { const s2 = String(10 + i); return Math.floor(u) % 4 === 0 && Math.floor(z) % 3 ? [210, 200, 170] : corr(i)(u, z); } return corr(i)(u, z); };
    const side = (u, z) => sh(corr(i + 20)(u, z), .7);
    add(x + y + 8, () => { S.E = 0; box(x, y, 0, 4, 4, 26, (u, v) => sh([90, 88, 82], .8 + (Math.floor(u / 5) % 2) * .06), front, side);
      if (two) { box(x + .3, y + .2, 26, 3.6, 3.4, 22, (u, v) => sh([88, 86, 80], .8), (u, z) => (u > 24 && u < 31 && z > 8 && z < 12) ? (S.E = 1, [240, 170, 90]) : corr(i + 40)(u, z), (u, z) => sh(corr(i + 41)(u, z), .7));
        for (let z = 0; z < 26; z += 3) box(x + 4, y + 3.4, z, .1, .5, 1, [150, 140, 110], [130, 120, 90], [100, 90, 70]); box(x + 4, y + 3.3, 0, .06, .06, 48, null, [120, 110, 90], [100, 90, 70]); box(x + 4, y + 3.9, 0, .06, .06, 48, null, [120, 110, 90], [100, 90, 70]); }
      else { box(x + .6, y + .6, 26, 1.2, 1.2, 8, [100, 90, 74], sh([110, 96, 72], .8), sh([110, 96, 72], .6)); }
      if (i % 3 === 1) { const [sx, sy] = iso(x + 3.2, y + .8, two ? 60 : 30); smoke(sx, sy, 22, [80, 84, 80], i); } });
    if (lit) light(x + 3.4, y + 4.6, 14, 30, .5); });
  // ---- the concourse: the reclaimer (the town's well), pipes going up into the dark; the scrap workshop; a burn barrel; the hook
  add(24 + 21, () => { S.E = 0; box(23, 20, 0, 2, 2, 30, [90, 86, 76], (u, z) => { if (z > 20 && z < 24 && u > 4 && u < 16) { S.E = 1; return [120, 200, 190]; } return iron(u, z); }, (u, z) => sh(iron(u, z), .7));
    for (const [px2, py2, w] of [[23.3, 20.3, .5], [24.3, 20.5, .4], [23.6, 21.3, .35]]) box(px2, py2, 30, w, w, 600, null, (u, z) => sh([96, 90, 80], .5 + Math.sin(u / (w * 10) * Math.PI) * .45 - (z % 100 < 3 ? .2 : 0)), (u, z) => sh([96, 90, 80], .4 + Math.sin(u / (w * 10) * Math.PI) * .3)); });
  light(24, 21, 28, 70, .8, [.6, 1.1, 1.05], 0, .15);
  // the workshop: a frame of girders under a tarp, scrap and plate stacked, a welding glow
  for (const [x, y] of [[29, 26], [33, 26], [29, 29.4], [33, 29.4]]) e.B(x, y, 0, .3, .3, 30, [80, 74, 62]);
  add(33.3 + 29.7, () => { S.E = 0; box(28.8, 25.8, 30, 4.8, 4, 2, [96, 70, 50], [80, 60, 44], [70, 50, 36]); });
  for (let k = 0; k < 6; k++) e.B(29.6 + hs(k, 1) * 2.4, 27 + hs(k, 2) * 1.6, (k >> 1) * 2.4, 1 + hs(k, 3), .7, 2.4, [[110, 104, 96], [120, 80, 50], [90, 92, 90]][k % 3]);
  light(31, 27.6, 20, 46, .9, [.9, 1, 1.3], .5);
  // the burn barrel and the hook
  e.B(19.4, 30, 0, 1, 1, 9, [90, 60, 40]); light(19.9, 30.5, 12, 70, 1.1, [1.2, .7, .35], .3); add(19.9 + 30.5 + 1, () => { const [sx, sy] = iso(19.9, 30.5, 10); e.flame(sx, sy); e.flame(sx + 2, sy - 1); e.flame(sx - 2, sy); smoke(sx, sy - 4, 30, [70, 66, 60], 2); });
  e.B(27, 31.4, 0, .3, .3, 44, [70, 66, 60]); e.B(27, 31.4, 42, 2.2, .3, 2, [70, 66, 60]); add(29.2 + 31.7, () => { const [sx, sy] = iso(29, 31.55, 42); for (let j = 0; j < 22; j++) px(sx + (j % 2), sy + j, [120, 116, 104]); for (let j = 0; j < 4; j++) px(sx + 2 - j * .5, sy + 22 + j, [160, 150, 130]); });
  // sodium lamps on posts down the street, a hanging cable here and there
  for (const [x, y] of [[21.6, 14], [26.4, 14], [21.6, 24.4], [26.4, 24.4], [21.6, 32], [26.4, 32], [12.6, 16.6], [35.4, 16.6]]) e.lamp(x, y, 80, .8, [1.25, .72, .32]);
  drawAll();
  // ---- the platforms out over the drop: salvage, each with its own look
  // the pump station: three tanks and a pipe run
  for (const [x, y, r] of [[6.5, 42.5, 2.4], [9.5, 42.5, 2.4], [12.5, 42.5, 2.4]]) add(x + y + r * 2, () => { S.E = 0; box(x, y, 0, r, r, 34, [110, 100, 80], (u, z) => sh(z % 10 < 1 ? [60, 56, 50] : [118, 104, 78], .5 + Math.sin(u / (r * 10) * Math.PI) * .45), (u, z) => sh([118, 104, 78], .4 + Math.sin(u / (r * 10) * Math.PI) * .3)); });
  e.B(6, 46.5, 6, 9, .6, .6, [96, 90, 80]); light(11, 46, 30, 70, .7, [1.2, .72, .32]);
  // the dead hab: two burst containers, one fallen on its side, a dark stain
  e.B(31, 41, 0, 4, 4, 20, null, (u, v) => sh([80, 70, 60], .7), (u, z) => (u > 10 && u < 28 && z > 4 && z < 18) ? [16, 16, 18] : sh(corr(3)(u, z), .8), (u, z) => sh(corr(4)(u, z), .6));
  e.B(36, 44, 0, 4, 2.4, 14, [90, 84, 76]); light(36, 44, 20, 50, .45, [1.1, .9, .7]);
  // the cable farm: cables in hanks hanging from the dark above, a winch
  for (let k = 0; k < 9; k++) { const x = 19 + hs(k, 1) * 9, y = 51 + hs(k, 2) * 6; add(x + y + .2, () => { const [sx, sy] = iso(x, y, 4 + hs(k, 4) * 10); S.E = 0; for (let j = 0; j < 200; j++) { px(sx + Math.sin(j / 40 + k) * 1.4, sy - j, sh([60, 56, 50], .9 - j / 240)); } }); }
  e.B(24.5, 54, 0, 2, 1.4, 10, [120, 100, 50]); light(23, 54, 30, 70, .6, [.8, .9, 1.1]);
  // the sump: a pool of green waste glowing up out of a grille
  add(3 + 55, () => {}); light(8, 59, 6, 110, 1.1, [.5, 1.2, .4], .1, .25);
  for (let y = 56.6; y < 61.6; y += .2) for (let x = 4.6; x < 11.4; x += .2) { const [sx, sy] = iso(x, y); const w = Math.sin(x * 2 + y * 1.4 + PH) * .5 + .5; S.D = x + y - 2; S.E = 1; px(sx, sy, mix([60, 150, 40], [150, 230, 90], w * hs(Math.floor(x * 5), Math.floor(y * 5)))); px(sx + 1, sy, mix([40, 110, 30], [120, 200, 70], w)); }
  S.E = 0; S.D = -1e9;
  // the old lift: a cage on chains, the shaft rising out of sight
  add(38 + 58 + 3, () => { S.E = 0; const f = (u, z) => (Math.floor(u) % 5 === 0 || Math.floor(z) % 6 === 0) ? [120, 110, 90] : null; box(36.5, 56.5, 0, 3, 3, 30, (u, v) => sh([80, 76, 70], .8), (u, z) => f(u, z) || [20, 20, 22], (u, z) => f(u, z) ? sh(f(u, z), .7) : [16, 16, 18]);
    for (const [cx, cy] of [[36.6, 56.6], [39.4, 56.6], [36.6, 59.4]]) box(cx, cy, 30, .1, .1, 800, null, [110, 104, 90], [90, 84, 70]); });
  light(38, 58, 32, 70, .7, [1.2, .6, .3], .2);
  drawAll();
  // the names of the places, faint, for the draft
  return { canvas: finish(), e };
};
