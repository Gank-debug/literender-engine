import json,sys
s=json.load(open('doc.json'))['content']
s=s.replace("# Game 2: design draft v0.1 (not built)","# Game 2: design draft v0.2 (not built)")
s=s.replace("- **Players:** designed around 6","- **The hidden killer is not called a demon.** Placeholder term: \"the Enemy\" (each setting has its own name for it). GANK is keeping the three per-setting Enemies for now.\n- **Days are timed:** a dusk bell on a timer, with a Ready button that shortens it.\n- **Art:** draft with Civ Sim sprites and also try new styles.\n- **Players:** designed around 6")
for a,b in [("1 minion, 1 demon","1 minion, 1 Enemy"),("The demon and minion know each other. The demon is told","The Enemy and the minion know each other. The Enemy is told"),("the demon acts","the Enemy acts"),("execute the demon","execute the Enemy"),("from the demon","from the Enemy"),("### Demons: one kind per setting","### The Enemy: one kind per setting"),("role names and demon","role names and Enemy")]:
    assert a in s,a; s=s.replace(a,b)
i=s.index("## Open questions")
s=s[:i]+"""## Art drafts (monastery)
Four sketches of the same eight rooms:
- **Civ Sim:** the existing sprites on snow, rooms as buildings round a courtyard, paths to the cloister.
- **Woodcut:** parchment, ink outlines, hatched shadows, red initial letters.
- **Stained glass:** each room a leaded pane of coloured glass on black.
- **Cutaway:** a side-on pixel cross-section of the building at night, lit windows, figures standing in rooms.

## Open questions
1. Is evidence from rooms (visitor lists) too strong or too weak at 6 players?
2. Which art style, and should each setting have its own?
3. A general name for the Enemy, and a title for the game.
"""
open('doc.md','w').write(s)
