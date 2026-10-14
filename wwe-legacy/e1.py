import sys; sys.path.insert(0,'/tmp/claude-0/-home-user-code-1/3f6bb3e4-1036-5674-9381-035c821ede25/scratchpad/qa_qa_a')
from lib import Ed
e=Ed('/home/user/code-1/wwe-legacy/src/story/scenarios/career_life.js')
e.rep("facility: ['the Performance Center', 'a converted warehouse gym',","facility: ['the training center', 'a converted warehouse gym',")
e.rep("""{trainer.name} looks you over once, points at the ring, and says your first lesson is {drill}.', 'The other trainees stop what they are doing to watch. Everybody in the building remembers how their own first day went, and everybody wants to see how yours does.'""",
"""{trainer.name} looks you over once, points at the ring and says, "First lesson: {drill}. Go."', 'The other trainees stop what they are doing to watch. Everybody in the building remembers how their own first day went, and everybody wants to see how yours does.'""")
e.rep("""'You cut a thirty-second promo that makes people look up from their phones. It is the part they remember.'""","""'You cut a thirty-second promo that makes the whispering in the room stop. It is the part they remember.'""")
e.rep("""'{agent.name} slides the paperwork across the table: {terms}. The money is modest, and next to {pressure}, the room feels smaller than it did when you walked in.', 'It is your first real offer. You can sign, haggle, or walk, and each of those says something about you.'""",
"""'{agent.name} slides the paperwork across the table: {terms}. The money is modest, and the room feels smaller than it did when you walked in, because there is {pressure}.', '"Sign here, or tell me what you want changed," {agent.name} says. It is your first real offer, and whether you sign, haggle or walk says something about you.'""")
e.rep("'a hard deadline of end of day'","'a hard deadline of five o\\'clock'")
e.rep("""'{producer.name} appears with a headset and a clipboard and reads your face in one second. There are ten minutes until the bell.'""","""'{producer.name} appears with a headset and a clipboard and reads your face in one second. "Longer out than in," {producer.they} says, tapping your sternum. "Ten minutes to the bell."'""")
e.rep("""'{trainer.name} announces {drill} at the end of an already long day. The reason, mentioned in passing, is {reason}.'""","""'"Again," {trainer.name} says at the end of an already long day, and what {trainer.they} means is {drill}. The reason, mentioned in passing, is {reason}.'""")
e.rep("""It also comes free, and with a favor owed.'""","""It also comes nearly free, and with a favor owed.'""")
e.rep("'the bus', 'the gym'], prank:","'the tour van', 'the gym'], prank:")
e.rep("""Someone has done it to you in {where}: {prank}. {vet.name} is leaning on the wall with the face of a person who knows nothing and invented all of it.', 'Half the room is waiting to see what you do. It is an old tradition and it has a reputation for revealing character.'""",
"""Someone has done it to you in {where}: {prank}. {vet.name} is leaning on the wall with the face of a person who knows nothing and invented all of it.', '"Welcome to the business," {vet.they} says to no one in particular. Half the room is waiting to see what you do, since this old tradition has a way of revealing character.'""")
e.rep("""Someone slaps your shoulder, and you are told you are good people. It costs""","""Someone slaps your shoulder and tells you that you are all right. It costs""")
e.save()
