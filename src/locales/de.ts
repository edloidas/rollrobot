import { playground, reference } from './links';
import type { Messages } from './types';

export const de: Messages = {
  inline: { roll: 'Wurf', full: 'Aufschlüsselung', random: 'Zufallswurf', help: 'Anleitung' },

  help: `Würfle wie noch nie — vollständige Rollenspiel-Notation mit Behalten/Verwerfen, explodierenden Würfeln, Wiederholungswürfen, Erfolgspools und Proben.

<b>Befehle</b>
/roll [Notation] — würfelt und zeigt die Summe (Kurzform: /r)
/full [Notation] — würfelt mit Aufschlüsselung pro Würfel (Kurzform: /f)
/random — würfelt d100 (<code>d%</code>)
/help — diese Anleitung

Inline: tippe @rollrobot [Notation] in jedem Chat, oder wähle einen Eintrag aus der Liste.

<b>Notation</b>
<code>2d20+5</code> — Würfeln und Rechnen: + - * / und Klammern
<code>4d6kh3</code> — die höchsten 3 behalten (auch kl, dh, dl)
<code>d8!</code> — explodierende Würfel
<code>2d6r&lt;3</code> — unter 3 neu würfeln (ro — einmal neu würfeln)
<code>4d6min2</code> — jeden Würfel auf mindestens 2 anheben (auch max)
<code>6d10&gt;=6f1</code> — Erfolge zählen, 1er als Fehlschläge abziehen
<code>1d20+7 vs 15</code> — Probe gegen einen SG mit Erfolgsgraden
<code>4dF</code> — Fate-Würfel
<code>d%</code> — Prozentwürfel
<code>2d6+floor(1d4/2)</code> — Funktionen: floor, ceil, round, abs, min, max, sqrt, pow

Kurzschreibweise: <code>/roll 20</code> würfelt d20, <code>/roll 2 10 -1</code> würfelt 2d10-1.

Benenne einen Wurf, indem du ihn am Ende in Anführungszeichen setzt: <code>/roll 2d20+1 "Wahrnehmung"</code>.

Probiere die Notation im ${playground('Playground')} aus, oder lies die ${reference('vollständige Notationsreferenz')}.`,

  commands: [
    { command: 'roll', description: 'Würfeln — /roll 2d20kh1+5' },
    { command: 'full', description: 'Würfeln mit Aufschlüsselung — /full 4d6kh3' },
    { command: 'random', description: 'Würfeln — d100' },
    { command: 'help', description: 'Notationsanleitung und Links' },
  ],

  shortDescription:
    'Rollenspiel-Würfel in jedem Chat — D&D, Pathfinder, World of Darkness, Shadowrun, Fate, Call of Cthulhu.',

  description: `Würfelnotation für Pen-and-Paper-Rollenspiele, in jedem Chat.

4d6kh3 für Attribute
2d20kh1+7 mit Vorteil
1d20+12 vs 20 für eine Pathfinder-Probe
7d10>=6f1 für einen Storyteller-Pool
{1d8!, 1d6!}kh1 für Savage Worlds
4dF für Fate
d% für Call of Cthulhu

/roll liefert die Summe, /full die Aufschlüsselung pro Würfel, /help die Notationsübersicht. Tippe @rollrobot in jedem Chat, um ohne Hinzufügen des Bots zu würfeln.`,
};
