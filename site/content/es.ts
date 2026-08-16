import type { Manual } from './types';

export const es: Manual = {
  meta: {
    title: 'Roll Robot — dados de rol en cualquier chat de Telegram',
    description:
      'Notación de rol completa en Telegram: conservar/descartar, dados explosivos, nuevas tiradas, reservas de éxitos y pruebas.',
    social: 'Bot de Telegram para dados de rol. Creado por edloidas.io',
  },
  hero: {
    tagline:
      'Dados de rol en cualquier chat — D&D, Pathfinder, World of Darkness, Shadowrun, Fate, Call of Cthulhu.',
    cta: 'Abrir en Telegram',
  },
  gettingStarted: {
    heading: 'Primeros pasos',
    body: [
      'Abre `@rollrobot`, pulsa Iniciar y envía `/roll 2d6+3`. Te devuelve la expresión que ha leído y el total.',
      '¿Juegas en grupo? Añade el bot al chat. Responde al mensaje que lo llamó, así que varias personas pueden tirar a la vez y cada respuesta se queda junto a su pregunta. Necesita permiso para enviar mensajes; sin él, no dice nada.',
      'En un chat donde no puedas añadirlo, usa el modo en línea: escribe `@rollrobot 2d6+3` y toca el resultado. Funciona en cualquier parte y no entra en ningún sitio.',
    ],
  },
  commands: {
    heading: 'Comandos',
    intro:
      'Cinco comandos, iguales en privado y en grupos. `/roll` y `/full` aceptan notación; envía cualquiera de los dos a secas para un `d20` normal.',
    items: [
      {
        command: 'roll',
        shortcut: 'r',
        summary: 'El total, con la expresión normalizada para que compruebes qué ha leído.',
        examples: [{ notation: '2d6+3', rng: [4, 6], mode: 'compact' }],
      },
      {
        command: 'full',
        shortcut: 'f',
        summary:
          'La misma tirada, dado a dado. Descartados tachados, éxitos en negrita, fallos subrayados y una flecha en el natural máximo o mínimo.',
        examples: [{ notation: '4d6kh3', rng: [6, 5, 3, 1], mode: 'full' }],
      },
      {
        command: 'random',
        summary:
          '`d100` y nada más, para cuando solo necesitas un número de entre cien. Igual que `/roll d100`.',
        examples: [{ notation: 'd100', rng: [73], mode: 'compact' }],
      },
      {
        command: 'ask',
        shortcut: 'a',
        summary:
          'Una respuesta de sí o no para las decisiones que no merecen una tirada — si la puerta tiene trampa, si el mercader regatea, si esta noche llueve. Todo lo que va después del comando es la pregunta, y se cita encima de la respuesta.',
        notes: [
          'No hacen falta comillas. La puntuación, los apóstrofos y la notación caben sin problema dentro de la pregunta.',
          'Un `/ask` a secas también vale: sin pregunta, solo la respuesta, para lo que ya se ha dicho en voz alta en la mesa.',
          'La respuesta es un `d2`: una moneda justa y nada más.',
          'Yes y No siguen en inglés en todos los idiomas — el idioma de tu interfaz dice poco sobre el idioma del chat.',
        ],
        examples: [
          { kind: 'ask', question: '¿Abrimos la puerta?', answer: 'yes' },
          { kind: 'ask', answer: 'no' },
        ],
      },
      {
        command: 'help',
        summary:
          'La guía de notación en un solo mensaje, con enlaces al área de pruebas y a la referencia. Esta página en corto, sin salir de Telegram. `/start` muestra lo mismo.',
      },
    ],
  },
  betaFeatures: {
    heading: 'Funciones en beta',
    intro:
      'Ya funcionan, pero no están cerradas: lo que hay aquí puede cambiar de forma o desaparecer del bot en una actualización futura. Los cinco comandos de arriba, no.',
    items: [
      {
        command: 'pick',
        shortcut: 'p',
        summary:
          'Elige una opción de la lista que le des — un encuentro aleatorio, quién hace la primera guardia, qué puerta. Un dado sobre las opciones; nada pesa más salvo que tú lo digas.',
        notes: [
          'Dos opciones como mínimo, cien como máximo.',
          'Basta con una coma — `Colarse, Negociar`. `|` y `;` hacen lo mismo, y un salto de línea manda sobre ambos, así que una tabla pegada se parte fila a fila.',
          'Solo se usa el primer separador que aparezca, en ese orden: un salto de línea, luego `|` o `;`, luego una coma y por último los espacios. Recurre a `|` cuando una opción lleve coma — `Cuerda, 15 m | Antorcha` se parte en dos, no en tres.',
          'Repite una opción para darle más peso: ocupa un hueco de la lista por cada copia.',
          'Un nombre entre comillas al final titula la elección en lugar de sumarse a la lista.',
        ],
        examples: [
          {
            kind: 'pick',
            input: 'Patrulla de goblins | Sala vacía | Tesoro',
            choice: 'Sala vacía',
          },
          {
            kind: 'pick',
            input: 'Colarse, Negociar, Tender una emboscada',
            choice: 'Negociar',
          },
        ],
      },
    ],
  },
  specialFeatures: {
    heading: 'Funciones especiales',
    intro:
      'Nada de esto hace falta para una tirada normal. Es lo que el bot ofrece a quien lo usa cada sesión y quiere escribir lo menos posible.',
    items: [
      {
        title: 'Nombres entre comillas',
        description:
          'Un nombre entre comillas dobles al final de una tirada se cita encima del resultado, para que un chat lleno de números sueltos siga siendo legible. Funciona igual en `/roll`, `/full` y `/pick`, y las comillas tipográficas que pone el teclado del móvil valen tanto como las rectas.',
        important:
          '**Las comillas no son opcionales.** El analizador acepta tanto que una palabra sin comillas no se distingue de la notación con certeza: `2d20kh1+7 Percepción` se lee como notación y falla, mientras que `2d20kh1+7 "Percepción"` tira y toma el nombre.',
        example: {
          notation: '2d20kh1+7',
          rng: [8, 19],
          mode: 'compact',
          label: 'Percepción',
        },
      },
      {
        title: 'Forma con espacios',
        description:
          'Dos o tres números separados por espacios se leen como una tirada: `/roll 4 6` es `4d6` y `/roll 1 20 -3` es `1d20-3`. El tercer número es el modificador y lleva su propio signo.',
        example: { notation: '1 20 -3', rng: [14], mode: 'compact' },
      },
      {
        title: 'Números sueltos',
        description: 'Un número solo es un dado: `/roll 20` tira un `d20`.',
        example: { notation: '20', rng: [12], mode: 'compact' },
      },
      {
        title: 'Letras cirílicas de dado',
        description:
          '`к` y `д` se convierten en `d` antes de analizar, así que `2к6` tira `2d6`. La notación rusa, ucraniana y bielorrusa funciona igual, y la `k` latina de `kh` y `kl` queda intacta.',
        example: { notation: '2к6', rng: [3, 5], mode: 'compact' },
      },
      {
        title: 'Cifras persas',
        description:
          '`۲۰` tira un `d20`. Las cifras arábigo-índicas y persas se convierten a ASCII antes de analizar; un nombre entre comillas conserva sus cifras intactas.',
        example: { notation: '۲۰', rng: [17], mode: 'compact' },
      },
    ],
  },
  inline: {
    heading: 'Modo en línea',
    body: [
      'Escribe `@rollrobot` y una notación en cualquier chat, incluidos los grupos que no conocen el bot. Se abre una lista sobre el teclado; toca un resultado para enviarlo como mensaje tuyo.',
      '`@rollrobot 2d20kh1+7` ofrece una sola tirada bajo dos títulos, Tirada y Desglose. Elegir cambia cómo se muestra, no los dados — nunca es una nueva tirada.',
      'Sin nada después del nombre obtienes tres sugerencias: Tirada y Desglose con un `d20`, y Aleatoria con un `d100`.',
      'Una pregunta añade un resultado de Pregunta, que encabeza la lista cuando no hay tirada y la cierra cuando la hay. Un separador explícito entre dos cosas que no son notación — `Patrulla de goblins | Sala vacía` — pone Elección arriba del todo. Aquí los espacios solos no cuentan, a diferencia de `/pick`, o cada pregunta a medio escribir ofrecería una elección debajo de su respuesta. Una elección en línea lleva su lista de opciones dentro del mensaje, porque no tiene ningún comando encima al que responder.',
      'Los resultados son personales y no se guardan en caché, así que cada consulta tira de nuevo.',
    ],
  },
  notation: {
    heading: 'Notación',
    intro:
      'Lo que escribes de verdad. No distingue mayúsculas ni le importan los espacios, así que `2 D 20 KH 1` y `2d20kh1` son la misma tirada. Cada grupo de abajo llega hasta donde resulta útil; la referencia recoge el resto y el área de pruebas lo ejecuta.',
    links: { playground: 'Área de pruebas', reference: 'Referencia completa' },
    groups: [
      {
        heading: 'Dados y aritmética',
        rows: [
          { notation: '2d6', description: 'Dos dados de seis caras.' },
          { notation: 'd20', description: 'La cantidad es uno por defecto.' },
          { notation: '2d20+5', description: 'Aritmética: + - * / y paréntesis.' },
          { notation: '(1d6+2)*3', description: 'Los paréntesis agrupan lo que pongas dentro.' },
          {
            notation: '(1d4)d6',
            description: 'Una cantidad calculada: tira `1d4` y luego esa cantidad de `d6`.',
          },
        ],
      },
      {
        heading: 'Conservar y descartar',
        rows: [
          {
            notation: '4d6kh3',
            description: 'Conserva los tres más altos — una puntuación de característica.',
          },
          { notation: '2d20kh1', description: 'Ventaja: el más alto de dos `d20`.' },
          { notation: '2d20kl1', description: 'Desventaja: el más bajo.' },
          { notation: '4d6dl1', description: 'Descarta el más bajo; `dh` descarta el más alto.' },
          {
            notation: '{1d8!, 1d6!}kh1',
            description: 'Conserva dentro de un grupo — cada subtirada compite como un solo dado.',
          },
        ],
      },
      {
        heading: 'Dados explosivos',
        rows: [
          { notation: 'd8!', description: 'Un resultado máximo añade otro dado.' },
          { notation: 'd8!!', description: 'Compuesto: el dado extra se suma al mismo dado.' },
          { notation: 'd8!p', description: 'Penetrante: cada dado extra recibe −1.' },
          {
            notation: '5d10!=10',
            description: 'Explota a partir de un umbral, no en la cara más alta.',
          },
        ],
      },
      {
        heading: 'Nuevas tiradas y límites',
        rows: [
          {
            notation: '2d6r<3',
            description: 'Vuelve a tirar por debajo de 3, tantas veces como haga falta.',
          },
          {
            notation: '2d6ro<3',
            description: 'Vuelve a tirar una sola vez y conserva el segundo resultado.',
          },
          { notation: '4d6min2', description: 'Pon un mínimo de 2 en cada dado.' },
          { notation: '4d6max5', description: 'Limita cada dado a 5 como máximo.' },
        ],
      },
      {
        heading: 'Reservas de éxitos y pruebas',
        rows: [
          { notation: '12d6>=5', description: 'Cada 5 y cada 6 cuenta como un éxito.' },
          { notation: '7d10>=6f1', description: 'Cuenta éxitos y resta los unos como fallos.' },
          {
            notation: '1d20+7 vs 15',
            description: 'Prueba contra una CD, respondida como grado de éxito.',
          },
        ],
      },
      {
        heading: 'Otros dados y funciones',
        rows: [
          { notation: '4dF', description: 'Dados Fate, cada uno −1, 0 o +1.' },
          { notation: 'd%', description: 'Dado porcentual — el mismo dado que `1d100`.' },
          {
            notation: '2d6+floor(1d4/2)',
            description: 'Funciones: `floor`, `ceil`, `round`, `abs`, `min`, `max`, `sqrt`, `pow`.',
          },
        ],
      },
    ],
  },
  systems: {
    heading: 'Por sistema de juego',
    intro: 'La tirada a la que recurre primero cada mesa, lista para copiar.',
    items: [
      {
        system: 'D&D 5e',
        description: 'Ataque con ventaja: dos `d20`, conserva el más alto y suma tu bonificador.',
        example: { notation: '2d20kh1+7', rng: [8, 19], mode: 'full' },
      },
      {
        system: 'Pathfinder 2e',
        description:
          'Una prueba contra una CD. Supérala por diez para un éxito crítico o fállala por diez para un fallo crítico; un 20 o un 1 natural desplaza el resultado un grado.',
        example: { notation: '1d20+12 vs 20', rng: [18], mode: 'full' },
      },
      {
        system: 'World of Darkness',
        description: 'Una reserva de Storyteller: éxito con 6 o más, y cada 1 anula uno.',
        example: { notation: '7d10>=6f1', rng: [8, 6, 2, 10, 1, 4, 7], mode: 'full' },
      },
      {
        system: 'Shadowrun',
        description: 'Impactos con 5 y 6 en toda la reserva.',
        example: {
          notation: '12d6>=5',
          rng: [5, 3, 6, 2, 4, 5, 1, 6, 3, 5, 2, 4],
          mode: 'full',
        },
      },
      {
        system: 'Savage Worlds',
        description:
          'Dado de rasgo y dado salvaje, ambos explosivos; cuenta el más alto de los dos.',
        example: { notation: '{1d8!, 1d6!}kh1', rng: [5, 6, 3], mode: 'full' },
      },
      {
        system: 'Fate',
        description: 'Cuatro dados Fudge más el nivel de una habilidad.',
        example: { notation: '4dF+2', rng: [1, 0, -1, 1], mode: 'full' },
      },
      {
        system: 'Call of Cthulhu',
        description: 'Tira por debajo de tu habilidad con dado porcentual.',
        example: { notation: 'd%', rng: [37], mode: 'compact' },
      },
    ],
  },
  limits: {
    heading: 'Límites',
    body: [
      'Una tirada está limitada a 100 dados y a 100 iteraciones de explosión o de nueva tirada. Si pides más, el bot lo dice en vez de tirar — esos topes son los que mantienen la respuesta dentro del límite de 4096 caracteres de Telegram.',
      'Un desglose que aun así pase de 3500 caracteres se cambia por la respuesta compacta, así que una reserva grande responde con su total en lugar de no responder.',
      '`/pick` acepta 100 opciones como máximo. Una lista más larga se rechaza, no se recorta: quedarse con las primeras cien sesgaría en silencio cada elección hacia el principio y seguiría pareciendo que funciona.',
      'Un nombre entre comillas se corta a 100 caracteres; una pregunta a `/ask`, a 300.',
    ],
  },
  faq: {
    heading: 'Preguntas frecuentes',
    items: [
      {
        question: '¿Tengo que añadir el bot a mi grupo?',
        answer:
          'No. Escribe `@rollrobot` y una notación en cualquier chat y elige un resultado — se envía como mensaje tuyo y el bot no entra en ninguna parte. Añadirlo solo compensa si en la mesa se tira a menudo, porque un comando es más corto de escribir.',
      },
      {
        question: '¿El bot lee mis mensajes?',
        answer:
          'Solo actúa sobre lo que va dirigido a él: los comandos que empiezan por barra y las consultas en línea que empiezan por `@rollrobot`. La conversación normal se ignora — no hay nada que la atienda.',
      },
      {
        question: '¿Se guarda algo?',
        answer:
          'No. Nada de lo que envías se conserva: ni el texto de una pregunta, ni las opciones de una lista, ni un nombre que hayas citado, ni un solo resultado. Lo que se registra es la forma de la tirada y nada más — `2d6`, `4d6kh3`, el comando del que vino — con el ID de usuario de Telegram reducido a un hash con sal, para poder contar el uso repetido sin identificar la cuenta. Ese conjunto de datos es de solo escritura; existe para ver qué notación merece la pena mantener, y no hay forma de devolverlo a una conversación.',
      },
      {
        question: '¿Las tiradas son justas?',
        answer:
          'Cada tirada sale del generador de roll-parser, con una semilla nueva cada vez. Nada está precalculado y ningún resultado arrastra nada a la tirada siguiente.',
      },
      {
        question: '¿Puedo ponerle nombre a una tirada?',
        answer:
          'Pon un nombre entre comillas al final y aparece encima del resultado: `/roll 2d20kh1+7 "Percepción"`. También funciona con `/pick`.',
      },
      {
        question: '¿Por qué `4d6d1` da error?',
        answer:
          'Una `d` suelta después de una reserva es ambigua — ¿descartar uno o volver a tirar esa cantidad de dados? Escribe `4d6dl1` para descartar el más bajo, o `(4d6)d1` para dados anidados.',
      },
      {
        question: 'Me ha rechazado la notación. ¿Y ahora qué?',
        answer:
          'El bot repite lo que enviaste con acentos circunflejos debajo de la parte que no pudo leer, así que la solución suele verse en la propia respuesta. Los casos raros se depuran antes en el área de pruebas, enlazada al pie de esta página.',
      },
      {
        question: '¿En qué idioma habla el bot?',
        answer:
          'El menú de comandos, los títulos en línea y la guía de notación siguen el idioma de tu interfaz de Telegram entre inglés, español, portugués, alemán, ruso, ucraniano, bielorruso y persa; cualquier otro cae en inglés. Los resultados son notación, así que se leen igual en todas partes. Yes y No siguen en inglés a propósito — el idioma de tu interfaz dice poco sobre el idioma del chat en el que escribes.',
      },
    ],
  },
  footer: {
    playground: 'Área de pruebas',
    reference: 'Referencia de notación',
    source: 'Código fuente',
  },
  a11y: {
    language: 'Idioma',
    theme: 'Tema',
    themeModes: {
      auto: 'Tema: del sistema',
      light: 'Tema: claro',
      dark: 'Tema: oscuro',
    },
  },
};
