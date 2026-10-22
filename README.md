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
│       └── steps/        # Identity, Attributes, Skills, Review
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
| Teto de pontos investidos por perícia | 60 |
| Bônus por perícia no teto | +10 pontos de pool |
| Bônus de arquétipo | Somados após a distribuição, sem consumir pool |
| Bônus de profissão (Civil) | +10 no **atributo principal** da profissão, somado após a distribuição, sem consumir pool |

Arquétipos:

- **Detetive**: `+20 Intelecto`
- **Policial**: `+10 Físico`, `+10 Destreza`
- **Civil**: `+10 Psique`, `+10` no atributo principal da profissão contemporânea escolhida na etapa 1, profissão obrigatória na etapa 1 e limite de 40% no investimento de perícias de combate (Combate: 24 pontos)

Derivados (todos arredondados para baixo com `Math.floor`):

- `PV = 5 + ((FIS + PSI) / 20)`
- `Estabilidade Mental (SAN) = PSI`
- `Estamina (ST) = FIS / 10`
- `Energia Mental (EM) = PSI / 10`

> Os valores acima são parâmetros de balanceamento centralizados em `moduleA.ts`. Ajuste-os lá para recalibrar o módulo sem tocar na UI.

## Fluxo do wizard

1. **Identidade & Arquétipo** — nome (3–60 caracteres) e arquétipo obrigatório; Civis escolhem imediatamente a **profissão contemporânea**, a perícia bonificada (quando houver mais de uma) e o atributo principal quando a profissão for flexível (Entregador).
2. **Atributos** — cada atributo parte de 30; o avanço exige exatamente 80 pontos distribuídos e o teto final de 75 (bônus de arquétipo e de profissão descontados). Para Civis, o **atributo principal** da profissão precisa atingir o pré-requisito no valor final (ex.: 60 com `+10` de bônus exige investir até o valor base 50).
3. **Perícias** — base igual a metade do atributo correspondente; cada perícia aceita até 60 pontos investidos e atingir o teto concede +10 de pool; o avanço exige o pool total investido.
4. **Revisão** — atributos e perícias finais com bônus, derivados calculados, profissão civil, exportação em JSON e impressão.

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

O store bloqueia o avanço caso a etapa atual não esteja válida, além da validação de formulário via Zod.
