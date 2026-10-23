# Protocolo Anômalo · Gerador de Fichas

Aplicação web em formato de wizard para criação de fichas de personagem do **Módulo A** de um sistema de RPG. A interface é estritamente preto e branco, com azul marinho (`#000080`) reservado a detalhes de interação.

## Stack

- **React 19 + TypeScript** (Vite)
- **Tailwind CSS** com paleta fechada (preto, branco, cinzas e `navy-blue`)
- **Zustand** para o rascunho da ficha e o avanço do wizard
- **React Hook Form + Zod** para validação por etapa
- Deploy estático compatível com **Vercel**

## Como executar

> A aplicação está em `criador-fichas-rpg/`. Execute os comandos abaixo dentro dessa pasta.

```bash
npm install
npm run dev
```

Build de produção:

```bash
npm run build
npm run preview
```

## Deploy na Vercel

Configure o **Root Directory** do projeto como `criador-fichas-rpg` (preset **Vite**). Build `npm run build` e output `dist`.

## Arquitetura

```
src/
├── config/modules/
│   ├── moduleA.ts        # Regras e limites do Módulo A (fonte única da verdade)
│   └── index.ts          # Registry de módulos (pronto para o Módulo B)
├── types/character.ts    # Contratos de atributos, perícias, derivados e módulo
├── lib/
│   ├── characterRules.ts # Cálculos puros (pontos, bônus, derivados, ficha final)
│   └── validation.ts     # Schemas Zod gerados a partir das regras do módulo
├── store/useCharacterStore.ts
├── components/
│   ├── layout/Layout.tsx
│   ├── ui/Button.tsx
│   └── wizard/
│       ├── StepIndicator.tsx
│       ├── StepHeader.tsx
│       ├── WizardFooter.tsx
│       ├── AttributeDistribution.tsx
│       ├── SkillDistribution.tsx
│       ├── ArchetypeSelector.tsx
│       ├── ProfessionSelector.tsx
│       ├── DerivedStatsPanel.tsx
│       └── steps/        # Identity, Attributes, Skills, GeneralSkills, FreeSkillBonus, Anchors, Equipment, Review
└── App.tsx
```

Nenhum componente visual conhece os números do sistema: pools, tetos e fórmulas vêm de `ModuleRules`. Para criar o Módulo B, basta adicionar `src/config/modules/moduleB.ts` seguindo o mesmo contrato e registrá-lo em `src/config/modules/index.ts`.

## Regras implementadas (Módulo A)

| Item | Valor |
| --- | --- |
| Valor base de cada atributo | 30 |
| Pool de pontos de atributo | 80 (distribuição obrigatória) |
| Teto final por atributo | 75 (bônus de arquétipo já incluídos) |
| Valor base de cada perícia | `Math.floor(atributo correspondente / 2)` |
| Pool de perícias | 150 |
| Teto final por perícia (base + investimento) | 60 |
| Teto de investimento por perícia | `60 - valor base` |
| Bônus por perícia no teto final | +10 pontos de pool |
| Teto final de combate (Civil) | 40 (absoluto, base + investimento) |
| Bônus por habilidade geral NÃO escolhida | +10 diretos em uma perícia (etapa de Bônus, universal a todos os arquétipos), fora do pool mas respeitando o teto vigente da perícia |
| Bônus de arquétipo | Somados após a distribuição, sem consumir pool |
| Bônus de profissão (Civil) | +10 no **atributo principal** da profissão, somado após a distribuição, sem consumir pool |

Arquétipos:

- **Detetive**: `+20 Intelecto`
- **Policial**: `+10 Físico`, `+10 Destreza`
- **Civil**: `+10 Psique`, `+10` no atributo principal da profissão contemporânea escolhida na etapa 1, profissão obrigatória na etapa 1 e teto final absoluto de 40 em perícias de combate (Combate), contando valor base + investimento

Derivados (todos arredondados para baixo com `Math.floor`):

- `PV = 5 + ((FIS + PSI) / 20)`
- `Estabilidade Mental (SAN) = PSI`
- `Estamina (ST) = FIS / 10`
- `Energia Mental (EM) = PSI / 10`

> Os valores acima são parâmetros de balanceamento centralizados em `moduleA.ts`. Ajuste-os lá para recalibrar o módulo sem tocar na UI.

## Fluxo do wizard

1. **Identidade & Arquétipo** — nome (3–60 caracteres) e arquétipo obrigatório; Civis informam o **Motivo de Presença** (10–280 caracteres), escolhem a **profissão contemporânea**, a perícia bonificada (quando houver mais de uma) e o atributo principal quando a profissão for flexível (Entregador).
2. **Atributos** — cada atributo parte de 30; o avanço exige exatamente 80 pontos distribuídos e o teto final de 75 (bônus de arquétipo e de profissão descontados). Para Civis, o **atributo principal** da profissão precisa atingir o pré-requisito no valor final (ex.: 60 com `+10` de bônus exige investir até o valor base 50).
3. **Perícias** — base igual a metade do atributo correspondente; o teto final é 60 (base + investimento), então o investimento manual máximo é `60 - base`. Atingir 60 no valor final concede +10 de pool. Perícias de combate do Civil têm teto final absoluto de 40. O avanço exige o pool total investido. O pool aqui não depende das habilidades gerais, que vêm depois.
4. **Habilidades Gerais** — até 2 escolhas; os pré-requisitos são conferidos sobre os **valores finais** de atributos e perícias já distribuídos. Habilidades físicas/de combate gastam ST; mentais/de suporte gastam EM. A etapa só avança com todas as escolhas válidas.
5. **Bônus de Vagas Livres** — etapa universal (Detetive, Policial e Civil): cada habilidade não escolhida concede **+10 pontos diretos em uma perícia**, aplicados ao valor final fora do pool, mas sem ultrapassar o teto final da perícia (60; 40 em perícias de combate para Civis), contando valor base + investimento + bônus. A distribuição precisa fechar 100% do pool — `(2 - escolhidas) × 10` — e o avanço fica bloqueado enquanto houver pontos pendentes. Quando as duas habilidades são escolhidas, a etapa é omitida da navegação e o fluxo segue direto para Âncoras; o pool é recalculado imediatamente no Zustand se o jogador voltar e alterar as escolhas.
6. **Âncoras** — 3 vínculos pessoais com no mínimo 10 pontos cada, somando exatamente PSIQUE final + 20.
7. **Equipamentos** — itens de ofício são injetados automaticamente pela profissão e ficam travados; armas longas/pesadas são proibidas na criação; armas curtas e munição solta exigem credencial; o avanço exige carga dentro do limite e nenhum item bloqueado no inventário.
8. **Revisão** — atributos e perícias finais com bônus (arquétipo, profissão e vagas livres), derivados calculados, profissão civil, motivo de presença, exportação em JSON e impressão.

## Habilidades gerais (Módulo A)

Até 2 escolhas. Cada categoria consome um recurso diferente; a vaga não preenchida vira bônus de perícia na etapa seguinte. Os pré-requisitos são avaliados com os valores **finais** — atributos com bônus de arquétipo/profissão e perícias com base + investimento + bônus. O campo `requirement` aceita `all` (todas as exigências) e `anyOf` (grupos alternativos, basta um).

### Físicas e de Combate (consomem Estamina)

| Habilidade | Custo | Pré-requisito | Efeito |
| --- | --- | --- | --- |
| Mira Estável | 1 ST | DES 55+ e Armas de Fogo 30%+ | Abdica da ação de movimento para o próximo disparo na mesma rodada receber Vantagem |
| Arrancada de Adrenalina | 1 ST | FIS 55+ | Ignora as penalidades de deslocamento de uma lesão grave por 1 rodada **ou** recebe Vantagem em Atletismo para escapar de um Agarre |
| Fogo de Supressão | 2 ST + 1 turno de munição | DES 55+ e Armas de Fogo 40%+ | Alvo sofre Desvantagem no próximo ataque ou perde a ação de movimento ao avançar na sua direção |
| Resiliência Bruta | 2 ST | FIS 60+ | Com dano que reduziria os PV a 0, mantém-se de pé com 1 PV. Uma vez por cena; não vale contra Morte Instantânea |

### Mentais e de Suporte (consomem Energia Mental)

| Habilidade | Custo | Pré-requisito | Efeito |
| --- | --- | --- | --- |
| Desfibrilador Humano | 2 EM | INT 55+ e Medicina 40%+ | Repete a estabilização de um aliado CAÍDO que acabou de falhar; Falha Crítica na tentativa extra mata o paciente e causa 1d6 de dano de Estabilidade Mental |
| Hiperfoco Investigativo | 1 EM | INT 60+ **ou** Investigação 40%+ | Ao analisar uma sala/cena de crime, ganha metade do valor da perícia Investigação como bônus nela (limite 90%) |
| Voz de Comando / Sangue Frio | 1 EM | PSI 55+ | Aliado visível/audível que falhou em Estabilidade Mental ou entrou em Paralisia Tática desperta e refaz o teste |
| Memória Eidética | 1 EM | INT 60+ | Ganha metade do valor da perícia relevante (limite 90%) em testes de Conhecimento, Ciência ou Tecnologia (ou Intelecto puro) para recordar senhas, plantas e documentos |

> O Módulo A não possui uma perícia chamada "Armas de Fogo": os pré-requisitos de tiro usam a perícia **Combate**, exibida na UI como `Combate (Armas de Fogo)` para manter o vocabulário das regras sem criar uma perícia fora da ficha.

## Profissões contemporâneas (Civil)

| Profissão | Atributo principal | Pré-requisito (valor final) | Bônus (fora do pool) | Itens iniciais |
| --- | --- | --- | --- | --- |
| Eletricista / Mecânico | Destreza | DES 60+ (investir 50 no base) | +10 DES · +20 Tecnologia | Lanterna de cabeça, alicate multifunção, fita isolante |
| Paramédico / Enfermeiro | Intelecto | INT 60+ (investir 50 no base) | +10 INT · +20 Medicina | Kit de trauma avançado |
| Segurança Privada | Físico | FIS 60+ (investir 50 no base) | +10 FIS · +20 Percepção ou Combate | Lanterna tática pesada, rádio comunicador |
| Chaveiro / Ladrão | Destreza | DES 55+ (investir 45 no base) | +10 DES · +20 Furtividade ou Tecnologia | Kit profissional de gazuas |
| Entregador / Atleta Amador | Físico **ou** Destreza (escolhido na etapa 1) | 60+ no atributo escolhido | +10 no atributo escolhido · +20 Atletismo | Mochila de alta capacidade, estimulantes energéticos |
| Psicólogo | Psique | PSI 60+ (investir 40 no base, pois acumula +10 de arquétipo) | +10 PSI · +20 Percepção ou Persuasão | Gravador de voz digital, tranquilizantes (tarja preta) |

O atributo principal é sempre definido pela profissão — o jogador nunca escolhe livremente onde aplicar o bônus de `+10`. A única exceção é o Entregador, que escolhe entre Físico ou Destreza; a escolha define simultaneamente onde o bônus incide e qual atributo sustenta o pré-requisito `60+`.

O pré-requisito é validado sobre os atributos finais (distribuição + bônus de arquétipo + bônus da profissão). O schema Zod da etapa de Atributos bloqueia o avanço e exibe a mensagem com o investimento mínimo necessário quando o valor final não atinge o exigido. Os itens da profissão entram no inventário de forma **imutável** e consomem slots normalmente, incluindo o bônus da mochila.

## Restrições de equipamento na criação (Nível 1)

- **Armas longas/pesadas proibidas**: fuzil de assalto, espingarda tática e submetralhadora não podem ser escolhidos por nenhum personagem na criação (marcadas como `creationBlocked` no catálogo).
- **Porte de arma curta**: revólver `.38`/pistola `9mm` e caixas de munição solta só entram no inventário de **Detetive**, **Policial** ou do **Civil com a profissão Segurança Privada** (`requiresWeaponPermit` + credenciais declaradas em `equipmentRules`). Civis comuns não têm porte.
- **Itens de ofício exclusivos**: kit de trauma, kit de gazuas, alicate multifunção, fita isolante, lanterna de cabeça, lanterna tática e tranquilizantes são marcados com `isExclusiveToProfession` e `grantedByProfessionIds`. Só a profissão concedente os recebe, automaticamente, e o botão de remoção não existe para eles (o store também recusa a remoção).
- Trocar de arquétipo ou de profissão remove do rascunho os itens que deixaram de ser permitidos.

A validação vive em `getEquipmentRestriction` / `getEquipmentLoadoutIssues` (`characterRules.ts`) e é reexposta em `createEquipmentSchema` (`validation.ts`), usada pela etapa de Equipamentos e pelo `isEquipmentComplete` do store.

O store bloqueia o avanço caso a etapa atual não esteja válida, além da validação de formulário via Zod.
