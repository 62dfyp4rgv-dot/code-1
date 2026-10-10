/**
 * Real-world display names for the registry's competitions (leagues, cups, super cups, continental). Only the NAME is
 * overlaid: formats, entrants, qualification slots and rules stay the engine's unverified scenario defaults, so
 * "FA Cup" here is the engine's England cup, not a model of the real tournament's exact rules.
 */
export const REAL_COMPETITION_NAMES: Record<string, { name: string; shortName: string }> = {
  ENG1: { name: 'Premier League', shortName: 'EPL' }, ENG2: { name: 'EFL Championship', shortName: 'CHA' }, ESP1: { name: 'La Liga', shortName: 'LAL' },
  ITA1: { name: 'Serie A', shortName: 'SA' }, GER1: { name: 'Bundesliga', shortName: 'BUN' }, FRA1: { name: 'Ligue 1', shortName: 'L1' },
  POR1: { name: 'Liga Portugal', shortName: 'LP' }, NED1: { name: 'Eredivisie', shortName: 'ERE' }, BEL1: { name: 'Belgian Pro League', shortName: 'BPL' },
  SCO1: { name: 'Scottish Premiership', shortName: 'SPL' }, TUR1: { name: 'Süper Lig', shortName: 'SL' }, SAU1: { name: 'Saudi Pro League', shortName: 'SPL' },
  SAU2: { name: 'Saudi First Division League', shortName: 'SFD' }, JPN1: { name: 'J1 League', shortName: 'J1' }, KOR1: { name: 'K League 1', shortName: 'K1' },
  CHN1: { name: 'Chinese Super League', shortName: 'CSL' }, AUS1: { name: 'A-League Men', shortName: 'ALM' }, UAE1: { name: 'UAE Pro League', shortName: 'UPL' },
  QAT1: { name: 'Qatar Stars League', shortName: 'QSL' }, EGY1: { name: 'Egyptian Premier League', shortName: 'EPL' }, MAR1: { name: 'Botola Pro', shortName: 'BOT' },
  RSA1: { name: 'Betway Premiership', shortName: 'PSL' }, TUN1: { name: 'Tunisian Ligue 1', shortName: 'TL1' }, ALG1: { name: 'Algerian Ligue 1', shortName: 'AL1' },
  USA1: { name: 'Major League Soccer', shortName: 'MLS' }, MEX1: { name: 'Liga MX', shortName: 'LMX' }, CRC1: { name: 'Liga FPD', shortName: 'FPD' },
  ARG1: { name: 'Liga Profesional', shortName: 'LPF' }, BRA1: { name: 'Brasileirão Série A', shortName: 'BSA' }, COL1: { name: 'Liga BetPlay', shortName: 'LBP' },
  CHI1: { name: 'Campeonato Nacional', shortName: 'CNA' }, URU1: { name: 'Primera División de Uruguay', shortName: 'PDU' }, NZL1: { name: 'New Zealand National League', shortName: 'NZN' },
  'ENG-CUP': { name: 'FA Cup', shortName: 'FAC' }, 'ESP-CUP': { name: 'Copa del Rey', shortName: 'CDR' }, 'ITA-CUP': { name: 'Coppa Italia', shortName: 'CI' },
  'GER-CUP': { name: 'DFB-Pokal', shortName: 'DFB' }, 'FRA-CUP': { name: 'Coupe de France', shortName: 'CDF' }, 'POR-CUP': { name: 'Taça de Portugal', shortName: 'TDP' },
  'NED-CUP': { name: 'KNVB Cup', shortName: 'KNVB' }, 'BEL-CUP': { name: 'Belgian Cup', shortName: 'BEC' }, 'SCO-CUP': { name: 'Scottish Cup', shortName: 'SC' },
  'TUR-CUP': { name: 'Turkish Cup', shortName: 'TC' }, 'SAU-CUP': { name: "King's Cup", shortName: 'KC' }, 'JPN-CUP': { name: "Emperor's Cup", shortName: 'EC' },
  'KOR-CUP': { name: 'Korean FA Cup', shortName: 'KFA' }, 'CHN-CUP': { name: 'Chinese FA Cup', shortName: 'CFA' }, 'AUS-CUP': { name: 'Australia Cup', shortName: 'AUC' },
  'UAE-CUP': { name: "UAE President's Cup", shortName: 'PC' }, 'QAT-CUP': { name: 'Emir of Qatar Cup', shortName: 'EQC' }, 'EGY-CUP': { name: 'Egypt Cup', shortName: 'EGC' },
  'MAR-CUP': { name: 'Throne Cup', shortName: 'TC' }, 'RSA-CUP': { name: 'Nedbank Cup', shortName: 'NC' }, 'TUN-CUP': { name: 'Tunisian Cup', shortName: 'TNC' },
  'ALG-CUP': { name: 'Algerian Cup', shortName: 'ALC' }, 'USA-CUP': { name: 'U.S. Open Cup', shortName: 'USOC' }, 'MEX-CUP': { name: 'Copa MX', shortName: 'CMX' },
  'BRA-CUP': { name: 'Copa do Brasil', shortName: 'CDB' }, 'ARG-CUP': { name: 'Copa Argentina', shortName: 'CAR' }, 'COL-CUP': { name: 'Copa Colombia', shortName: 'CCO' },
  'CHI-CUP': { name: 'Copa Chile', shortName: 'CCH' }, 'URU-CUP': { name: 'Copa Uruguay', shortName: 'CUR' },
  'ENG-SC': { name: 'FA Community Shield', shortName: 'CS' }, 'ESP-SC': { name: 'Supercopa de España', shortName: 'SDE' }, 'ITA-SC': { name: 'Supercoppa Italiana', shortName: 'SCI' },
  'GER-SC': { name: 'DFL-Supercup', shortName: 'DSC' }, 'FRA-SC': { name: 'Trophée des Champions', shortName: 'TDC' }, 'POR-SC': { name: 'Supertaça Cândido de Oliveira', shortName: 'SCO' },
  'NED-SC': { name: 'Johan Cruyff Shield', shortName: 'JCS' }, 'SAU-SC': { name: 'Saudi Super Cup', shortName: 'SSC' }, USC: { name: 'UEFA Super Cup', shortName: 'USC' },
  UCL: { name: 'UEFA Champions League', shortName: 'UCL' }, UEL: { name: 'UEFA Europa League', shortName: 'UEL' }, UECL: { name: 'UEFA Conference League', shortName: 'UECL' },
  ACLE: { name: 'AFC Champions League Elite', shortName: 'ACLE' }, ACL2: { name: 'AFC Champions League Two', shortName: 'ACL2' },
  CAFCL: { name: 'CAF Champions League', shortName: 'CAFCL' }, CAFCC: { name: 'CAF Confederation Cup', shortName: 'CAFCC' },
  CCC: { name: 'Concacaf Champions Cup', shortName: 'CCC' }, COPA: { name: 'Copa Libertadores', shortName: 'COPA' }, SUDA: { name: 'Copa Sudamericana', shortName: 'SUDA' },
  OCL: { name: 'OFC Champions League', shortName: 'OCL' }, CWC: { name: 'FIFA Club World Cup', shortName: 'CWC' },
};
