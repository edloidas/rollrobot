import { manual, manualUrl, playground, reference } from './links';
import type { Messages } from './types';

export const de: Messages = {
  inline: {
    roll: 'Wurf',
    full: 'Aufschlüsselung',
    random: 'Zufallswurf',
    ask: 'Frage',
    pick: 'Auswahl',
    answer: 'Antwortet Yes oder No',
    help: 'Anleitung',
  },

  pick: {
    usage: 'Gib mir mindestens zwei Optionen — /pick Goblin-Patrouille | Leerer Raum',
    tooMany: 'Zu viele Optionen — höchstens 100.',
    spaceSplit: 'Jedes Wort wurde zu einer Option — nutze , oder | für mehrteilige Optionen.',
  },

  help: `Würfelnotation für Rollenspiele, in jedem Chat gewürfelt.

${manual('Vollständige Anleitung', 'de')}

<b>Befehle</b>
/roll [Notation] — würfelt und zeigt die Summe
/full [Notation] — würfelt und schlüsselt Würfel für Würfel auf
/random — würfelt d100 (<code>d%</code>)
/ask [Frage] — antwortet Yes oder No
/pick [Optionen] — wählt eine zufällig aus (beta)
/help — diese Anleitung

Inline: tippe @rollrobot [Notation] in jeden Chat oder wähle einen Vorschlag aus der Liste.

<b>Notation</b>
<code>2d20+5</code> — Würfel und Rechnen: + - * / und Klammern
<code>4d6kh3</code> — die 3 höchsten behalten (auch kl, dh, dl)
<code>d8!</code> — explodierende Würfel
<code>2d6r&lt;3</code> — unter 3 neu würfeln (ro — einmal neu würfeln)
<code>4d6min2</code> — jeden Würfel auf mindestens 2 anheben (auch max)
<code>6d10&gt;=6f1</code> — Erfolge zählen, 1er als Fehlschläge abziehen
<code>1d20+7 vs 15</code> — Probe gegen einen SG, Erfolgsgrade nach Pathfinder 2e
<code>4dF</code> — Fate-Würfel
<code>d%</code> — Prozentwürfel
<code>2d6+floor(1d4/2)</code> — Funktionen: floor, ceil, round, abs, min, max, sqrt, pow

<b>Fragen und Auswählen</b>
<code>/ask Hat die Tür eine Falle?</code> — alles nach dem Befehl ist die Frage
<code>/pick Goblin-Patrouille | Leerer Raum</code> — mindestens zwei Optionen, getrennt durch , | ; oder Zeilenumbruch

Probiere die Notation im ${playground('Playground')} aus oder lies die ${reference('vollständige Notationsreferenz')}.`,

  commands: [
    { command: 'roll', description: 'Würfeln — /roll 2d20kh1+5' },
    { command: 'full', description: 'Würfeln mit Aufschlüsselung — /full 4d6kh3' },
    { command: 'random', description: 'd100 würfeln' },
    { command: 'ask', description: 'Mit Yes oder No antworten — /ask Sollen wir angreifen?' },
    {
      command: 'pick',
      description: 'Zufällig eine Option wählen — /pick Goblin-Patrouille | Leerer Raum',
    },
    { command: 'help', description: 'Notationsanleitung und Links' },
  ],

  shortDescription:
    'Rollenspiel-Würfel in jedem Chat — D&D, Pathfinder, World of Darkness, Shadowrun, Fate, Call of Cthulhu.',

  description: `Würfelnotation für Rollenspiele, in jedem Chat gewürfelt.
${manualUrl('de')}

4d6kh3 für Attributswerte
2d20kh1+7 mit Vorteil
1d20+12 vs 20 für eine Probe in Pathfinder 2e
7d10>=6f1 für einen Storyteller-Pool
{1d8!, 1d6!}kh1 für Savage Worlds
4dF für Fate
d% für Call of Cthulhu

/roll liefert die Summe, /full die Aufschlüsselung, /ask ein Yes oder No, /pick eine zufällige Option (beta), /help die Notationsanleitung. Tippe @rollrobot in jeden Chat, um zu würfeln, ohne den Bot hinzuzufügen.`,
};
