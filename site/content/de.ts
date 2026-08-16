import type { Manual } from './types';

export const de: Manual = {
  meta: {
    title: 'Roll Robot — Würfel für Rollenspiele in jedem Telegram-Chat',
    description:
      'Vollständige Rollenspiel-Notation in Telegram: Behalten/Verwerfen, explodierende Würfel, Wiederholungswürfe, Würfelpools und Proben.',
    social: 'Telegram-Bot für Rollenspiel-Würfel. Von edloidas.io',
  },
  hero: {
    tagline:
      'Rollenspiel-Würfel in jedem Chat — D&D, Pathfinder, World of Darkness, Shadowrun, Fate, Call of Cthulhu.',
    cta: 'In Telegram öffnen',
  },
  gettingStarted: {
    heading: 'Erste Schritte',
    body: [
      'Öffne `@rollrobot`, drücke Start, schick `/roll 2d6+3`. Du bekommst den erkannten Ausdruck und die Summe.',
      'Ihr spielt in der Gruppe? Füge den Bot dem Chat hinzu. Er antwortet auf die Nachricht, die ihn aufgerufen hat, sodass mehrere gleichzeitig würfeln können und jede Antwort bei ihrer Frage bleibt. Er braucht die Erlaubnis, Nachrichten zu senden, sonst bleibt er stumm.',
      'In einem Chat, dem du ihn nicht hinzufügen kannst, nutze den Inline-Modus: schreib `@rollrobot 2d6+3` und tippe auf das Ergebnis. Funktioniert überall, tritt keinem Chat bei.',
    ],
  },
  commands: {
    heading: 'Befehle',
    intro:
      'Fünf Befehle, in Privatchats und Gruppen dieselben. `/roll` und `/full` nehmen Notation; ohne Argument würfelt jeder ein einfaches `d20`.',
    items: [
      {
        command: 'roll',
        shortcut: 'r',
        summary:
          'Die Summe, dazu der normalisierte Ausdruck, damit du prüfen kannst, was gelesen wurde.',
        examples: [{ notation: '2d6+3', rng: [4, 6], mode: 'compact' }],
      },
      {
        command: 'full',
        shortcut: 'f',
        summary:
          'Derselbe Wurf, Würfel für Würfel. Verworfene durchgestrichen, Erfolge fett, Fehlschläge unterstrichen, ein natürliches Maximum oder Minimum mit einem Pfeil.',
        examples: [{ notation: '4d6kh3', rng: [6, 5, 3, 1], mode: 'full' }],
      },
      {
        command: 'random',
        summary:
          '`d100` und sonst nichts, wenn du einfach eine Zahl bis hundert brauchst. Dasselbe wie `/roll d100`.',
        examples: [{ notation: 'd100', rng: [73], mode: 'compact' }],
      },
      {
        command: 'ask',
        shortcut: 'a',
        summary:
          'Eine Ja-oder-Nein-Antwort für die Entscheidungen, die keinen Wurf wert sind — hat die Tür eine Falle, feilscht der Händler, regnet es heute Nacht. Alles nach dem Befehl ist die Frage und wird über der Antwort zitiert.',
        notes: [
          'Keine Anführungszeichen nötig. Satzzeichen, Apostrophe und Notation sind in der Frage alle unbedenklich.',
          'Ein bloßes `/ask` geht auch: keine Frage, nur die Antwort — für das, was am Tisch ohnehin schon ausgesprochen wurde.',
          'Die Antwort ist ein `d2`, also eine faire Münze und nicht mehr.',
          'Yes und No bleiben in jeder Sprache englisch — deine Oberflächensprache verrät wenig über die Sprache des Chats.',
        ],
        examples: [
          { kind: 'ask', question: 'Sollen wir die Tür öffnen?', answer: 'yes' },
          { kind: 'ask', answer: 'no' },
        ],
      },
      {
        command: 'help',
        summary:
          'Die Notationsanleitung in einer Nachricht, mit Links zum Playground und zur Referenz. Diese Seite in kurz, ohne Telegram zu verlassen. `/start` gibt dasselbe aus.',
      },
    ],
  },
  betaFeatures: {
    heading: 'Beta-Funktionen',
    intro:
      'Benutzbar, aber noch nicht festgelegt: Was hier steht, kann sich in einem späteren Update ändern oder ganz aus dem Bot verschwinden. Die fünf Befehle oben nicht.',
    items: [
      {
        command: 'pick',
        shortcut: 'p',
        summary:
          'Wählt eine Option aus einer Liste, die du vorgibst — eine Zufallsbegegnung, wer die erste Wache übernimmt, welche Tür. Ein Würfel über die Optionen, ohne Gewichtung, sofern du keine vorgibst.',
        notes: [
          'Mindestens zwei Optionen, höchstens hundert.',
          'Ein Komma genügt — `Vorbeischleichen, Verhandeln`. `|` und `;` tun dasselbe, und ein Zeilenumbruch schlägt beide, sodass eine eingefügte Tabelle Zeile für Zeile aufgeteilt wird.',
          'Nur das erste vorhandene Trennzeichen zählt, in dieser Reihenfolge: Zeilenumbruch, dann `|` oder `;`, dann Komma, dann einfache Leerzeichen. Nimm `|`, wenn eine Option ein Komma enthält — `Seil, 15 m | Fackel` ergibt zwei Optionen, nicht drei.',
          'Wiederhole eine Option, um sie zu gewichten: jede Kopie belegt einen Platz in der Liste.',
          'Ein Name in Anführungszeichen am Ende benennt die Auswahl, statt in die Liste zu wandern.',
        ],
        examples: [
          {
            kind: 'pick',
            input: 'Goblin-Patrouille | Leerer Raum | Schatzkammer',
            choice: 'Leerer Raum',
          },
          {
            kind: 'pick',
            input: 'Vorbeischleichen, Verhandeln, Einen Hinterhalt legen',
            choice: 'Verhandeln',
          },
        ],
      },
    ],
  },
  specialFeatures: {
    heading: 'Besonderheiten',
    intro:
      'Nichts davon braucht es für einen gewöhnlichen Wurf. Es ist das, was der Bot für alle hat, die ihn jede Sitzung nutzen und sich die Tipperei sparen wollen.',
    items: [
      {
        title: 'Namen in Anführungszeichen',
        description:
          'Ein Name in doppelten Anführungszeichen am Ende eines Wurfs wird über dem Ergebnis zitiert, damit ein Chat voller nackter Zahlen lesbar bleibt. Das gilt für `/roll`, `/full` und `/pick` gleichermaßen, und die typografischen Anführungszeichen, die eine Handytastatur einsetzt, werden ebenso akzeptiert wie gerade.',
        important:
          '**Die Anführungszeichen sind nicht optional.** Der Parser akzeptiert so viel, dass ein Wort ohne Anführungszeichen nicht sicher von Notation zu unterscheiden ist, also wird `2d20kh1+7 Wahrnehmung` als Notation gelesen und schlägt fehl, während `2d20kh1+7 "Wahrnehmung"` würfelt und den Namen übernimmt.',
        example: {
          notation: '2d20kh1+7',
          rng: [8, 19],
          mode: 'compact',
          label: 'Wahrnehmung',
        },
      },
      {
        title: 'Schreibweise mit Leerzeichen',
        description:
          'Zwei oder drei durch Leerzeichen getrennte Zahlen werden als Wurf gelesen: `/roll 4 6` ist `4d6`, und `/roll 1 20 -3` ist `1d20-3`. Die dritte Zahl ist der Modifikator und trägt ihr eigenes Vorzeichen.',
        example: { notation: '1 20 -3', rng: [14], mode: 'compact' },
      },
      {
        title: 'Einzelne Zahlen',
        description: 'Eine Zahl allein ist ein Würfel: `/roll 20` würfelt ein `d20`.',
        example: { notation: '20', rng: [12], mode: 'compact' },
      },
      {
        title: 'Kyrillische Würfelbuchstaben',
        description:
          '`к` und `д` werden vor dem Parsen zu `d`, also würfelt `2к6` ein `2d6`. Russische, ukrainische und belarussische Notation funktionieren alle gleich, und das lateinische `k` in `kh` und `kl` bleibt unberührt.',
        example: { notation: '2к6', rng: [3, 5], mode: 'compact' },
      },
      {
        title: 'Persische Ziffern',
        description:
          '`۲۰` würfelt ein `d20`. Arabisch-indische und persische Ziffern werden vor dem Parsen zu ASCII; ein Name in Anführungszeichen behält seine eigenen Ziffern unverändert.',
        example: { notation: '۲۰', rng: [17], mode: 'compact' },
      },
    ],
  },
  inline: {
    heading: 'Inline-Modus',
    body: [
      'Tippe `@rollrobot` und Notation in jeden Chat, auch in Gruppen, die noch nie von dem Bot gehört haben. Über der Tastatur öffnet sich eine Liste; tippe auf ein Ergebnis, um es als eigene Nachricht zu senden.',
      '`@rollrobot 2d20kh1+7` bietet einen Wurf unter zwei Überschriften an, „Wurf“ und „Aufschlüsselung“. Die Wahl ändert die Darstellung, nicht die Würfel — nie ein neuer Wurf.',
      'Ohne etwas nach dem Handle bekommst du drei Vorschläge: „Wurf“ und „Aufschlüsselung“ auf einem `d20`, „Zufallswurf“ auf einem `d100`.',
      'Eine Frage ergänzt den Eintrag „Frage“, der die Liste anführt, wenn nichts gewürfelt wurde, und sie abschließt, wenn doch. Ein benanntes Trennzeichen zwischen zwei Dingen, die keine Notation sind — `Goblin-Patrouille | Leerer Raum` — setzt stattdessen „Auswahl“ nach oben. Leerzeichen allein zählen hier nicht, anders als bei `/pick`, sonst böte jede halb getippte Frage eine Auswahl unter ihrer Antwort an. Eine Inline-Auswahl trägt ihre Liste in der Nachricht, weil kein Befehl darüber steht, auf den sie antworten könnte.',
      'Ergebnisse sind persönlich und werden nicht zwischengespeichert, also würfelt jede Anfrage neu.',
    ],
  },
  notation: {
    heading: 'Notation',
    intro:
      'Was du tatsächlich tippst. Groß- und Kleinschreibung sowie Leerzeichen sind egal, `2 D 20 KH 1` und `2d20kh1` sind derselbe Wurf. Jede Gruppe unten endet dort, wo es noch nützlich ist; den Rest führt die Referenz auf, und der Playground führt ihn aus.',
    links: { playground: 'Playground', reference: 'Vollständige Notationsreferenz' },
    groups: [
      {
        heading: 'Würfel und Rechnen',
        rows: [
          { notation: '2d6', description: 'Zwei sechsseitige Würfel.' },
          { notation: 'd20', description: 'Die Anzahl ist standardmäßig eins.' },
          { notation: '2d20+5', description: 'Rechnen: + - * / und Klammern.' },
          {
            notation: '(1d6+2)*3',
            description: 'Klammern fassen zusammen, was du hineinschreibst.',
          },
          {
            notation: '(1d4)d6',
            description: 'Eine berechnete Anzahl: würfle `1d4`, dann so viele `d6`.',
          },
        ],
      },
      {
        heading: 'Behalten und verwerfen',
        rows: [
          { notation: '4d6kh3', description: 'Die höchsten drei behalten — ein Attributswert.' },
          { notation: '2d20kh1', description: 'Vorteil: der höhere von zwei `d20`.' },
          { notation: '2d20kl1', description: 'Nachteil: der niedrigere.' },
          {
            notation: '4d6dl1',
            description: 'Den niedrigsten verwerfen; `dh` verwirft den höchsten.',
          },
          {
            notation: '{1d8!, 1d6!}kh1',
            description:
              'Behalten über eine Gruppe hinweg — jeder Teilwurf tritt als ein Würfel an.',
          },
        ],
      },
      {
        heading: 'Explodierende Würfel',
        rows: [
          { notation: 'd8!', description: 'Der höchste Wert bringt einen weiteren Würfel.' },
          {
            notation: 'd8!!',
            description: 'Zusammengesetzt: der Zusatzwurf fließt in denselben Würfel.',
          },
          { notation: 'd8!p', description: 'Durchdringend: jeder weitere Würfel bekommt −1.' },
          {
            notation: '5d10!=10',
            description: 'Ab einem Schwellenwert explodieren, nicht erst auf der höchsten Seite.',
          },
        ],
      },
      {
        heading: 'Wiederholungswürfe und Begrenzungen',
        rows: [
          { notation: '2d6r<3', description: 'Unter 3 neu würfeln, so oft wie nötig.' },
          { notation: '2d6ro<3', description: 'Einmal neu würfeln, das zweite Ergebnis behalten.' },
          { notation: '4d6min2', description: 'Jeden Würfel auf mindestens 2 anheben.' },
          { notation: '4d6max5', description: 'Jeden Würfel auf höchstens 5 begrenzen.' },
        ],
      },
      {
        heading: 'Würfelpools und Proben',
        rows: [
          { notation: '12d6>=5', description: 'Jede 5 und 6 zählt als Erfolg.' },
          { notation: '7d10>=6f1', description: 'Erfolge zählen, 1er als Fehlschläge abziehen.' },
          {
            notation: '1d20+7 vs 15',
            description: 'Probe gegen einen SG, beantwortet als Erfolgsgrad.',
          },
        ],
      },
      {
        heading: 'Weitere Würfel und Funktionen',
        rows: [
          { notation: '4dF', description: 'Fate-Würfel, jeder −1, 0 oder +1.' },
          { notation: 'd%', description: 'Prozentwürfel — derselbe Würfel wie `1d100`.' },
          {
            notation: '2d6+floor(1d4/2)',
            description:
              'Funktionen: `floor`, `ceil`, `round`, `abs`, `min`, `max`, `sqrt`, `pow`.',
          },
        ],
      },
    ],
  },
  systems: {
    heading: 'Nach Spielsystem',
    intro: 'Der Wurf, zu dem jede Runde zuerst greift, fertig zum Kopieren.',
    items: [
      {
        system: 'D&D 5e',
        description: 'Angriff mit Vorteil: zwei `d20`, den höheren behalten, den Bonus addieren.',
        example: { notation: '2d20kh1+7', rng: [8, 19], mode: 'full' },
      },
      {
        system: 'Pathfinder 2e',
        description:
          'Eine Probe gegen einen SG. Zehn darüber ist ein kritischer Erfolg, zehn darunter ein kritischer Fehlschlag; eine natürliche 20 oder 1 verschiebt das Ergebnis um eine Stufe.',
        example: { notation: '1d20+12 vs 20', rng: [18], mode: 'full' },
      },
      {
        system: 'World of Darkness',
        description: 'Ein Storyteller-Pool: Erfolge ab 6, jede 1 hebt einen davon auf.',
        example: { notation: '7d10>=6f1', rng: [8, 6, 2, 10, 1, 4, 7], mode: 'full' },
      },
      {
        system: 'Shadowrun',
        description: 'Erfolge auf 5 und 6 im gesamten Pool.',
        example: {
          notation: '12d6>=5',
          rng: [5, 3, 6, 2, 4, 5, 1, 6, 3, 5, 2, 4],
          mode: 'full',
        },
      },
      {
        system: 'Savage Worlds',
        description:
          'Eigenschaftswürfel und Wildcard-Würfel, beide explodierend; der höhere von beiden zählt.',
        example: { notation: '{1d8!, 1d6!}kh1', rng: [5, 6, 3], mode: 'full' },
      },
      {
        system: 'Fate',
        description: 'Vier Fudge-Würfel plus ein Fertigkeitswert.',
        example: { notation: '4dF+2', rng: [1, 0, -1, 1], mode: 'full' },
      },
      {
        system: 'Call of Cthulhu',
        description: 'Mit Prozentwürfeln unter deinen Fertigkeitswert würfeln.',
        example: { notation: 'd%', rng: [37], mode: 'compact' },
      },
    ],
  },
  limits: {
    heading: 'Grenzen',
    body: [
      'Ein Wurf ist auf 100 Würfel und 100 Explosions- oder Wiederholungsdurchläufe begrenzt. Verlangst du mehr, sagt der Bot es, statt zu würfeln — diese Grenzen halten eine Antwort unter Telegrams 4096 Zeichen.',
      'Eine Aufschlüsselung, die trotzdem über 3500 Zeichen kommt, entfällt zugunsten der kompakten Antwort, damit ein großer Pool mit seiner Summe antwortet statt gar nicht.',
      '`/pick` nimmt höchstens 100 Optionen. Eine längere Liste wird abgelehnt, nicht gekürzt: die ersten hundert zu behalten würde jede Auswahl still nach oben verzerren und dabei aussehen, als hätte es funktioniert.',
      'Ein Name in Anführungszeichen wird auf 100 Zeichen gekürzt, eine Frage an `/ask` auf 300.',
    ],
  },
  faq: {
    heading: 'FAQ',
    items: [
      {
        question: 'Muss ich den Bot meiner Gruppe hinzufügen?',
        answer:
          'Nein. Tippe `@rollrobot` und Notation in jeden Chat und wähle ein Ergebnis — es wird als deine eigene Nachricht gesendet, und der Bot tritt nie bei. Hinzufügen lohnt sich erst, wenn am Tisch oft gewürfelt wird, weil ein Befehl kürzer zu tippen ist.',
      },
      {
        question: 'Liest der Bot meine Nachrichten?',
        answer:
          'Er reagiert nur auf das, was an ihn gerichtet ist: Befehle mit Schrägstrich und Inline-Anfragen, die mit `@rollrobot` beginnen. Normale Unterhaltung wird ignoriert — dafür gibt es keinen Handler.',
      },
      {
        question: 'Wird irgendetwas gespeichert?',
        answer:
          'Nein. Nichts von dem, was du schickst, wird aufbewahrt: nicht der Text einer Frage, nicht die Optionen einer Auswahlliste, nicht ein Name in Anführungszeichen, kein einziges Ergebnis. Aufgezeichnet wird die Form eines Wurfs und sonst nichts — `2d6`, `4d6kh3`, der Befehl, aus dem er kam — wobei die Telegram-Nutzer-ID auf einen gesalzenen Hash reduziert wird, damit wiederholte Nutzung gezählt werden kann, ohne das Konto zu identifizieren. Dieser Datensatz wird nur geschrieben, nie gelesen; er zeigt, welche Notation Unterstützung verdient, und lässt sich nicht in eine Unterhaltung zurückführen.',
      },
      {
        question: 'Sind die Würfe fair?',
        answer:
          'Jeder Wurf kommt frisch aus dem Generator von roll-parser, jedes Mal neu initialisiert. Nichts wird vorberechnet, und kein Ergebnis wird von einem Wurf zum nächsten übernommen.',
      },
      {
        question: 'Kann ich einen Wurf benennen?',
        answer:
          'Setz einen Namen am Ende in Anführungszeichen, und er erscheint über dem Ergebnis: `/roll 2d20kh1+7 "Wahrnehmung"`. Für `/pick` funktioniert es genauso.',
      },
      {
        question: 'Warum ist `4d6d1` ein Fehler?',
        answer:
          'Ein einzelnes `d` nach einem Pool ist mehrdeutig — einen verwerfen, oder so viele Würfel noch einmal würfeln? Schreib `4d6dl1`, um den niedrigsten zu verwerfen, oder `(4d6)d1` für verschachtelte Würfel.',
      },
      {
        question: 'Meine Notation wurde abgelehnt. Was jetzt?',
        answer:
          'Der Bot gibt zurück, was du geschickt hast, mit Dachzeichen unter der Stelle, die er nicht lesen konnte — die Korrektur steht damit meist schon in der Antwort. Knifflige Fälle sind im Playground schneller zu klären, verlinkt am Fuß dieser Seite.',
      },
      {
        question: 'Welche Sprache spricht der Bot?',
        answer:
          'Das Befehlsmenü, die Inline-Titel und die Notationsanleitung folgen deiner Telegram-Oberflächensprache: Englisch, Spanisch, Portugiesisch, Deutsch, Russisch, Ukrainisch, Belarussisch und Persisch; alles andere fällt auf Englisch zurück. Ergebnisse sind Notation und lesen sich überall gleich. Yes und No bleiben mit Absicht englisch — deine Oberflächensprache verrät wenig über die Sprache des Chats, in dem du schreibst.',
      },
    ],
  },
  footer: {
    playground: 'Playground',
    reference: 'Notationsreferenz',
    source: 'Quellcode',
  },
  a11y: {
    language: 'Sprache',
    theme: 'Design',
    themeModes: {
      auto: 'Design: System',
      light: 'Design: hell',
      dark: 'Design: dunkel',
    },
  },
};
