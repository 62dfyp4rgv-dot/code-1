/**
 * "Real club names" starter pack: club names, short codes and cities only. Ordered strongest-first per league
 * (approximate recent standing, a scenario seed rather than a rating), so the strongest generated club receives the
 * first name. League membership reflects the 2025/26 season to the authors' best knowledge and is NOT verified against
 * an official source. No crests, logos, players or coaches are included: supply those through your own data pack.
 * Club names are factual; all trademarks belong to their respective owners.
 */
import type { DataPack, PackClub } from '../world/datapack';
import { REAL_COMPETITION_NAMES } from './realCompetitionNames';

type Row = [name: string, short: string, city?: string];
const clubs = (rows: Row[]): PackClub[] => rows.map(([name, shortName, city]) => ({ name, shortName, ...(city ? { city } : {}) }));

export const REAL_CLUB_NAMES: DataPack = {
  format: 'football-universe-data-pack', version: 1,
  id: 'real-club-names-2025',
  name: 'Real club names (unofficial)',
  source: 'Compiled by the project authors from general public knowledge; not verified against an official source',
  licence: 'Names only; trademarks belong to their owners; no logos or player data included',
  competitions: REAL_COMPETITION_NAMES,
  leagues: {
    ENG1: clubs([
      ['Manchester City', 'MCI', 'Manchester'], ['Liverpool', 'LIV', 'Liverpool'], ['Arsenal', 'ARS', 'London'], ['Chelsea', 'CHE', 'London'],
      ['Manchester United', 'MUN', 'Manchester'], ['Tottenham Hotspur', 'TOT', 'London'], ['Newcastle United', 'NEW', 'Newcastle'], ['Aston Villa', 'AVL', 'Birmingham'],
      ['Brighton & Hove Albion', 'BHA', 'Brighton'], ['West Ham United', 'WHU', 'London'], ['Crystal Palace', 'CRY', 'London'], ['Fulham', 'FUL', 'London'],
      ['Brentford', 'BRE', 'London'], ['Everton', 'EVE', 'Liverpool'], ['Nottingham Forest', 'NFO', 'Nottingham'], ['Wolverhampton Wanderers', 'WOL', 'Wolverhampton'],
      ['AFC Bournemouth', 'BOU', 'Bournemouth'], ['Leeds United', 'LEE', 'Leeds'], ['Sunderland', 'SUN', 'Sunderland'], ['Burnley', 'BUR', 'Burnley'],
    ]),
    ESP1: clubs([
      ['Real Madrid', 'RMA', 'Madrid'], ['FC Barcelona', 'BAR', 'Barcelona'], ['Atlético de Madrid', 'ATM', 'Madrid'], ['Athletic Club', 'ATH', 'Bilbao'],
      ['Real Sociedad', 'RSO', 'San Sebastián'], ['Villarreal', 'VIL', 'Villarreal'], ['Real Betis', 'BET', 'Seville'], ['Sevilla', 'SEV', 'Seville'],
      ['Valencia', 'VAL', 'Valencia'], ['Girona', 'GIR', 'Girona'], ['Celta de Vigo', 'CEL', 'Vigo'], ['Osasuna', 'OSA', 'Pamplona'],
      ['Getafe', 'GET', 'Getafe'], ['Rayo Vallecano', 'RAY', 'Madrid'], ['Mallorca', 'MLL', 'Palma'], ['Espanyol', 'ESP', 'Barcelona'],
      ['Alavés', 'ALA', 'Vitoria-Gasteiz'], ['Elche', 'ELC', 'Elche'], ['Levante', 'LEV', 'Valencia'], ['Real Oviedo', 'OVI', 'Oviedo'],
    ]),
    ITA1: clubs([
      ['Inter', 'INT', 'Milan'], ['Juventus', 'JUV', 'Turin'], ['AC Milan', 'MIL', 'Milan'], ['Napoli', 'NAP', 'Naples'],
      ['Atalanta', 'ATA', 'Bergamo'], ['Roma', 'ROM', 'Rome'], ['Lazio', 'LAZ', 'Rome'], ['Fiorentina', 'FIO', 'Florence'],
      ['Bologna', 'BOL', 'Bologna'], ['Torino', 'TOR', 'Turin'], ['Genoa', 'GEN', 'Genoa'], ['Udinese', 'UDI', 'Udine'],
      ['Como', 'COM', 'Como'], ['Sassuolo', 'SAS', 'Sassuolo'], ['Cagliari', 'CAG', 'Cagliari'], ['Parma', 'PAR', 'Parma'],
      ['Lecce', 'LEC', 'Lecce'], ['Cremonese', 'CRE', 'Cremona'], ['Hellas Verona', 'VER', 'Verona'], ['Pisa', 'PIS', 'Pisa'],
    ]),
    GER1: clubs([
      ['Bayern München', 'FCB', 'Munich'], ['Borussia Dortmund', 'BVB', 'Dortmund'], ['Bayer Leverkusen', 'B04', 'Leverkusen'], ['RB Leipzig', 'RBL', 'Leipzig'],
      ['Eintracht Frankfurt', 'SGE', 'Frankfurt'], ['VfB Stuttgart', 'VFB', 'Stuttgart'], ['SC Freiburg', 'SCF', 'Freiburg'], ['Borussia Mönchengladbach', 'BMG', 'Mönchengladbach'],
      ['VfL Wolfsburg', 'WOB', 'Wolfsburg'], ['Werder Bremen', 'SVW', 'Bremen'], ['TSG Hoffenheim', 'TSG', 'Sinsheim'], ['FC Augsburg', 'FCA', 'Augsburg'],
      ['Mainz 05', 'M05', 'Mainz'], ['Union Berlin', 'FCU', 'Berlin'], ['1. FC Köln', 'KOE', 'Cologne'], ['Hamburger SV', 'HSV', 'Hamburg'],
      ['FC St. Pauli', 'STP', 'Hamburg'], ['1. FC Heidenheim', 'HDH', 'Heidenheim'],
    ]),
    FRA1: clubs([
      ['Paris Saint-Germain', 'PSG', 'Paris'], ['Olympique de Marseille', 'OM', 'Marseille'], ['AS Monaco', 'ASM', 'Monaco'], ['LOSC Lille', 'LIL', 'Lille'],
      ['Olympique Lyonnais', 'OL', 'Lyon'], ['OGC Nice', 'NIC', 'Nice'], ['RC Lens', 'RCL', 'Lens'], ['Stade Rennais', 'REN', 'Rennes'],
      ['RC Strasbourg', 'STR', 'Strasbourg'], ['Toulouse', 'TOU', 'Toulouse'], ['FC Nantes', 'NAN', 'Nantes'], ['Stade Brestois', 'BRE', 'Brest'],
      ['Angers', 'ANG', 'Angers'], ['Le Havre', 'HAC', 'Le Havre'], ['AJ Auxerre', 'AUX', 'Auxerre'], ['FC Lorient', 'LOR', 'Lorient'],
      ['Paris FC', 'PFC', 'Paris'], ['FC Metz', 'MET', 'Metz'],
    ]),
    SAU1: clubs([
      ['Al Hilal', 'HIL', 'Riyadh'], ['Al Nassr', 'NAS', 'Riyadh'], ['Al Ittihad', 'ITT', 'Jeddah'], ['Al Ahli', 'AHL', 'Jeddah'],
      ['Al Qadsiah', 'QAD', 'Khobar'], ['Al Shabab', 'SHA', 'Riyadh'], ['Al Ettifaq', 'ETF', 'Dammam'], ['Al Taawoun', 'TAA', 'Buraidah'],
      ['Al Fayha', 'FAY', 'Al Majmaah'], ['Al Fateh', 'FAT', 'Al Mubarraz'], ['Damac', 'DAM', 'Khamis Mushait'], ['Al Khaleej', 'KHA', 'Saihat'],
      ['Al Okhdood', 'OKH', 'Najran'], ['Al Riyadh', 'RIY', 'Riyadh'], ['Al Kholood', 'KHO', 'Ar Rass'], ['Al Najma', 'NAJ', 'Unaizah'],
      ['Al Hazem', 'HAZ', 'Ar Rass'], ['NEOM SC', 'NEO', 'Tabuk'],
    ]),
    POR1: clubs([
      ['Benfica', 'SLB', 'Lisbon'], ['FC Porto', 'FCP', 'Porto'], ['Sporting CP', 'SCP', 'Lisbon'], ['SC Braga', 'SCB', 'Braga'],
      ['Vitória SC', 'VSC', 'Guimarães'], ['Famalicão', 'FAM', 'Vila Nova de Famalicão'], ['Gil Vicente', 'GIL', 'Barcelos'], ['Estoril Praia', 'EST', 'Estoril'],
      ['Moreirense', 'MOR', 'Moreira de Cónegos'], ['Arouca', 'ARO', 'Arouca'], ['Casa Pia', 'CPA', 'Lisbon'], ['Rio Ave', 'RAV', 'Vila do Conde'],
      ['Santa Clara', 'SCL', 'Ponta Delgada'], ['Nacional', 'NAC', 'Funchal'], ['Estrela da Amadora', 'EAM', 'Amadora'], ['Alverca', 'ALV', 'Alverca do Ribatejo'],
      ['AVS', 'AVS', 'Vila das Aves'], ['Tondela', 'TON', 'Tondela'],
    ]),
    NED1: clubs([
      ['Ajax', 'AJA', 'Amsterdam'], ['PSV Eindhoven', 'PSV', 'Eindhoven'], ['Feyenoord', 'FEY', 'Rotterdam'], ['AZ Alkmaar', 'AZ', 'Alkmaar'],
      ['FC Twente', 'TWE', 'Enschede'], ['FC Utrecht', 'UTR', 'Utrecht'], ['SC Heerenveen', 'HEE', 'Heerenveen'], ['Go Ahead Eagles', 'GAE', 'Deventer'],
      ['NEC Nijmegen', 'NEC', 'Nijmegen'], ['Sparta Rotterdam', 'SPA', 'Rotterdam'], ['Fortuna Sittard', 'FOR', 'Sittard'], ['PEC Zwolle', 'PEC', 'Zwolle'],
      ['FC Groningen', 'GRO', 'Groningen'], ['Heracles Almelo', 'HER', 'Almelo'], ['Excelsior', 'EXC', 'Rotterdam'], ['Telstar', 'TEL', 'Velsen'],
      ['NAC Breda', 'NAC', 'Breda'], ['FC Volendam', 'VOL', 'Volendam'],
    ]),
    BRA1: clubs([
      ['Flamengo', 'FLA', 'Rio de Janeiro'], ['Palmeiras', 'PAL', 'São Paulo'], ['Botafogo', 'BOT', 'Rio de Janeiro'], ['Fluminense', 'FLU', 'Rio de Janeiro'],
      ['São Paulo', 'SAO', 'São Paulo'], ['Corinthians', 'COR', 'São Paulo'], ['Atlético Mineiro', 'CAM', 'Belo Horizonte'], ['Grêmio', 'GRE', 'Porto Alegre'],
      ['Internacional', 'INT', 'Porto Alegre'], ['Cruzeiro', 'CRU', 'Belo Horizonte'], ['Vasco da Gama', 'VAS', 'Rio de Janeiro'], ['Santos', 'SAN', 'Santos'],
      ['Bahia', 'BAH', 'Salvador'], ['Fortaleza', 'FOR', 'Fortaleza'], ['Red Bull Bragantino', 'RBB', 'Bragança Paulista'], ['Vitória', 'VIT', 'Salvador'],
      ['Juventude', 'JUV', 'Caxias do Sul'], ['Sport Recife', 'SPT', 'Recife'], ['Ceará', 'CEA', 'Fortaleza'], ['Mirassol', 'MIR', 'Mirassol'],
    ]),
    USA1: clubs([
      ['Inter Miami CF', 'MIA', 'Fort Lauderdale'], ['LA Galaxy', 'LAG', 'Los Angeles'], ['Los Angeles FC', 'LAFC', 'Los Angeles'], ['Seattle Sounders FC', 'SEA', 'Seattle'],
      ['Columbus Crew', 'CLB', 'Columbus'], ['FC Cincinnati', 'CIN', 'Cincinnati'], ['Atlanta United FC', 'ATL', 'Atlanta'], ['New York City FC', 'NYC', 'New York'],
      ['Philadelphia Union', 'PHI', 'Chester'], ['Orlando City SC', 'ORL', 'Orlando'], ['Portland Timbers', 'POR', 'Portland'], ['Real Salt Lake', 'RSL', 'Sandy'],
      ['Houston Dynamo FC', 'HOU', 'Houston'], ['Austin FC', 'ATX', 'Austin'], ['Nashville SC', 'NSH', 'Nashville'], ['Vancouver Whitecaps FC', 'VAN', 'Vancouver'],
      ['Minnesota United FC', 'MIN', 'Saint Paul'], ['Charlotte FC', 'CLT', 'Charlotte'], ['Toronto FC', 'TOR', 'Toronto'], ['New York Red Bulls', 'RBNY', 'Harrison'],
      ['Sporting Kansas City', 'SKC', 'Kansas City'], ['Colorado Rapids', 'COL', 'Commerce City'], ['FC Dallas', 'DAL', 'Frisco'], ['D.C. United', 'DCU', 'Washington'],
      ['New England Revolution', 'NE', 'Foxborough'], ['St. Louis City SC', 'STL', 'St. Louis'], ['San Jose Earthquakes', 'SJ', 'San Jose'], ['CF Montréal', 'MTL', 'Montreal'],
      ['Chicago Fire FC', 'CHI', 'Chicago'], ['San Diego FC', 'SD', 'San Diego'],
    ]),
  },
};
