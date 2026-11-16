import sys
fonts=open('../drafts/fonts.css').read()
js='\n'.join(open(f).read() for f in ['data.js','folk.js','combat.js','lib.js','world.js','map.js','rules.js','ui.js'])
s=open('shell.html').read().replace('/*FONTS*/',fonts).replace('/*JS*/',js.replace('</script>','<\\/script>'))
open('hearthland.html','w').write(s); print(len(s))
