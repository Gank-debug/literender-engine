fonts=open('../drafts/fonts.css').read()+'\n'+open('../fontfix/fix25.css').read()
js='\n'.join(open(f).read() for f in ['data.js','folk.js','combat.js','extra.js','lib.js','world.js','map.js','rules.js','skirmish.js','zig.js','ui.js','cover.js','net.js','musicdata.js','music.js'])
tr=open('../tryst/trystero.iife.js').read()
import json
hol=''   # The Hollow Brother is its own game now (hollow.html); the shelf no longer carries it
esc=lambda t: t.replace('</script>','<\\/script>')
s=open('shell.html').read().replace('<script>/*JS*/</script>','<script>'+esc(tr)+'</script>\n<script>/*JS*/</script>').replace('/*FONTS*/',fonts).replace('/*JS*/',esc(js))
open('crown7-artifact.html','w').write(s)
i=s.index('<script>document.body'); full='<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'+s[:i]+'</head><body>\n'+s[i:]+'\n</body></html>'
open('crown7.html','w').write(full); print(len(full))
