import type { Manual } from './types';

export const pt: Manual = {
  meta: {
    title: 'Roll Robot — dados de RPG em qualquer conversa do Telegram',
    description:
      'Notação de dados de RPG completa no Telegram: manter/descartar, dados explosivos, novas rolagens, paradas de dados e testes.',
    social: 'Bot do Telegram para dados de RPG. Feito por edloidas.io',
  },
  hero: {
    tagline:
      'Dados de RPG em qualquer conversa — D&D, Pathfinder, World of Darkness, Shadowrun, Fate, Call of Cthulhu.',
    cta: 'Abrir no Telegram',
  },
  gettingStarted: {
    heading: 'Primeiros passos',
    body: [
      'Abra `@rollrobot`, toque em Iniciar e envie `/roll 2d6+3`. Você recebe a expressão como ele a leu e o total.',
      'Joga em grupo? Adicione o bot à conversa. Ele responde à mensagem que o chamou, então várias pessoas podem rolar ao mesmo tempo e cada resposta fica junto da sua pergunta. Ele precisa de permissão para enviar mensagens, senão fica em silêncio.',
      'Em uma conversa onde você não pode adicioná-lo, use o modo inline: digite `@rollrobot 2d6+3` e toque no resultado. Nada para adicionar, nenhuma permissão para conceder — a rolagem sai como sua própria mensagem.',
    ],
  },
  commands: {
    heading: 'Comandos',
    intro:
      'Cinco comandos, iguais em conversas privadas e em grupos. `/roll` e `/full` aceitam notação; envie qualquer um deles sem nada para um `d20` simples.',
    items: [
      {
        command: 'roll',
        shortcut: 'r',
        summary: 'O total, com a expressão normalizada para você conferir o que ele leu.',
        examples: [{ notation: '2d6+3', rng: [4, 6], mode: 'compact' }],
      },
      {
        command: 'full',
        shortcut: 'f',
        summary:
          'A mesma rolagem, dado a dado. Descartados riscados, sucessos em negrito, falhas sublinhadas, um máximo ou mínimo natural com seta.',
        examples: [{ notation: '4d6kh3', rng: [6, 5, 3, 1], mode: 'full' }],
      },
      {
        command: 'random',
        summary:
          '`d100` e nada mais, para quando você só precisa de um número de um a cem. Igual a `/roll d100`.',
        examples: [{ notation: 'd100', rng: [73], mode: 'compact' }],
      },
      {
        command: 'ask',
        shortcut: 'a',
        summary:
          'Uma resposta de sim ou não para as decisões que não valem uma rolagem — a porta está armadilhada, o mercador pechincha, chove hoje à noite. Tudo depois do comando é a pergunta, citada acima da resposta.',
        notes: [
          'Não precisa de aspas. Pontuação, apóstrofos e notação são seguros dentro da pergunta.',
          'Um `/ask` sozinho também funciona: sem pergunta, só a resposta, para o que já foi dito em voz alta na mesa.',
          'A resposta é um `d2`, ou seja, uma moeda honesta e nada além disso.',
          'Yes e No ficam em inglês em todos os idiomas — o idioma da sua interface é um palpite ruim para o idioma da conversa.',
        ],
        examples: [
          { kind: 'ask', question: 'Devemos abrir a porta?', answer: 'yes' },
          { kind: 'ask', answer: 'no' },
        ],
      },
      {
        command: 'help',
        summary:
          'O guia de notação em uma mensagem, com links para o playground e a referência. Esta página resumida, sem sair do Telegram. `/start` mostra o mesmo.',
      },
    ],
  },
  betaFeatures: {
    heading: 'Recursos em beta',
    intro:
      'Já funcionam, mas ainda não estão fechados: o que está aqui pode mudar de forma ou sair do bot em uma atualização futura. Os cinco comandos acima, não.',
    items: [
      {
        command: 'pick',
        shortcut: 'p',
        summary:
          'Escolhe uma opção de uma lista que você dá — um encontro aleatório, quem fica no primeiro turno de guarda, qual porta. Um dado sobre as opções, sem pesos a menos que você peça.',
        notes: [
          'No mínimo duas opções, no máximo cem.',
          'Uma vírgula já basta — `Passar sem ser visto, Negociar`. `|` e `;` fazem o mesmo, e uma quebra de linha vence os dois, então uma tabela colada se divide linha a linha.',
          'Só o primeiro separador presente é usado, nessa ordem: quebra de linha, depois `|` ou `;`, depois vírgula, depois espaços. Use `|` quando uma opção contiver vírgula — `Corda, 15 m | Tocha` vira duas opções, não três.',
          'Repita uma opção para dar peso a ela: cada cópia ocupa um lugar na lista.',
          'Um nome entre aspas no final nomeia a escolha em vez de entrar na lista.',
        ],
        examples: [
          {
            kind: 'pick',
            input: 'Patrulha de goblins | Sala vazia | Tesouro',
            choice: 'Sala vazia',
          },
          {
            kind: 'pick',
            input: 'Passar sem ser visto, Negociar, Preparar uma emboscada',
            choice: 'Negociar',
          },
        ],
      },
    ],
  },
  specialFeatures: {
    heading: 'Recursos especiais',
    intro:
      'Nada disso é necessário para uma rolagem comum. É o que o bot oferece a quem o usa toda sessão e quer digitar menos.',
    items: [
      {
        title: 'Nomes entre aspas',
        description:
          'Um nome entre aspas duplas no final de uma rolagem aparece acima do resultado, para que uma conversa cheia de números soltos continue legível. Funciona igual em `/roll`, `/full` e `/pick`, e as aspas curvas que o teclado do celular coloca no lugar das retas são aceitas do mesmo jeito.',
        important:
          '**As aspas não são opcionais.** O parser aceita tanta coisa que uma palavra sem aspas não dá para distinguir da notação com nenhuma certeza, então `2d20kh1+7 Percepção` é lido como notação e falha, enquanto `2d20kh1+7 "Percepção"` rola e assume o nome.',
        example: {
          notation: '2d20kh1+7',
          rng: [8, 19],
          mode: 'compact',
          label: 'Percepção',
        },
      },
      {
        title: 'Forma separada por espaços',
        description:
          'Dois ou três números separados por espaços são lidos como uma rolagem: `/roll 4 6` é `4d6`, e `/roll 1 20 -3` é `1d20-3`. O terceiro número é o modificador, e ele leva o próprio sinal.',
        example: { notation: '1 20 -3', rng: [14], mode: 'compact' },
      },
      {
        title: 'Números sozinhos',
        description: 'Um número sozinho é um dado: `/roll 20` rola um `d20`.',
        example: { notation: '20', rng: [12], mode: 'compact' },
      },
      {
        title: 'Letras cirílicas de dado',
        description:
          '`к` e `д` viram `d` antes da análise, então `2к6` rola `2d6`. A notação russa, ucraniana e bielorrussa funciona igual, e o `k` latino de `kh` e `kl` fica intacto.',
        example: { notation: '2к6', rng: [3, 5], mode: 'compact' },
      },
      {
        title: 'Dígitos persas',
        description:
          '`۲۰` rola um `d20`. Os algarismos arábico-índicos e persas viram ASCII antes da análise; um nome entre aspas mantém os próprios algarismos intactos.',
        example: { notation: '۲۰', rng: [17], mode: 'compact' },
      },
    ],
  },
  inline: {
    heading: 'Modo inline',
    body: [
      'Digite `@rollrobot` e a notação em qualquer conversa, inclusive em grupos que nunca ouviram falar do bot. Uma lista abre acima do teclado; toque em um resultado para enviá-lo como sua própria mensagem.',
      '`@rollrobot 2d20kh1+7` oferece uma rolagem sob dois títulos, Rolagem e Detalhada. Escolher muda a exibição, não os dados — nunca é uma nova rolagem.',
      'Sem nada depois do nome do bot, você recebe três exemplos prontos: Rolagem e Detalhada em um `d20`, Aleatória em um `d100`.',
      'Uma pergunta acrescenta um resultado Pergunta, no topo da lista quando nada rolou e no fim quando algo rolou. Um separador nomeado entre duas coisas que não são notação — `Patrulha de goblins | Sala vazia` — coloca Escolha no topo. Espaços sozinhos não valem aqui, ao contrário do `/pick`, senão toda pergunta digitada pela metade ofereceria uma escolha embaixo da resposta. Uma escolha inline leva as opções na própria mensagem, já que não tem um comando acima para responder.',
      'Os resultados são pessoais e não ficam em cache, então cada consulta rola de novo.',
    ],
  },
  notation: {
    heading: 'Notação',
    intro:
      'O que você digita de fato. Não diferencia maiúsculas de minúsculas e ignora espaços, então `2 D 20 KH 1` e `2d20kh1` são a mesma rolagem. Cada grupo abaixo para no limite do que é útil; a referência traz o resto, e o playground executa.',
    links: { playground: 'Playground', reference: 'Referência completa' },
    groups: [
      {
        heading: 'Dados e aritmética',
        rows: [
          { notation: '2d6', description: 'Dois dados de seis lados.' },
          { notation: 'd20', description: 'A quantidade padrão é um.' },
          { notation: '2d20+5', description: 'Aritmética: + - * / e parênteses.' },
          { notation: '(1d6+2)*3', description: 'Parênteses agrupam o que você colocar dentro.' },
          {
            notation: '(1d4)d6',
            description: 'Uma quantidade calculada: role `1d4` e depois essa quantidade de `d6`.',
          },
        ],
      },
      {
        heading: 'Manter e descartar',
        rows: [
          { notation: '4d6kh3', description: 'Mantém os três maiores — um valor de atributo.' },
          { notation: '2d20kh1', description: 'Vantagem: o maior entre dois `d20`.' },
          { notation: '2d20kl1', description: 'Desvantagem: o menor.' },
          { notation: '4d6dl1', description: 'Descarta o menor; `dh` descarta o maior.' },
          {
            notation: '{1d8!, 1d6!}kh1',
            description: 'Mantém dentro de um grupo — cada sub-rolagem concorre como um dado.',
          },
        ],
      },
      {
        heading: 'Dados explosivos',
        rows: [
          { notation: 'd8!', description: 'Um resultado máximo acrescenta outro dado.' },
          { notation: 'd8!!', description: 'Composto: o dado extra se soma ao mesmo dado.' },
          { notation: 'd8!p', description: 'Penetrante: cada dado extra leva −1.' },
          {
            notation: '5d10!=10',
            description: 'Explode a partir de um limite, não da face máxima.',
          },
        ],
      },
      {
        heading: 'Novas rolagens e limites',
        rows: [
          {
            notation: '2d6r<3',
            description: 'Rola de novo abaixo de 3, quantas vezes for preciso.',
          },
          {
            notation: '2d6ro<3',
            description: 'Rola de novo uma vez e fica com o segundo resultado.',
          },
          { notation: '4d6min2', description: 'Eleva cada dado para no mínimo 2.' },
          { notation: '4d6max5', description: 'Limita cada dado a 5.' },
        ],
      },
      {
        heading: 'Paradas de dados e testes',
        rows: [
          { notation: '12d6>=5', description: 'Cada 5 e 6 conta como sucesso.' },
          { notation: '7d10>=6f1', description: 'Conta sucessos e subtrai cada 1 como falha.' },
          {
            notation: '1d20+7 vs 15',
            description: 'Teste contra uma CD, respondido como grau de sucesso.',
          },
        ],
      },
      {
        heading: 'Outros dados e funções',
        rows: [
          { notation: '4dF', description: 'Dados Fate, cada um −1, 0 ou +1.' },
          { notation: 'd%', description: 'Percentual — o mesmo dado que `1d100`.' },
          {
            notation: '2d6+floor(1d4/2)',
            description: 'Funções: `floor`, `ceil`, `round`, `abs`, `min`, `max`, `sqrt`, `pow`.',
          },
        ],
      },
    ],
  },
  systems: {
    heading: 'Por sistema de jogo',
    intro: 'A rolagem que cada mesa usa primeiro, pronta para copiar.',
    items: [
      {
        system: 'D&D 5e',
        description: 'Ataque com vantagem: dois `d20`, mantém o maior, some seu bônus.',
        example: { notation: '2d20kh1+7', rng: [8, 19], mode: 'full' },
      },
      {
        system: 'Pathfinder 2e',
        description:
          'Um teste contra uma CD. Supere por dez para um sucesso crítico, erre por dez para uma falha crítica; um 20 ou 1 natural desloca o resultado em um grau.',
        example: { notation: '1d20+12 vs 20', rng: [18], mode: 'full' },
      },
      {
        system: 'World of Darkness',
        description:
          'Uma parada de dados do Storyteller: sucesso em 6 ou mais, e cada 1 cancela um.',
        example: { notation: '7d10>=6f1', rng: [8, 6, 2, 10, 1, 4, 7], mode: 'full' },
      },
      {
        system: 'Shadowrun',
        description: 'Acertos em 5 e 6 em toda a parada de dados.',
        example: {
          notation: '12d6>=5',
          rng: [5, 3, 6, 2, 4, 5, 1, 6, 3, 5, 2, 4],
          mode: 'full',
        },
      },
      {
        system: 'Savage Worlds',
        description: 'Dado de traço e dado selvagem, ambos explosivos; vale o maior dos dois.',
        example: { notation: '{1d8!, 1d6!}kh1', rng: [5, 6, 3], mode: 'full' },
      },
      {
        system: 'Fate',
        description: 'Quatro dados Fudge mais o nível de uma perícia.',
        example: { notation: '4dF+2', rng: [1, 0, -1, 1], mode: 'full' },
      },
      {
        system: 'Call of Cthulhu',
        description: 'Role abaixo da sua perícia com o dado percentual.',
        example: { notation: 'd%', rng: [37], mode: 'compact' },
      },
    ],
  },
  limits: {
    heading: 'Limites',
    body: [
      'Uma rolagem é limitada a 100 dados e a 100 iterações de explosão ou nova rolagem. Peça mais e o bot avisa em vez de rolar — são esses limites que mantêm a resposta dentro do teto de 4096 caracteres do Telegram.',
      'O detalhe dado a dado que ainda passe de 3500 caracteres é descartado em favor da resposta compacta, então uma parada de dados grande responde com o total em vez de não responder nada.',
      '`/pick` aceita no máximo 100 opções. Uma lista maior é rejeitada, não cortada: ficar com as cem primeiras enviesaria silenciosamente toda escolha para o topo e ainda pareceria ter funcionado.',
      'Um nome entre aspas é cortado em 100 caracteres, e uma pergunta ao `/ask`, em 300.',
    ],
  },
  faq: {
    heading: 'Perguntas frequentes',
    items: [
      {
        question: 'Preciso adicionar o bot ao meu grupo?',
        answer:
          'Não. Digite `@rollrobot` e a notação em qualquer conversa e escolha um resultado — ele é enviado como sua própria mensagem e o bot não entra em lugar nenhum. Só vale a pena adicioná-lo quando a mesa rola com frequência, já que um comando é mais curto de digitar.',
      },
      {
        question: 'O bot lê minhas mensagens?',
        answer:
          'Ele age só sobre o que é dirigido a ele: comandos que começam com barra e consultas inline que começam com `@rollrobot`. A conversa normal é ignorada — não existe nada que a trate.',
      },
      {
        question: 'Alguma coisa é armazenada?',
        answer:
          'Não. Nada do que você envia é guardado: nem o texto de uma pergunta, nem as opções de uma lista, nem um nome que você citou, nem um único resultado. O que fica registrado é o formato da rolagem e nada mais — `2d6`, `4d6kh3`, o comando de onde veio — com o ID de usuário do Telegram reduzido a um hash com sal, para que o uso repetido possa ser contado sem identificar a conta. Esse conjunto de dados é somente de escrita; ele existe para mostrar qual notação vale a pena suportar, e não pode ser lido de volta para dentro de uma conversa.',
      },
      {
        question: 'As rolagens são justas?',
        answer:
          'Cada rolagem é sorteada na hora pelo gerador do roll-parser, com uma semente nova a cada vez. Nada é pré-calculado, e nenhum resultado passa de uma rolagem para a seguinte.',
      },
      {
        question: 'Posso dar nome a uma rolagem?',
        answer:
          'Cite um nome entre aspas no final e ele aparece acima do resultado: `/roll 2d20kh1+7 "Percepção"`. Funciona para `/pick` também.',
      },
      {
        question: 'Por que `4d6d1` dá erro?',
        answer:
          'Um `d` solto depois de uma parada de dados é ambíguo — descartar um, ou rolar essa quantidade de dados de novo? Escreva `4d6dl1` para descartar o menor, ou `(4d6)d1` para dados aninhados.',
      },
      {
        question: 'Minha notação foi rejeitada. E agora?',
        answer:
          'O bot repete o que você enviou com acentos circunflexos sob a parte que não conseguiu ler, então a correção costuma ficar visível na resposta. Casos complicados são mais rápidos de depurar no playground, com link no rodapé desta página.',
      },
      {
        question: 'Que idioma o bot fala?',
        answer:
          'O menu de comandos, os títulos inline e o guia de notação seguem o idioma da interface do seu Telegram entre inglês, espanhol, português, alemão, russo, ucraniano, bielorrusso e persa; qualquer outro cai no inglês. Os resultados são notação, então se leem igual em qualquer lugar. Yes e No ficam em inglês de propósito — o idioma da sua interface é um palpite ruim para o idioma da conversa em que você está escrevendo.',
      },
    ],
  },
  footer: {
    playground: 'Playground',
    reference: 'Referência de notação',
    source: 'Código-fonte',
  },
  a11y: {
    language: 'Idioma',
    theme: 'Tema',
    themeModes: {
      auto: 'Tema: do sistema',
      light: 'Tema: claro',
      dark: 'Tema: escuro',
    },
  },
};
