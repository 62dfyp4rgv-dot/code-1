/**
 * "Starter squads" overlay: head coach and a first-team core for a few dozen well-known clubs, written from the
 * authors' memory of the 2025/26 season. UNVERIFIED and possibly outdated or wrong (transfers, coaching changes,
 * birth years). Players are listed best-first within each club, no ratings are supplied (attributes stay generated and
 * are matched by that order). No images are included. Replace with a pack you trust for accuracy.
 */
import type { DataPack, PackClub, PackPlayer } from '../world/datapack';
import { REAL_CLUB_NAMES } from './realClubNames';
import type { Position } from '../types';

type P = [name: string, pos: Position, nat: string, born: number];
type Squad = { coach?: [name: string, nat: string, born: number]; players: P[] };

const S: Record<string, Squad> = {
  'Manchester City': { coach: ['Pep Guardiola', 'ESP', 1971], players: [
    ['Erling Haaland', 'ST', 'NOR', 2000], ['Rodri', 'DM', 'ESP', 1996], ['Phil Foden', 'AM', 'ENG', 2000], ['Rúben Dias', 'CB', 'POR', 1997],
    ['Josko Gvardiol', 'CB', 'CRO', 2002], ['Bernardo Silva', 'CM', 'POR', 1994], ['Tijjani Reijnders', 'CM', 'NED', 1998], ['Rayan Cherki', 'AM', 'FRA', 2003],
    ['Jérémy Doku', 'LW', 'BEL', 2002], ['Gianluigi Donnarumma', 'GK', 'ITA', 1999], ['Nico González', 'DM', 'ESP', 2002], ['John Stones', 'CB', 'ENG', 1994], ['Rayan Aït-Nouri', 'LB', 'FRA', 2001], ['Matheus Nunes', 'RB', 'POR', 1998] ] },
  Liverpool: { coach: ['Arne Slot', 'NED', 1978], players: [
    ['Mohamed Salah', 'RW', 'EGY', 1992], ['Virgil van Dijk', 'CB', 'NED', 1991], ['Alexis Mac Allister', 'CM', 'ARG', 1998], ['Florian Wirtz', 'AM', 'GER', 2003],
    ['Alisson', 'GK', 'BRA', 1992], ['Dominik Szoboszlai', 'CM', 'HUN', 2000], ['Alexander Isak', 'ST', 'SWE', 1999], ['Cody Gakpo', 'LW', 'NED', 1999],
    ['Ryan Gravenberch', 'CM', 'NED', 2002], ['Ibrahima Konaté', 'CB', 'FRA', 1999], ['Jeremie Frimpong', 'RB', 'NED', 2000], ['Milos Kerkez', 'LB', 'HUN', 2003], ['Hugo Ekitiké', 'ST', 'FRA', 2002] ] },
  Arsenal: { coach: ['Mikel Arteta', 'ESP', 1982], players: [
    ['Bukayo Saka', 'RW', 'ENG', 2001], ['Martin Ødegaard', 'AM', 'NOR', 1998], ['Declan Rice', 'CM', 'ENG', 1999], ['William Saliba', 'CB', 'FRA', 2001],
    ['Gabriel Magalhães', 'CB', 'BRA', 1997], ['David Raya', 'GK', 'ESP', 1995], ['Viktor Gyökeres', 'ST', 'SWE', 1998], ['Martin Zubimendi', 'DM', 'ESP', 1999],
    ['Gabriel Martinelli', 'LW', 'BRA', 2001], ['Eberechi Eze', 'AM', 'ENG', 1998], ['Ben White', 'RB', 'ENG', 1997], ['Riccardo Calafiori', 'LB', 'ITA', 2002], ['Kai Havertz', 'ST', 'GER', 1999] ] },
  Chelsea: { players: [
    ['Cole Palmer', 'AM', 'ENG', 2002], ['Enzo Fernández', 'CM', 'ARG', 2001], ['Moisés Caicedo', 'DM', 'ECU', 2001], ['Levi Colwill', 'CB', 'ENG', 2003],
    ['Reece James', 'RB', 'ENG', 1999], ['Robert Sánchez', 'GK', 'ESP', 1997], ['João Pedro', 'ST', 'BRA', 2001], ['Pedro Neto', 'RW', 'POR', 2000],
    ['Marc Cucurella', 'LB', 'ESP', 1998], ['Estêvão', 'RW', 'BRA', 2007], ['Trevoh Chalobah', 'CB', 'ENG', 1999], ['Liam Delap', 'ST', 'ENG', 2003] ] },
  'Manchester United': { coach: ['Rúben Amorim', 'POR', 1985], players: [
    ['Bruno Fernandes', 'AM', 'POR', 1994], ['Matheus Cunha', 'AM', 'BRA', 1999], ['Bryan Mbeumo', 'RW', 'CMR', 1999], ['Benjamin Šeško', 'ST', 'SVN', 2003],
    ['Casemiro', 'DM', 'BRA', 1992], ['Lisandro Martínez', 'CB', 'ARG', 1998], ['Leny Yoro', 'CB', 'FRA', 2005], ['Kobbie Mainoo', 'CM', 'ENG', 2005],
    ['Diogo Dalot', 'RB', 'POR', 1999], ['Luke Shaw', 'LB', 'ENG', 1995], ['Altay Bayındır', 'GK', 'TUR', 1998], ['Amad Diallo', 'RW', 'CIV', 2002] ] },
  'Tottenham Hotspur': { coach: ['Thomas Frank', 'DEN', 1973], players: [
    ['Son Heung-min', 'LW', 'KOR', 1992], ['James Maddison', 'AM', 'ENG', 1996], ['Cristian Romero', 'CB', 'ARG', 1998], ['Micky van de Ven', 'CB', 'NED', 2001],
    ['Guglielmo Vicario', 'GK', 'ITA', 1996], ['Dejan Kulusevski', 'RW', 'SWE', 2000], ['Xavi Simons', 'AM', 'NED', 2003], ['João Palhinha', 'DM', 'POR', 1995],
    ['Pedro Porro', 'RB', 'ESP', 1999], ['Richarlison', 'ST', 'BRA', 1997], ['Mohammed Kudus', 'RW', 'GHA', 2000], ['Destiny Udogie', 'LB', 'ITA', 2002] ] },
  'Real Madrid': { players: [
    ['Kylian Mbappé', 'ST', 'FRA', 1998], ['Vinícius Júnior', 'LW', 'BRA', 2000], ['Jude Bellingham', 'AM', 'ENG', 2003], ['Federico Valverde', 'CM', 'URU', 1998],
    ['Thibaut Courtois', 'GK', 'BEL', 1992], ['Aurélien Tchouaméni', 'DM', 'FRA', 2000], ['Rodrygo', 'RW', 'BRA', 2001], ['Eduardo Camavinga', 'CM', 'FRA', 2002],
    ['Antonio Rüdiger', 'CB', 'GER', 1993], ['Dean Huijsen', 'CB', 'ESP', 2005], ['Trent Alexander-Arnold', 'RB', 'ENG', 1998], ['Álvaro Carreras', 'LB', 'ESP', 2003], ['Arda Güler', 'AM', 'TUR', 2005] ] },
  'FC Barcelona': { coach: ['Hansi Flick', 'GER', 1965], players: [
    ['Lamine Yamal', 'RW', 'ESP', 2007], ['Raphinha', 'LW', 'BRA', 1996], ['Robert Lewandowski', 'ST', 'POL', 1988], ['Pedri', 'CM', 'ESP', 2002],
    ['Gavi', 'CM', 'ESP', 2004], ['Frenkie de Jong', 'CM', 'NED', 1997], ['Marc-André ter Stegen', 'GK', 'GER', 1992], ['Joan García', 'GK', 'ESP', 2001],
    ['Ronald Araújo', 'CB', 'URU', 1999], ['Pau Cubarsí', 'CB', 'ESP', 2007], ['Jules Koundé', 'RB', 'FRA', 1998], ['Alejandro Balde', 'LB', 'ESP', 2003], ['Dani Olmo', 'AM', 'ESP', 1998], ['Ferran Torres', 'ST', 'ESP', 2000] ] },
  'Atlético de Madrid': { coach: ['Diego Simeone', 'ARG', 1970], players: [
    ['Julián Álvarez', 'ST', 'ARG', 2000], ['Antoine Griezmann', 'AM', 'FRA', 1991], ['Jan Oblak', 'GK', 'SVN', 1993], ['Koke', 'CM', 'ESP', 1992],
    ['Alexander Sørloth', 'ST', 'NOR', 1995], ['Marcos Llorente', 'RB', 'ESP', 1995], ['Robin Le Normand', 'CB', 'ESP', 1996], ['Pablo Barrios', 'CM', 'ESP', 2003],
    ['Conor Gallagher', 'CM', 'ENG', 2000], ['José María Giménez', 'CB', 'URU', 1995], ['Álex Baena', 'AM', 'ESP', 2001], ['Nahuel Molina', 'RB', 'ARG', 1998] ] },
  Inter: { coach: ['Cristian Chivu', 'ROU', 1980], players: [
    ['Lautaro Martínez', 'ST', 'ARG', 1997], ['Nicolò Barella', 'CM', 'ITA', 1997], ['Hakan Çalhanoğlu', 'DM', 'TUR', 1994], ['Alessandro Bastoni', 'CB', 'ITA', 1999],
    ['Yann Sommer', 'GK', 'SUI', 1988], ['Marcus Thuram', 'ST', 'FRA', 1997], ['Federico Dimarco', 'LB', 'ITA', 1997], ['Denzel Dumfries', 'RB', 'NED', 1996],
    ['Piotr Zieliński', 'CM', 'POL', 1994], ['Francesco Acerbi', 'CB', 'ITA', 1988], ['Henrikh Mkhitaryan', 'CM', 'ARM', 1989], ['Ange-Yoan Bonny', 'ST', 'FRA', 2003] ] },
  Juventus: { players: [
    ['Kenan Yıldız', 'LW', 'TUR', 2005], ['Dušan Vlahović', 'ST', 'SRB', 2000], ['Gleison Bremer', 'CB', 'BRA', 1997], ['Manuel Locatelli', 'DM', 'ITA', 1998],
    ['Michele Di Gregorio', 'GK', 'ITA', 1997], ['Teun Koopmeiners', 'CM', 'NED', 1998], ['Khéphren Thuram', 'CM', 'FRA', 2001], ['Andrea Cambiaso', 'LB', 'ITA', 2000],
    ['Jonathan David', 'ST', 'CAN', 2000], ['Lloyd Kelly', 'CB', 'ENG', 1998], ['Francisco Conceição', 'RW', 'POR', 2002], ['Pierre Kalulu', 'CB', 'FRA', 2000] ] },
  'AC Milan': { coach: ['Massimiliano Allegri', 'ITA', 1967], players: [
    ['Rafael Leão', 'LW', 'POR', 1999], ['Christian Pulisic', 'RW', 'USA', 1998], ['Luka Modrić', 'CM', 'CRO', 1985], ['Mike Maignan', 'GK', 'FRA', 1995],
    ['Strahinja Pavlović', 'CB', 'SRB', 2001], ['Youssouf Fofana', 'CM', 'FRA', 1999], ['Adrien Rabiot', 'CM', 'FRA', 1995], ['Santiago Giménez', 'ST', 'MEX', 2001],
    ['Fikayo Tomori', 'CB', 'ENG', 1997], ['Alexis Saelemaekers', 'RW', 'BEL', 1999], ['Davide Bartesaghi', 'LB', 'ITA', 2005], ['Matteo Gabbia', 'CB', 'ITA', 1999] ] },
  Napoli: { coach: ['Antonio Conte', 'ITA', 1969], players: [
    ['Kevin De Bruyne', 'AM', 'BEL', 1991], ['Scott McTominay', 'CM', 'SCO', 1996], ['Romelu Lukaku', 'ST', 'BEL', 1993], ['Alessandro Buongiorno', 'CB', 'ITA', 1999],
    ['Stanislav Lobotka', 'DM', 'SVK', 1994], ['Amir Rrahmani', 'CB', 'KOS', 1994], ['Giovanni Di Lorenzo', 'RB', 'ITA', 1993], ['Alex Meret', 'GK', 'ITA', 1997],
    ['David Neres', 'RW', 'BRA', 1997], ['Matteo Politano', 'RW', 'ITA', 1993], ['Miguel Gutiérrez', 'LB', 'ESP', 2001], ['Rasmus Højlund', 'ST', 'DEN', 2003] ] },
  'Bayern München': { coach: ['Vincent Kompany', 'BEL', 1986], players: [
    ['Harry Kane', 'ST', 'ENG', 1993], ['Jamal Musiala', 'AM', 'GER', 2003], ['Michael Olise', 'RW', 'FRA', 2001], ['Joshua Kimmich', 'DM', 'GER', 1995],
    ['Manuel Neuer', 'GK', 'GER', 1986], ['Luis Díaz', 'LW', 'COL', 1997], ['Dayot Upamecano', 'CB', 'FRA', 1998], ['Jonathan Tah', 'CB', 'GER', 1996],
    ['Alphonso Davies', 'LB', 'CAN', 2000], ['Konrad Laimer', 'RB', 'AUT', 1997], ['Aleksandar Pavlović', 'CM', 'GER', 2004], ['Serge Gnabry', 'RW', 'GER', 1995] ] },
  'Borussia Dortmund': { coach: ['Niko Kovač', 'CRO', 1971], players: [
    ['Serhou Guirassy', 'ST', 'GUI', 1996], ['Julian Brandt', 'AM', 'GER', 1996], ['Nico Schlotterbeck', 'CB', 'GER', 1999], ['Gregor Kobel', 'GK', 'SUI', 1997],
    ['Felix Nmecha', 'CM', 'GER', 2000], ['Karim Adeyemi', 'LW', 'GER', 2002], ['Waldemar Anton', 'CB', 'GER', 1996], ['Maximilian Beier', 'ST', 'GER', 2002],
    ['Jobe Bellingham', 'CM', 'ENG', 2005], ['Ramy Bensebaini', 'LB', 'ALG', 1995], ['Daniel Svensson', 'LB', 'SWE', 2002], ['Carney Chukwuemeka', 'AM', 'ENG', 2003] ] },
  'Bayer Leverkusen': { players: [
    ['Florian Wirtz', 'AM', 'GER', 2003], ['Granit Xhaka', 'CM', 'SUI', 1992], ['Jonathan Tah', 'CB', 'GER', 1996], ['Alejandro Grimaldo', 'LB', 'ESP', 1995],
    ['Piero Hincapié', 'CB', 'ECU', 2002], ['Lukáš Hrádecký', 'GK', 'FIN', 1989], ['Exequiel Palacios', 'CM', 'ARG', 1998], ['Patrik Schick', 'ST', 'CZE', 1996],
    ['Jeremie Frimpong', 'RB', 'NED', 2000], ['Malik Tillman', 'AM', 'USA', 2002], ['Equi Fernández', 'DM', 'ARG', 2002], ['Loïc Badé', 'CB', 'FRA', 2000] ] },
  'Paris Saint-Germain': { coach: ['Luis Enrique', 'ESP', 1970], players: [
    ['Ousmane Dembélé', 'RW', 'FRA', 1997], ['Vitinha', 'CM', 'POR', 2000], ['Achraf Hakimi', 'RB', 'MAR', 1998], ['Marquinhos', 'CB', 'BRA', 1994],
    ['Gianluigi Donnarumma', 'GK', 'ITA', 1999], ['Khvicha Kvaratskhelia', 'LW', 'GEO', 2001], ['Bradley Barcola', 'LW', 'FRA', 2002], ['João Neves', 'CM', 'POR', 2004],
    ['Fabián Ruiz', 'CM', 'ESP', 1996], ['Nuno Mendes', 'LB', 'POR', 2002], ['Willian Pacho', 'CB', 'ECU', 2001], ['Désiré Doué', 'AM', 'FRA', 2005], ['Lucas Chevalier', 'GK', 'FRA', 2001] ] },
  'Olympique de Marseille': { coach: ['Roberto De Zerbi', 'ITA', 1979], players: [
    ['Mason Greenwood', 'ST', 'ENG', 2001], ['Pierre-Emerick Aubameyang', 'ST', 'GAB', 1989], ['Amine Harit', 'AM', 'MAR', 1997], ['Geoffrey Kondogbia', 'DM', 'CAF', 1993],
    ['Leonardo Balerdi', 'CB', 'ARG', 1999], ['Gerónimo Rulli', 'GK', 'ARG', 1992], ['Pierre-Emile Højbjerg', 'DM', 'DEN', 1995], ['Quentin Merlin', 'LB', 'FRA', 2002],
    ['Timothy Weah', 'RW', 'USA', 2000], ['Facundo Medina', 'CB', 'ARG', 1999], ['Matt O\'Riley', 'CM', 'ENG', 2000], ['Angel Gomes', 'CM', 'ENG', 2000] ] },
  'Al Hilal': { players: [
    ['Rúben Neves', 'DM', 'POR', 1997], ['Sergej Milinković-Savić', 'CM', 'SRB', 1995], ['Aleksandar Mitrović', 'ST', 'SRB', 1994], ['Kalidou Koulibaly', 'CB', 'SEN', 1991],
    ['Yassine Bounou', 'GK', 'MAR', 1991], ['Malcom', 'RW', 'BRA', 1997], ['Salem Al-Dawsari', 'LW', 'KSA', 1991], ['João Cancelo', 'RB', 'POR', 1994],
    ['Theo Hernández', 'LB', 'FRA', 1997], ['Marcos Leonardo', 'ST', 'BRA', 2003], ['Mohamed Kanno', 'CM', 'KSA', 1994], ['Ali Al-Bulayhi', 'CB', 'KSA', 1989] ] },
  'Al Nassr': { coach: ['Jorge Jesus', 'POR', 1954], players: [
    ['Cristiano Ronaldo', 'ST', 'POR', 1985], ['Sadio Mané', 'LW', 'SEN', 1992], ['João Félix', 'AM', 'POR', 1999], ['Kingsley Coman', 'RW', 'FRA', 1996],
    ['Aymeric Laporte', 'CB', 'ESP', 1994], ['Marcelo Brozović', 'DM', 'CRO', 1992], ['Inigo Martínez', 'CB', 'ESP', 1991], ['Bento', 'GK', 'BRA', 1999],
    ['Ângelo', 'LW', 'BRA', 2004], ['Mohamed Simakan', 'CB', 'FRA', 2000], ['Ayman Yahya', 'LW', 'KSA', 2001], ['Abdulrahman Ghareeb', 'AM', 'KSA', 1997] ] },
  'Al Ittihad': { players: [
    ['Karim Benzema', 'ST', 'FRA', 1987], ['N\'Golo Kanté', 'DM', 'FRA', 1991], ['Fabinho', 'DM', 'BRA', 1993], ['Houssem Aouar', 'CM', 'ALG', 1998],
    ['Steven Bergwijn', 'LW', 'NED', 1997], ['Danilo Pereira', 'CB', 'POR', 1991], ['Marcelo Grohe', 'GK', 'BRA', 1987], ['Moussa Diaby', 'RW', 'FRA', 1999],
    ['Ahmed Hegazi', 'CB', 'EGY', 1991], ['Abdulaziz Al-Bishi', 'LB', 'KSA', 1995] ] },
  'Al Ahli': { players: [
    ['Riyad Mahrez', 'RW', 'ALG', 1991], ['Roberto Firmino', 'ST', 'BRA', 1991], ['Franck Kessié', 'CM', 'CIV', 1996], ['Édouard Mendy', 'GK', 'SEN', 1992],
    ['Ivan Toney', 'ST', 'ENG', 1996], ['Allan Saint-Maximin', 'LW', 'FRA', 1997], ['Merih Demiral', 'CB', 'TUR', 1998], ['Galeno', 'LW', 'BRA', 1997],
    ['Matteo Dams', 'CB', 'BEL', 2000], ['Ali Majrashi', 'RB', 'KSA', 1998] ] },
  Benfica: { players: [
    ['Ángel Di María', 'RW', 'ARG', 1988], ['Nicolás Otamendi', 'CB', 'ARG', 1988], ['Orkun Kökçü', 'CM', 'TUR', 2000], ['Vangelis Pavlidis', 'ST', 'GRE', 1998],
    ['Anatoliy Trubin', 'GK', 'UKR', 2001], ['Florentino Luís', 'DM', 'POR', 1999], ['Álvaro Carreras', 'LB', 'ESP', 2003], ['Fredrik Aursnes', 'CM', 'NOR', 1995],
    ['António Silva', 'CB', 'POR', 2003], ['Richard Ríos', 'CM', 'COL', 2000] ] },
  'FC Porto': { players: [
    ['Samu Aghehowa', 'ST', 'ESP', 2004], ['Diogo Costa', 'GK', 'POR', 1999], ['Alan Varela', 'DM', 'ARG', 2001], ['Francisco Moura', 'LB', 'POR', 1999],
    ['Pepê', 'RW', 'BRA', 1997], ['Gabri Veiga', 'CM', 'ESP', 2002], ['Nehuén Pérez', 'CB', 'ARG', 2000], ['Jan Bednarek', 'CB', 'POL', 1996],
    ['William Gomes', 'LW', 'BRA', 2006], ['Rodrigo Mora', 'AM', 'POR', 2007] ] },
  'Sporting CP': { players: [
    ['Viktor Gyökeres', 'ST', 'SWE', 1998], ['Morten Hjulmand', 'DM', 'DEN', 1999], ['Pedro Gonçalves', 'AM', 'POR', 1998], ['Ousmane Diomande', 'CB', 'CIV', 2003],
    ['Franco Israel', 'GK', 'URU', 2000], ['Geny Catamo', 'RW', 'MOZ', 2000], ['Maxi Araújo', 'LW', 'URU', 2000], ['Gonçalo Inácio', 'CB', 'POR', 2001],
    ['Conrad Harder', 'ST', 'DEN', 2005], ['Francisco Trincão', 'RW', 'POR', 1999] ] },
  Ajax: { players: [
    ['Jorrel Hato', 'CB', 'NED', 2006], ['Kenneth Taylor', 'CM', 'NED', 2002], ['Brian Brobbey', 'ST', 'NED', 2002], ['Jordan Henderson', 'CM', 'ENG', 1990],
    ['Remko Pasveer', 'GK', 'NED', 1983], ['Mika Godts', 'LW', 'BEL', 2005], ['Oscar Gloukh', 'AM', 'ISR', 2004], ['Anton Gaaei', 'RB', 'DEN', 2003] ] },
  'PSV Eindhoven': { players: [
    ['Luuk de Jong', 'ST', 'NED', 1990], ['Ismael Saibari', 'AM', 'MAR', 2001], ['Jerdy Schouten', 'DM', 'NED', 1997], ['Matteo Dams', 'CB', 'BEL', 2000],
    ['Walter Benítez', 'GK', 'ARG', 1993], ['Johan Bakayoko', 'RW', 'BEL', 2003], ['Couhaib Driouech', 'LW', 'MAR', 2001], ['Joey Veerman', 'CM', 'NED', 1998] ] },
  Flamengo: { players: [
    ['Giorgian de Arrascaeta', 'AM', 'URU', 1994], ['Pedro', 'ST', 'BRA', 1997], ['Gerson', 'CM', 'BRA', 1997], ['Jorginho', 'DM', 'ITA', 1991],
    ['Agustín Rossi', 'GK', 'ARG', 1995], ['Léo Pereira', 'CB', 'BRA', 1996], ['Danilo', 'CB', 'BRA', 1991], ['Luiz Araújo', 'RW', 'BRA', 1996], ['Bruno Henrique', 'LW', 'BRA', 1990] ] },
  Palmeiras: { players: [
    ['Raphael Veiga', 'AM', 'BRA', 1995], ['Estêvão Willian', 'RW', 'BRA', 2007], ['Weverton', 'GK', 'BRA', 1987], ['Gustavo Gómez', 'CB', 'PAR', 1993],
    ['Rony', 'LW', 'BRA', 1995], ['Mauricio', 'AM', 'BRA', 2001], ['Murilo', 'CB', 'BRA', 1997], ['Aníbal Moreno', 'DM', 'ARG', 1999] ] },
  'Inter Miami CF': { players: [
    ['Lionel Messi', 'RW', 'ARG', 1987], ['Luis Suárez', 'ST', 'URU', 1987], ['Sergio Busquets', 'DM', 'ESP', 1988], ['Jordi Alba', 'LB', 'ESP', 1989],
    ['Rodrigo De Paul', 'CM', 'ARG', 1994], ['Tadeo Allende', 'LW', 'ARG', 1999], ['Oscar Ustari', 'GK', 'ARG', 1986], ['Telasco Segovia', 'AM', 'VEN', 2003] ] },
  'LA Galaxy': { players: [
    ['Riqui Puig', 'CM', 'ESP', 1999], ['Joseph Paintsil', 'RW', 'GHA', 1998], ['Gabriel Pec', 'LW', 'BRA', 2001], ['Maya Yoshida', 'CB', 'JPN', 1988],
    ['Novak Micovic', 'GK', 'MNE', 1993], ['Marco Reus', 'AM', 'GER', 1989], ['Gastón Brugman', 'DM', 'URU', 1992], ['Julian Hall', 'ST', 'USA', 2008] ] },
};

/** `REAL_CLUB_NAMES` with a coach and starter squad attached to the clubs listed above (matched by club name). */
export const REAL_CLUBS_WITH_SQUADS: DataPack = {
  ...REAL_CLUB_NAMES,
  id: 'real-clubs-starter-squads-2025',
  name: 'Real clubs with starter squads (unverified)',
  source: 'Club names and squads written from the authors\' memory of 2025/26; unverified, may be outdated or incorrect',
  licence: 'Names only; trademarks and likenesses belong to their owners; no ratings, images or official data included',
  leagues: Object.fromEntries(Object.entries(REAL_CLUB_NAMES.leagues).map(([lid, list]) => [lid, list.map((c): PackClub => {
    const s = S[c.name];
    if (!s) return c;
    const players: PackPlayer[] = s.players.map(([name, position, nationality, birthYear]) => ({ name, position, nationality, birthYear }));
    return { ...c, players, ...(s.coach ? { manager: { name: s.coach[0], nationality: s.coach[1], birthYear: s.coach[2] } } : {}) };
  })])),
};
