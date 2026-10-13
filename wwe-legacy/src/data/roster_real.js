// Real-name roster snapshot for historical / modern modes.
// DATA QUALITY NOTE: entries are curated from general wrestling knowledge, NOT verified against
// official sources. Active windows are approximate; attributes/ratings are game values generated
// deterministically from tier + style (NOT official ratings). Finisher names are the commonly known
// ones. Treat everything here as `approx:true`. A fictional supplement fills the rest of each roster.
// Row: id | name | gender | style | alignment | peakTier(0-4) | activeWindows | finisher | finisherTemplate
const S = { br: 'brawler', te: 'technician', hf: 'highflyer', pw: 'powerhouse', sh: 'showman', su: 'submission', al: 'allrounder' };
const A = { f: 'face', h: 'heel', t: 'tweener' };
const rows = `
hulk_hogan|Hulk Hogan|M|sh|f|4|1984-2003|Atomic Leg Drop|fin_slam
andre_the_giant|Andre the Giant|M|pw|t|4|1984-1992|Giant Splash|fin_slam
randy_savage|Randy Savage|M|sh|t|4|1985-1994|Flying Elbow Drop|fin_dive
ultimate_warrior|Ultimate Warrior|M|pw|f|3|1987-1996|Warrior Splash|fin_slam
bret_hart|Bret Hart|M|te|f|4|1985-2000|Sharpshooter|fin_sub_legs
shawn_michaels|Shawn Michaels|M|sh|h|4|1985-2010|Sweet Chin Music|fin_kick
ric_flair|Ric Flair|M|te|h|4|1991-1993,2001-2002,2008-2008|Figure-Four Leglock|fin_sub_legs
the_undertaker|The Undertaker|M|pw|t|4|1990-2020|Tombstone Piledriver|fin_piledriver
kane|Kane|M|pw|h|3|1997-2020|Chokeslam|fin_slam
mankind|Mick Foley|M|br|h|3|1996-2008|Mandible Claw|fin_sub_choke
stone_cold|Stone Cold Steve Austin|M|br|f|4|1996-2003|Stone Cold Stunner|fin_stunner
the_rock|The Rock|M|sh|f|4|1996-2004,2011-2013|Rock Bottom|fin_slam
triple_h|Triple H|M|br|h|4|1995-2022|Pedigree|fin_ddt
big_show|Big Show|M|pw|t|3|1999-2021|Chokeslam|fin_slam
kurt_angle|Kurt Angle|M|te|f|4|2000-2006,2017-2019|Ankle Lock|fin_sub_legs
chris_jericho|Chris Jericho|M|sh|h|3|1999-2010,2012-2018|Walls of Jericho|fin_sub_legs
edge|Edge|M|br|h|4|1998-2011,2020-2023|Spear|fin_spear
christian|Christian|M|hf|h|2|1998-2014|Killswitch|fin_neck
eddie_guerrero|Eddie Guerrero|M|hf|f|3|1997-2005|Frog Splash|fin_dive
rey_mysterio|Rey Mysterio|M|hf|f|3|2002-2100|619 West Coast Pop|fin_dive
batista|Batista|M|pw|h|4|2002-2010,2014-2014|Batista Bomb|fin_bomb
john_cena|John Cena|M|sh|f|4|2002-2025|Attitude Adjustment|fin_slam
randy_orton|Randy Orton|M|te|h|4|2002-2100|RKO|fin_ddt
brock_lesnar|Brock Lesnar|M|pw|h|4|2002-2004,2012-2100|F-5|fin_slam
cm_punk|CM Punk|M|br|t|4|2006-2014,2023-2100|Go To Sleep|fin_kick
daniel_bryan|Daniel Bryan|M|te|f|3|2009-2021|Yes Lock|fin_sub_arms
aj_styles|AJ Styles|M|te|t|3|2016-2100|Styles Clash|fin_ddt
roman_reigns|Roman Reigns|M|pw|t|4|2012-2100|Spear|fin_spear
seth_rollins|Seth Rollins|M|al|h|4|2012-2100|Curb Stomp|fin_kick
dean_ambrose|Dean Ambrose|M|br|t|3|2012-2019|Dirty Deeds|fin_ddt
finn_balor|Finn Balor|M|hf|f|3|2014-2100|Coup de Grace|fin_dive
sami_zayn|Sami Zayn|M|te|f|3|2013-2100|Helluva Kick|fin_kick
kevin_owens|Kevin Owens|M|br|h|3|2014-2100|Pop-Up Powerbomb|fin_bomb
kofi_kingston|Kofi Kingston|M|hf|f|2|2007-2100|Trouble in Paradise|fin_kick
the_miz|The Miz|M|sh|h|2|2006-2100|Skull-Crushing Finale|fin_ddt
dolph_ziggler|Dolph Ziggler|M|hf|h|2|2005-2023|Zig Zag|fin_neck
cody_rhodes|Cody Rhodes|M|al|f|3|2007-2016,2022-2100|Cross Rhodes|fin_ddt
drew_mcintyre|Drew McIntyre|M|pw|f|3|2007-2014,2017-2100|Claymore|fin_kick
bobby_lashley|Bobby Lashley|M|pw|h|3|2005-2008,2018-2100|Hurt Lock|fin_sub_back
jey_uso|Jey Uso|M|br|f|2|2010-2100|Uso Splash|fin_dive
jimmy_uso|Jimmy Uso|M|hf|f|1|2010-2100|Uso Splash|fin_dive
gunther|Gunther|M|pw|h|3|2022-2100|Powerbomb|fin_bomb
bron_breakker|Bron Breakker|M|pw|h|2|2022-2100|Spear|fin_spear
la_knight|LA Knight|M|sh|f|2|2023-2100|BFT|fin_ddt
logan_paul|Logan Paul|M|hf|h|2|2022-2100|Frog Splash|fin_dive
solo_sikoa|Solo Sikoa|M|pw|h|2|2022-2100|Samoan Spike|fin_slam
jacob_fatu|Jacob Fatu|M|pw|h|2|2024-2100|Moonsault|fin_dive
damian_priest|Damian Priest|M|br|h|2|2018-2100|South of Heaven|fin_slam
rusev|Rusev|M|pw|h|2|2014-2020|Accolade|fin_sub_back
big_e|Big E|M|pw|f|2|2012-2023|Big Ending|fin_slam
xavier_woods|Xavier Woods|M|hf|f|1|2009-2100|Honor Roll|fin_dive
ricochet|Ricochet|M|hf|f|2|2018-2023|Recoil|fin_dive
ilja_dragunov|Ilja Dragunov|M|br|f|2|2022-2100|Torpedo Moscow|fin_dive
carmelo_hayes|Carmelo Hayes|M|sh|h|2|2022-2100|From the Heavens|fin_dive
trick_williams|Trick Williams|M|sh|f|1|2023-2100|Trick Shot|fin_kick
oba_femi|Oba Femi|M|pw|f|2|2023-2100|Fall from Grace|fin_slam
penta|Penta|M|hf|h|2|2023-2100|Mexican Destroyer|fin_ddt
tama_tonga|Tama Tonga|M|br|h|2|2023-2100|Gun Stun|fin_ddt
dominik_mysterio|Dominik Mysterio|M|sh|h|1|2019-2100|Frog Splash|fin_dive
chad_gable|Chad Gable|M|te|f|2|2013-2100|Chaos Theory|fin_neck
andrade|Andrade|M|te|h|2|2018-2024|Hammerlock DDT|fin_ddt
shinsuke_nakamura|Shinsuke Nakamura|M|br|t|3|2016-2100|Kinshasa|fin_kick
mark_henry|Mark Henry|M|pw|t|3|1996-2017|World's Strongest Slam|fin_slam
jeff_hardy|Jeff Hardy|M|hf|f|3|1999-2009,2017-2021|Swanton Bomb|fin_dive
matt_hardy|Matt Hardy|M|hf|f|2|1999-2009,2017-2020|Twist of Fate|fin_neck
booker_t|Booker T|M|sh|f|3|2001-2012|Scissors Kick|fin_kick
rob_van_dam|Rob Van Dam|M|hf|f|3|2001-2007|Five-Star Frog Splash|fin_dive
sting|Sting|M|br|t|3|2014-2020|Scorpion Death Drop|fin_ddt
goldberg|Goldberg|M|pw|f|3|2003-2004,2016-2022|Jackhammer|fin_bomb
roddy_piper|Roddy Piper|M|br|h|3|1984-1996|Sleeper Hold|fin_sub_choke
jake_roberts|Jake Roberts|M|te|h|3|1986-1996|DDT|fin_ddt
ted_dibiase|Ted DiBiase|M|sh|h|3|1987-1993|Million Dollar Dream|fin_sub_choke
mr_perfect|Mr. Perfect|M|te|h|3|1988-1993|Perfectplex|fin_neck
razor_ramon|Razor Ramon|M|br|t|3|1992-1996|Razor's Edge|fin_bomb
diesel|Diesel|M|pw|f|3|1993-1996|Jackknife Powerbomb|fin_bomb
yokozuna|Yokozuna|M|pw|h|3|1992-1998|Banzai Drop|fin_slam
lex_luger|Lex Luger|M|pw|f|3|1993-1995|Torture Rack|fin_sub_back
owen_hart|Owen Hart|M|te|h|3|1988-1999|Enzuigiri|fin_kick
british_bulldog|The British Bulldog|M|pw|f|2|1986-1997|Running Powerslam|fin_slam
vader|Vader|M|pw|h|3|1996-1998|Vader Bomb|fin_slam
ken_shamrock|Ken Shamrock|M|su|t|2|1997-1999|Ankle Lock|fin_sub_legs
x_pac|X-Pac|M|hf|t|2|1998-2002|X-Factor|fin_neck
road_dogg|Road Dogg|M|sh|h|2|1997-2003|Pumphandle Slam|fin_slam
billy_gunn|Billy Gunn|M|br|h|2|1997-2004|Fameasser|fin_ddt
trish_stratus|Trish Stratus|F|te|f|3|2000-2006|Chick Kick|fin_kick
lita|Lita|F|hf|f|3|2000-2006|Twist of Fate|fin_neck
chyna|Chyna|F|pw|t|3|1997-2001|Pedigree|fin_ddt
mickie_james|Mickie James|F|br|h|3|2005-2010,2017-2022|Mick Kick|fin_kick
beth_phoenix|Beth Phoenix|F|pw|h|3|2006-2012|Glam Slam|fin_slam
charlotte_flair|Charlotte Flair|F|te|h|4|2012-2100|Figure-Eight|fin_sub_legs
becky_lynch|Becky Lynch|F|br|f|4|2013-2100|Dis-Arm-Her|fin_sub_arms
sasha_banks|Sasha Banks|F|hf|h|3|2012-2022|Bank Statement|fin_sub_legs
bayley|Bayley|F|hf|f|3|2012-2100|Rose Plant|fin_ddt
asuka|Asuka|F|su|h|3|2015-2100|Asuka Lock|fin_sub_arms
bianca_belair|Bianca Belair|F|pw|f|3|2016-2100|Kiss of Death|fin_slam
rhea_ripley|Rhea Ripley|F|pw|h|4|2017-2100|Riptide|fin_bomb
alexa_bliss|Alexa Bliss|F|sh|h|3|2013-2100|Twisted Bliss|fin_dive
liv_morgan|Liv Morgan|F|hf|f|3|2016-2100|Oblivion|fin_ddt
iyo_sky|Iyo Sky|F|hf|h|3|2022-2100|Over the Moonsault|fin_dive
tiffany_stratton|Tiffany Stratton|F|hf|h|3|2022-2100|Prettiest Moonsault Ever|fin_dive
naomi|Naomi|F|hf|f|2|2009-2100|Rear View|fin_kick
natalya|Natalya|F|su|f|2|2008-2100|Sharpshooter|fin_sub_legs
aj_lee|AJ Lee|F|hf|h|3|2012-2015|Black Widow|fin_sub_arms
paige|Paige|F|br|t|3|2014-2018|PTO|fin_sub_arms
nia_jax|Nia Jax|F|pw|h|2|2015-2100|Annihilator|fin_slam
lyra_valkyria|Lyra Valkyria|F|te|f|2|2023-2100|Nightwing|fin_ddt
jade_cargill|Jade Cargill|F|pw|f|2|2024-2100|Jaded|fin_slam
`.trim().split('\n');

export const REAL_ROSTER = rows.map((r) => {
  const [id, name, gender, st, al, tier, win, finName, tpl] = r.split('|');
  const windows = win.split(',').map((w) => w.split('-').map(Number));
  return { id, name, gender, style: S[st], alignment: A[al], peakTier: +tier, windows, finisherName: finName, finisherTpl: tpl, approx: true, real: true };
});

export const activeIn = (w, year) => w.windows.some(([a, b]) => year >= a && year <= b);
