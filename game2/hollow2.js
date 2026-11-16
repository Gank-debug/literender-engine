  // ---- Empty Habit design variants (drafts). opt.v: habit | shroud | patch | wick | spill | lolled
  const hollow2 = (face = 0, pose = 'idle', frame = 0, opt = {}) => { frame %= HF[pose] || 1; const v = opt.v || 'habit', style = opt.style || 'clay', key = 'HV' + v + face + pose + frame + style + JSON.stringify(opt.patches || ''); const hit = cache.get(key); if (hit) return hit;
    const S = new Surf(140, 150, 70, 130); S.face(Math.PI / 4 + face * Math.PI / 4);
    const rb = opt.robe || (v === 'wick' ? [52, 42, 40] : v === 'shroud' ? [70, 64, 60] : [44, 38, 46]), inner = [10, 7, 10], ht = v === 'lolled' ? 1.4 : 1.32, SH = 7.2, WD = v === 'lolled' ? 1.05 : v === 'shroud' ? 1.2 : 1.28, T = frame / (HF[pose] || 1) * 6.2832;
    const hunch = v === 'shroud' ? 2.6 : 0, lift = v === 'lolled' ? 9 + Math.sin(T) * .6 : 3.2 + (pose === 'idle' ? frame * .9 : Math.sin(T) * .5), sway = pose === 'walk' ? Math.sin(T + 1) * 1.4 : v === 'lolled' ? Math.sin(T) * 1.2 : 0, lean = (pose === 'walk' ? .9 : pose === 'reach' ? 1.2 : 0) + hunch * .5;
    const Z = z => z * ht + lift, W0 = Z(30), U = z => W0 + (z - 30) * ht;
    const fold = th => { const f = Math.abs(Math.sin(th * 5 + .7)); return f < .08 ? -.24 : f < .2 ? -.07 : 0; };
    // material per variant
    const P = opt.patches || [[150, 40, 34], [60, 120, 70], [170, 140, 60], [90, 70, 140], [130, 130, 130]];
    const cloth = (th, z) => {
      if (v === 'patch') { const i = Math.floor((th + .3) / 6.2832 * 5) % 5, j = Math.floor((z - Z(-6)) / 7), pi = (i + j * 2) % (P.length + 2), c = pi < P.length ? P[pi] : rb, uth = ((th + .3) / 6.2832 * 5) % 1, uz = ((z - Z(-6)) / 7) % 1;
        if (uth < .05 || uz < .07) return [[30, 22, 20], .1]; if ((uth < .12 || uz < .14) && Math.floor(z * 2.5 + th * 9) % 2) return [[196, 180, 150], .1]; return [c.map(q => q * .72), fold(th)]; }
      if (v === 'wick') { const scorch = Math.max(0, 1 - (z - Z(-6)) / 14); if (scorch > .3 && hs(Math.floor(th * 30), Math.floor(z * 2)) < .06) return [[255, 120, 40], 1.2];
        if (Math.cos(th) > .55 && hs(Math.floor(th * 14), 5) < .5 && z > W0 - 8 - hs(Math.floor(th * 14), 9) * 14) return [[226, 214, 186], .05];   // wax run down the front
        return [rb.map(q => q * (1 - scorch * .7)), fold(th) - scorch * .2]; }
      return [rb, fold(th)]; };
    // robe body
    const hemZ = v === 'lolled' ? Z(2) : Z(-6), hemA = v === 'lolled' ? 1.6 : 4.6 * WD, hemB = v === 'lolled' ? 1.8 : 5.4 * WD;
    S.ell(hemZ, W0, hemA, hemB, 3.4 * WD, 4.2 * WD, (th, z) => { const r = hs(Math.floor(th * 11 + (pose === 'walk' ? frame * 2 : 0)), 3); if (v !== 'lolled' && z < Z(4) && z < Z(-3) + r * (v === 'shroud' ? 12 : 7)) return null; return cloth(th, z); }, sway * .2 + hunch * .2, lean * .3, 3);
    S.ell(W0, U(41.6), 3.4 * WD, 4.2 * WD, 3.7 * WD, SH - .5, (th, z) => cloth(th, z), lean * .3, lean, 3.5);
    S.ell(U(41.6), U(43.6), 3.7 * WD, SH - .5, 1.8 * WD, 2 * WD, (th, z) => cloth(th, z), lean, lean, 3);
    if (v !== 'patch') S.ell(W0 - .2, W0 + .8, 3.45 * WD, 4.25 * WD, 3.45 * WD, 4.25 * WD, () => [[88, 72, 52], 0], lean * .3, lean * .3, 3);
    // shroud: long strips hanging off the whole body
    if (v === 'shroud') for (let k = 0; k < 16; k++) { const th = hs(k, 1) * 6.2832, z0 = Z(8 + hs(k, 2) * 26), len = 10 + hs(k, 3) * 16, r = 4.4 * WD, flap = Math.sin(T + k) * (pose === 'walk' ? 1.2 : .4);
      S.tube([Math.cos(th) * r + hunch * .2, Math.sin(th) * r, z0], [Math.cos(th) * (r + 1) - 1 - flap, Math.sin(th) * (r + 1), Math.max(Z(-9), z0 - len)], .55, .35, [rb.map(q => q * .85), -.05]); }
    // hood
    const lol = v === 'lolled' ? 1 : 0, hz = U(50.5) - hunch * 1.6 - lol * 3.2, hx = lean + .4 + hunch * .9, hy = lol * 3.4;
    S.sph(hx - .6, hy, hz + .4, 3.6 * 1.12, 3.3 * 1.08, 4.3 * 1.14, (dx, dy, dz) => { if (dx > .42 && dz < .62 && dz > -.78 && Math.abs(dy) < .78 && v !== 'shroud') return [inner, -.6]; if (v === 'shroud' && dx > .55 && dz < .2) return [inner, -.6]; return cloth(dx * 3, hz); });
    if (v === 'shroud') S.tube([hx + 1.8, 0, hz + 1.2], [hx + 4.6, 0, hz - 1.6], 1.8, .6, [rb, .02]);   // the cowl droops forward like a beak
    else if (!lol) { S.ell(U(42), hz + 3.2, 3.6 * WD, SH - .6, 2.2, 2.4, (th) => Math.cos(th) > .2 ? null : [rb, .02], hx - 1.6, hx - 1.3, 2.4); S.tube([hx - 2.2, 0, hz + 3.4], [hx - 3.6, 0, hz + 6.2], 1.5, .5, [rb, .04]); }
    S.ell(U(41.2), U(46), 3.9 * WD, SH - .3, 2.4 * WD, 2.8 * WD, (th, z) => (z > U(44) && (th < .7 || th > 5.58)) ? null : cloth(th, z), lean, lean, 2.6);
    const fx = hx - .6 + 3.6 * 1.12 * .93;
    if (v === 'wick') { const fl = Math.sin(T * 2) * .25; S.sph(fx - .6, hy, hz - .3, .55, .55, .8 + fl, () => [[255, 250, 220], 2]); S.sph(fx - .6, hy, hz + .7 + fl, .35, .35, .9, () => [[255, 170, 60], 2]); S.sph(fx - .7, hy, hz - 1.4, .4, .4, .6, () => [[230, 220, 196], .3]);
      for (let k = 0; k < 6; k++) S.sph(hx - 1 + hs(k, 4) * 2 + Math.sin(T + k) * .5, hy + (hs(k, 6) - .5) * 3, hz + 5 + k * 1.6, .5, .5, .5, () => [[60, 56, 64], -.2]); }   // smoke from the crown
    else if (v !== 'shroud') for (const s of [-1, 1]) S.sph(fx, hy + s * 1.05, hz - .1, .5, .5, .5, () => [[255, 150, 70], 1.5]);
    else for (const s of [-1, 1]) S.sph(hx + 3.2, s * .8, hz - 1.2, .4, .4, .4, () => [[255, 150, 70], 1.5]);
    // sleeves
    const drag = v === 'shroud' ? 1 : 0, hang = [.2, SH + .4, 32, .8 + drag * 2, SH + .2, drag ? 6 : 23.5];
    const A = pose === 'reach' ? [[3.4, SH - .2, 41, 8.6 + frame * .8, SH - 1.6, 43.5 + frame], [3.4, SH - .2, 41, 8.2 + frame * .6, -(SH - 3.2), 42.5]] : pose === 'walk' ? [[-1 - sway * .3, SH + .5, 32, -1.6 - sway * .6, SH + .6, drag ? 8 : 24], [1 + sway * .3, SH + .5, 32, 1.4 + sway * .6, SH + .6, drag ? 8 : 24]] : lol ? [[.2, SH + .2, 30, .4 + Math.sin(T) * .6, SH, 18], [.2, SH + .2, 30, .4 - Math.sin(T) * .6, SH, 18]] : [hang, hang];
    [1, -1].forEach((s, i) => { const a = A[i], sh0 = [lean + .2, s * (SH - .4), U(41.4)], el = [a[0] + lean, s * a[1], U(a[2])], hd = [a[3] + lean, s * a[4], U(a[5])];
      S.tube(sh0, el, 1.9, 2, [rb, -.04]); S.tube(el, hd, 2, 2.9, cloth(i * 3, U(a[5])));
      const dir = [hd[0] - el[0], hd[1] - el[1], hd[2] - el[2]], n = Math.hypot(...dir); S.sph(hd[0] + dir[0] / n * .5, hd[1] + dir[1] / n * .5, hd[2] + dir[2] / n * .5, 2.2, 2.2, 2.2, () => [inner, -.7]);
      if (v === 'spill') { // the dark pours out of the cuffs and runs to the floor
        let p = [hd[0] + dir[0] / n, hd[1] + dir[1] / n, hd[2] + dir[2] / n]; const steps = 14; for (let k = 1; k <= steps; k++) { const t = k / steps, q = [p[0] + Math.sin(T + k * .7 + i) * .5 + t * 1.2, p[1] + s * t * 1.5, p[2] - (p[2] - .2) * (1 / (steps - k + 1))]; S.tube(p, q, .9 - t * .4, .9 - t * .4, [inner, -.6]); p = q; } } });
    if (v === 'spill') { S.disk(sway * .2, 0, .15, 7 + Math.sin(T) * .4, [inner, -.5]); S.disk(3.5, 4, .2, 2.5, [inner, -.5]);   // a black pool under it
      S.tube([fx, 0, hz - 2], [fx + .6 + Math.sin(T) * .3, 0, hz - 9 - frame], .6, .3, [inner, -.6]); }   // and it drips from the hood
    else if (v !== 'lolled') for (let k = 0; k < 14; k++) { const a = hs(k, 7) * 6.28, r = 2 + hs(k, 9) * 4.5, zz = Z(-6) - 1 - hs(k, frame + 3) * (lift + 2); S.sph(Math.cos(a) * r + sway * .3, Math.sin(a) * r, zz, .5 + hs(k, 2) * .5, .5 + hs(k, 2) * .5, .45, () => [v === 'wick' ? [80, 70, 64] : [34, 30, 40], -.3]); }
    if (v === 'lolled') S.tube([sway * .2, 0, Z(2)], [sway * .4, 0, Z(-1)], .5, .1, [rb, -.1]);   // the hem narrows to a point and turns slowly
    S.paint(style);
    const F = finish(S, 1, false); let x0 = F.w, y0 = F.h, x1 = -1, y1 = -1; for (let j = 0; j < F.h; j++) for (let i = 0; i < F.w; i++) if (F.c[(j * F.w + i) * 4 + 3]) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
    if (x1 < 0) { x0 = y0 = x1 = y1 = 0; } const cw = x1 - x0 + 1, ch = y1 - y0 + 1, cd = new Uint8ClampedArray(cw * ch * 4); for (let j = 0; j < ch; j++) cd.set(F.c.subarray(((j + y0) * F.w + x0) * 4, ((j + y0) * F.w + x0 + cw) * 4), j * cw * 4);
    const out = { w: cw, h: ch, ox: -F.ax + x0, oy: -F.ay + y0, data: cd }; cache.set(key, out); return out; };
