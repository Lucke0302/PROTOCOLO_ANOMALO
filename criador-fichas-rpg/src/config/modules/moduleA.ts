import type {
  ArchetypeDefinition,
  ArchetypeId,
  AttributeDefinition,
  AttributeKey,
  CivilProfession,
  CivilProfessionId,
  DerivedStatDefinition,
  Equipment,
  EquipmentCategoryDefinition,
  GeneralSkill,
  GeneralSkillCategoryDefinition,
  ModuleRules,
  SkillDefinition,
  SkillId,
  WizardStepDefinition,
} from '../../types/character'

/** Chaves canônicas dos atributos, na ordem exibida pelo wizard. */
export const ATTRIBUTE_KEYS: readonly AttributeKey[] = [
  'fisico',
  'destreza',
  'intelecto',
  'psique',
]

// ---------------------------------------------------------------------------
// Limites do Módulo A (regras oficiais)
// ---------------------------------------------------------------------------
// Ajuste apenas estes valores para recalibrar o módulo. A UI lê tudo daqui.
// - Atributos: base 30, exatos 80 pontos para distribuir e teto 75 (o teto já
//   contabiliza os bônus de arquétipo).
// - Perícias: base = floor(atributo / 2), pool de 150 pontos, teto final de 60
//   pontos por perícia (base + investimento) e +10 de pool quando o valor final
//   atinge 60. Perícias de combate do Civil têm teto final absoluto de 40.
export const MODULE_A_ATTRIBUTE_BASE = 30
export const MODULE_A_ATTRIBUTE_POOL = 80
export const MODULE_A_ATTRIBUTE_MAX = 75
export const MODULE_A_SKILL_POOL = 80
export const MODULE_A_SKILL_MAX_RANK = 60
export const MODULE_A_SKILL_BONUS_AT_MAX = 10
export const MODULE_A_CIVIL_COMBAT_MAX = 40

// Profissões contemporâneas (exclusivas do arquétipo Civil): o atributo
// principal é definido pela profissão (nunca livre), recebe um bônus fixo fora
// do pool e sustenta o pré-requisito da própria profissão.
export const MODULE_A_CIVIL_PROFESSION_ATTRIBUTE_BONUS = 10
export const MODULE_A_CIVIL_PROFESSION_SKILL_BONUS = 20

// ---------------------------------------------------------------------------
// Equipamentos & carga (regras oficiais)
// ---------------------------------------------------------------------------
// Capacidade de slots = floor(FÍSICO / 10) + 2, ampliada em +3 quando o
// personagem carrega a mochila de alta capacidade.
export const MODULE_A_SLOT_ATTRIBUTE_STEP = 10
export const MODULE_A_BASE_SLOTS = 2
export const MODULE_A_BACKPACK_SLOT_BONUS = 3

// Restrições de equipamento na criação de ficha (Nível 1):
// - Armas longas/pesadas são proibidas para qualquer personagem.
// - Porte de arma curta (revólver/pistola) e munição solta exigem credencial:
//   apenas Detetive, Policial ou o Civil com profissão Segurança Privada.
export const MODULE_A_LEVEL_ONE_PROHIBITED_EQUIPMENT_IDS: readonly string[] = [
  'espingarda-submetralhadora',
  'fuzil',
]

export const MODULE_A_WEAPON_PERMIT_ARCHETYPE_IDS: readonly ArchetypeId[] = [
  'detetive',
  'policial',
]

export const MODULE_A_WEAPON_PERMIT_PROFESSION_IDS: readonly CivilProfessionId[] =
  ['seguranca-privada']

/** Mínimo de caracteres do Motivo de Presença exigido do arquétipo Civil. */
export const MODULE_A_PRESENCE_REASON_MIN_LENGTH = 10

// ---------------------------------------------------------------------------
// Habilidades Gerais (regras oficiais)
// ---------------------------------------------------------------------------
// Até 2 escolhas. Cada vaga não preenchida concede +10 pontos diretos em uma
// perícia, escolhida na etapa de Bônus (fora do pool, respeitando o teto).
// Físicas gastam ST, mentais gastam EM.
export const MODULE_A_GENERAL_SKILL_MAX_CHOICES = 2
export const MODULE_A_GENERAL_SKILL_FREE_SLOT_BONUS = 10

// ---------------------------------------------------------------------------
// Âncoras Pessoais (regras oficiais)
// ---------------------------------------------------------------------------
// 3 âncoras, mínimo de 10 pontos cada, somatório exato de PSIQUE + 20.
export const MODULE_A_ANCHOR_COUNT = 3
export const MODULE_A_ANCHOR_BASE_POINTS = 20
export const MODULE_A_ANCHOR_MIN_POINTS = 10
export const MODULE_A_ANCHOR_ATTRIBUTE: AttributeKey = 'psique'

const generalSkillCategories: readonly GeneralSkillCategoryDefinition[] = [
  {
    id: 'physical',
    label: 'Físicas e de Combate',
    description: 'Treino corporal, disparo e resistência sob estresse.',
    resource: 'estamina',
    abbreviation: 'ST',
  },
  {
    id: 'mental',
    label: 'Mentais e de Suporte',
    description: 'Controle de pressão, análise e comando do grupo.',
    resource: 'energia',
    abbreviation: 'EM',
  },
]

/** Catálogo de habilidades gerais do Módulo A. */
export const MODULE_A_GENERAL_SKILL_CATALOG: readonly GeneralSkill[] = [
  {
    id: 'mira-estavel',
    label: 'Mira Estável',
    category: 'physical',
    resource: 'estamina',
    cost: 1,
    description: 'Respiração funda e apoio firme antes do disparo.',
    effect:
      'Ao abdicar da ação de movimento no turno, o próximo disparo com arma de fogo na mesma rodada recebe Vantagem.',
    requirement: {
      all: [
        { attribute: 'destreza', min: 55 },
        { skill: 'combate', label: 'Combate (Armas de Fogo)', min: 30 },
      ],
    },
  },
  {
    id: 'arrancada-de-adrenalina',
    label: 'Arrancada de Adrenalina',
    category: 'physical',
    resource: 'estamina',
    cost: 1,
    description: 'O instinto de sobrevivência vira explosão de movimento.',
    effect:
      'Ignora todas as penalidades de deslocamento de uma lesão grave por 1 rodada ou recebe Vantagem em Atletismo para escapar de uma manobra de Agarre.',
    requirement: { all: [{ attribute: 'fisico', min: 55 }] },
  },
  {
    id: 'fogo-de-supressao',
    label: 'Fogo de Supressão',
    category: 'physical',
    resource: 'estamina',
    cost: 2,
    costNote: '1 turno inteiro de munição',
    description: 'Disparos agressivos para manter o alvo acuado, não para matar.',
    effect:
      'O alvo sofre Desvantagem no próximo ataque que fizer ou perde a ação de movimento caso tente avançar na sua direção.',
    requirement: {
      all: [
        { attribute: 'destreza', min: 55 },
        { skill: 'combate', label: 'Combate (Armas de Fogo)', min: 40 },
      ],
    },
  },
  {
    id: 'resiliencia-bruta',
    label: 'Resiliência Bruta',
    category: 'physical',
    resource: 'estamina',
    cost: 2,
    description: 'Corpo treinado para absorver o impacto que o derrubaria.',
    effect:
      'Ao sofrer dano físico que reduziria seus PV a 0, mantém-se de pé com exatamente 1 PV. Uma vez por cena; não vale contra dano massivo de Morte Instantânea.',
    requirement: { all: [{ attribute: 'fisico', min: 60 }] },
  },
  {
    id: 'desfibrilador-humano',
    label: 'Desfibrilador Humano',
    category: 'mental',
    resource: 'energia',
    cost: 2,
    description: 'O desespero ensina a improvisar com as mãos trêmulas.',
    effect:
      'Repete a estabilização de um aliado CAÍDO que acabou de falhar. Se a tentativa extra for Falha Crítica, o paciente morre e você sofre 1d6 de dano de Estabilidade Mental pela culpa.',
    requirement: {
      all: [
        { attribute: 'intelecto', min: 55 },
        { skill: 'medicina', min: 40 },
      ],
    },
  },
  {
    id: 'hiperfoco-investigativo',
    label: 'Hiperfoco Investigativo',
    category: 'mental',
    resource: 'energia',
    cost: 1,
    description: 'Filtra o caos e sustenta atenção absoluta nos detalhes.',
    effect:
      'Ao entrar em uma sala ou analisar uma cena de crime, ganha metade do valor da perícia Investigação como bônus nela (limite 90%).',
    requirement: {
      anyOf: [
        [{ attribute: 'intelecto', min: 60 }],
        [{ skill: 'investigacao', min: 40 }],
      ],
    },
  },
  {
    id: 'voz-de-comando',
    label: 'Voz de Comando / Sangue Frio',
    category: 'mental',
    resource: 'energia',
    cost: 1,
    description: 'Uma ordem, um tapa ou um puxão que devolve o foco ao aliado.',
    effect:
      'Quando um aliado que você pode ver e ouvir falha em Estabilidade Mental ou entra em Paralisia Tática, ele desperta e refaz o teste, mantendo o novo resultado.',
    requirement: { all: [{ attribute: 'psique', min: 55 }] },
  },
  {
    id: 'memoria-eidetica',
    label: 'Memória Eidética',
    category: 'mental',
    resource: 'energia',
    cost: 1,
    description: 'Retenção quase fotográfica de tudo o que já observou.',
    effect:
      'Ganha metade do valor da perícia relevante como bônus (limite 90%) em testes de Conhecimento, Ciência ou Tecnologia (ou Intelecto puro) para recordar senhas, plantas e documentos.',
    requirement: { all: [{ attribute: 'intelecto', min: 60 }] },
  },
]


const equipmentCategories: readonly EquipmentCategoryDefinition[] = [
  {
    id: 'weapon',
    label: 'Armas',
    description:
      'Armamento de porte e ferramentas de impacto. Armas longas e pesadas são proibidas na criação de Nível 1; armas curtas e munição solta exigem credencial.',
  },
  {
    id: 'survival',
    label: 'Sobrevivência',
    description: 'Equipamento de campo para operar sem apoio imediato.',
  },
  {
    id: 'profession',
    label: 'Profissão · Civis',
    description:
      'Itens de ofício: entram automaticamente pela profissão contemporânea e não podem ser escolhidos nem removidos livremente.',
  },
  {
    id: 'utility',
    label: 'Carga & Transporte',
    description:
      'Itens de bolso (0 slot) e recipientes que alteram o limite de carga.',
  },
]

/** Catálogo de equipamentos do Módulo A, agrupado por categoria na UI. */
export const MODULE_A_EQUIPMENT_CATALOG: readonly Equipment[] = [
  {
    id: 'faca-canivete',
    label: 'Faca / Canivete',
    category: 'weapon',
    slotCost: 1,
    description: 'Lâmina curta de uso discreto e fácil de ocultar.',
  },
  {
    id: 'marreta-pe-de-cabra',
    label: 'Marreta / Pé de Cabra',
    category: 'weapon',
    slotCost: 1,
    description: 'Ferramenta pesada que abre portas e serve de impacto.',
  },
  {
    id: 'revolver-pistola',
    label: 'Revólver .38 / Pistola 9mm',
    category: 'weapon',
    slotCost: 1,
    description:
      'Arma de fogo curta, de porte relativamente simples. Exige credencial: Detetive, Policial ou Segurança Privada.',
    requiresWeaponPermit: true,
  },
  {
    id: 'espingarda-submetralhadora',
    label: 'Espingarda Tática / Submetralhadora',
    category: 'weapon',
    slotCost: 2,
    description:
      'Arma longa ou automática que exige transporte dedicado. Proibida na criação de ficha de Nível 1.',
    creationBlocked: true,
  },
  {
    id: 'fuzil',
    label: 'Fuzil de Assalto',
    category: 'weapon',
    slotCost: 3,
    description:
      'Arma de alto alcance; volumosa e difícil de dissimular. Proibida na criação de ficha de Nível 1.',
    creationBlocked: true,
  },
  {
    id: 'municao-solta',
    label: 'Caixas de Munição Solta',
    category: 'weapon',
    slotCost: 1,
    description:
      'Munição de reposição sem arma vinculada. Restrita a portadores de credencial: Detetive, Policial ou Segurança Privada.',
    requiresWeaponPermit: true,
  },
  {
    id: 'lanterna',
    label: 'Lanterna',
    category: 'survival',
    slotCost: 1,
    description: 'Iluminação portátil para locais sem energia.',
  },
  {
    id: 'gravador',
    label: 'Gravador de Voz Digital',
    category: 'survival',
    slotCost: 1,
    description: 'Registro de áudio para entrevistas e ocorrências.',
  },
  {
    id: 'radio',
    label: 'Rádio Comunicador',
    category: 'survival',
    slotCost: 1,
    description: 'Comunicação de campo em frequências restritas.',
  },
  {
    id: 'racao-agua',
    label: 'Ração / Água',
    category: 'survival',
    slotCost: 1,
    description: 'Suprimento básico para operações prolongadas.',
  },
  {
    id: 'alicate-fita',
    label: 'Alicate Multifunção / Fita',
    category: 'profession',
    slotCost: 1,
    description:
      'Reparos rápidos, vedação e improviso técnico. Item de ofício do Eletricista / Mecânico.',
    isExclusiveToProfession: true,
    grantedByProfessionIds: ['eletricista-mecanico'],
  },
  {
    id: 'kit-gazuas',
    label: 'Kit Profissional de Gazuas',
    category: 'profession',
    slotCost: 1,
    description:
      'Abertura de fechos simples sem arrombamento. Item de ofício do Chaveiro / Ladrão.',
    isExclusiveToProfession: true,
    grantedByProfessionIds: ['chaveiro-ladrao'],
  },
  {
    id: 'kit-trauma',
    label: 'Kit de Trauma Avançado',
    category: 'profession',
    slotCost: 2,
    description:
      'Estabilização de ferimentos graves em campo. Item de ofício do Paramédico / Enfermeiro.',
    isExclusiveToProfession: true,
    grantedByProfessionIds: ['paramedico-enfermeiro'],
  },
  {
    id: 'lanterna-cabeca',
    label: 'Lanterna de Cabeça',
    category: 'profession',
    slotCost: 1,
    description:
      'Iluminação frontal que mantém as mãos livres para o trabalho. Item de ofício do Eletricista / Mecânico.',
    isExclusiveToProfession: true,
    grantedByProfessionIds: ['eletricista-mecanico'],
  },
  {
    id: 'lanterna-tatica',
    label: 'Lanterna Tática Pesada',
    category: 'profession',
    slotCost: 1,
    description:
      'Feixe potente e corpo reforçado para patrulhamento. Item de ofício da Segurança Privada.',
    isExclusiveToProfession: true,
    grantedByProfessionIds: ['seguranca-privada'],
  },
  {
    id: 'tranquilizantes',
    label: 'Tranquilizantes (Tarja Preta)',
    category: 'profession',
    slotCost: 1, 
    description: 'Medicação controlada de uso emergencial. Item de ofício do Psicólogo.',
    isExclusiveToProfession: true,
    grantedByProfessionIds: ['psicologo'],
  },
  {
    id: 'mochila-alta-capacidade',
    label: 'Mochila de Alta Capacidade',
    category: 'profession', 
    slotCost: 0,
    description: 'Compartimentos reforçados que ampliam a carga útil. Item de ofício do Entregador / Atleta.',
    effect: `+${MODULE_A_BACKPACK_SLOT_BONUS} slots no limite máximo de carga.`,
    slotBonus: MODULE_A_BACKPACK_SLOT_BONUS,
    isExclusiveToProfession: true, 
    grantedByProfessionIds: ['entregador-atleta'],
  },
  {
    id: 'estimulantes-energeticos',
    label: 'Estimulantes Energéticos',
    category: 'profession',
    slotCost: 1,
    description: 'Doses de bolso para sustentar esforço prolongado. Item de ofício do Entregador / Atleta.',
    isExclusiveToProfession: true,
    grantedByProfessionIds: ['entregador-atleta'],
  },
  {
    id: 'documentos-carteira',
    label: 'Documentos / Carteira',
    category: 'utility',
    slotCost: 0,
    description: 'Credenciais e identificação de bolso.',
  },
  {
    id: 'pilhas-carregador',
    label: 'Pilhas / Carregador',
    category: 'utility',
    slotCost: 0,
    description: 'Reposição de energia para equipamentos eletrônicos.',
  },
  {
    id: 'fita-isolante',
    label: 'Fita Isolante',
    category: 'utility',
    slotCost: 0,
    description:
      'Vedação elétrica e reparos rápidos de bolso. Item de ofício do Eletricista / Mecânico.',
    isExclusiveToProfession: true,
    grantedByProfessionIds: ['eletricista-mecanico'],
  },
]


/** Perícias consideradas de combate no Módulo A. */
export const MODULE_A_COMBAT_SKILL_IDS: readonly SkillId[] = ['combate']

const attributes: readonly AttributeDefinition[] = [
  {
    key: 'fisico',
    label: 'Físico',
    abbreviation: 'FIS',
    description: 'Força, resistência e vigor corporal.',
  },
  {
    key: 'destreza',
    label: 'Destreza',
    abbreviation: 'DES',
    description: 'Agilidade, reflexos e coordenação motora.',
  },
  {
    key: 'intelecto',
    label: 'Intelecto',
    abbreviation: 'INT',
    description: 'Raciocínio, memória e análise técnica.',
  },
  {
    key: 'psique',
    label: 'Psique',
    abbreviation: 'PSI',
    description: 'Estabilidade emocional e força de vontade.',
  },
]

const baseSkills: readonly SkillDefinition[] = [
  {
    id: 'atletismo',
    label: 'Atletismo',
    description: 'Correr, escalar e resistir a esforço físico prolongado.',
    attribute: 'fisico',
    category: 'base',
  },
  {
    id: 'combate',
    label: 'Combate',
    description: 'Uso de armas e confronto direto.',
    attribute: 'fisico',
    category: 'base',
  },
  {
    id: 'furtividade',
    label: 'Furtividade',
    description: 'Mover-se sem ser percebido e passar despercebido.',
    attribute: 'destreza',
    category: 'base',
  },
  {
    id: 'percepcao',
    label: 'Percepção',
    description: 'Notar detalhes, sons e movimentos fora do comum.',
    attribute: 'intelecto',
    category: 'base',
  },
  {
    id: 'persuasao',
    label: 'Persuasão',
    description: 'Convencer, negociar e conduzir uma conversa.',
    attribute: 'psique',
    category: 'base',
  },
  {
    id: 'intimidacao',
    label: 'Intimidação',
    description: 'Impor presença e obter respostas pela pressão.',
    attribute: 'psique',
    category: 'base',
  },
  {
    id: 'investigacao',
    label: 'Investigação',
    description: 'Reunir pistas e cruzar informações.',
    attribute: 'intelecto',
    category: 'base',
  },
  {
    id: 'tecnologia',
    label: 'Tecnologia',
    description: 'Operar, reparar e decifrar equipamentos.',
    attribute: 'intelecto',
    category: 'base',
  },
  {
    id: 'medicina',
    label: 'Medicina',
    description: 'Estabilizar ferimentos e avaliar condições clínicas.',
    attribute: 'intelecto',
    category: 'base',
  },
  {
    id: 'sobrevivencia',
    label: 'Sobrevivência',
    description: 'Orientar-se, rastrear e resistir a ambientes hostis.',
    attribute: 'fisico',
    category: 'base',
  },
]

const archetypes: readonly ArchetypeDefinition[] = [
  {
    id: 'detetive',
    label: 'Detetive',
    summary: 'Dedução e leitura de cena.',
    description:
      'Investigador acostumado a reconstruir fatos. Recebe +20 de Intelecto após a distribuição.',
    attributeBonuses: { intelecto: 20 },
  },
  {
    id: 'policial',
    label: 'Policial',
    summary: 'Resposta física imediata.',
    description:
      'Operador tático preparado para o confronto. Recebe +10 de Físico e +10 de Destreza após a distribuição.',
    attributeBonuses: { fisico: 10, destreza: 10 },
  },
  {
    id: 'civil',
    label: 'Civil',
    summary: 'Adaptação social e discrição.',
    description:
      'Age fora dos protocolos formais. Recebe +10 de Psique e +10 no atributo principal da profissão escolhida na etapa de Identidade, mas tem o investimento em perícias de combate limitado a 40%.',
    attributeBonuses: { psique: 10 },
  },
]

/**
 * Profissões contemporâneas exclusivas do arquétipo Civil. O atributo principal
 * é fixo (exceto no Entregador, que permite escolher Físico ou Destreza), recebe
 * o bônus de arquétipo fora do pool e define o pré-requisito da profissão.
 * O bônus de perícia é aplicado ao valor final e os itens iniciais entram no
 * inventário de forma imutável, consumindo slots normalmente.
 *
 * Observação de mapeamento: "Reparos" usa Tecnologia (operação/reparo de
 * equipamentos), "Crime" usa Furtividade/Tecnologia e "Luta" usa Combate.
 */
export const MODULE_A_CIVIL_PROFESSIONS: readonly CivilProfession[] = [
  {
    id: 'eletricista-mecanico',
    label: 'Eletricista / Mecânico',
    summary: 'Manutenção elétrica, ferramentas de mão e reparos de campo.',
    primaryAttribute: 'destreza',
    reqValue: 60,
    attributeBonus: MODULE_A_CIVIL_PROFESSION_ATTRIBUTE_BONUS,
    bonusSkillIds: ['tecnologia'],
    bonusValue: MODULE_A_CIVIL_PROFESSION_SKILL_BONUS,
    initialEquipmentIds: ['lanterna-cabeca', 'alicate-fita', 'fita-isolante'],
  },
  {
    id: 'paramedico-enfermeiro',
    label: 'Paramédico / Enfermeiro',
    summary: 'Estabilização de ferimentos e suporte clínico imediato.',
    primaryAttribute: 'intelecto',
    reqValue: 60,
    attributeBonus: MODULE_A_CIVIL_PROFESSION_ATTRIBUTE_BONUS,
    bonusSkillIds: ['medicina'],
    bonusValue: MODULE_A_CIVIL_PROFESSION_SKILL_BONUS,
    initialEquipmentIds: ['kit-trauma'],
  },
  {
    id: 'seguranca-privada',
    label: 'Segurança Privada',
    summary: 'Vigilância, patrulhamento e resposta direta a confrontos.',
    primaryAttribute: 'fisico',
    reqValue: 60,
    attributeBonus: MODULE_A_CIVIL_PROFESSION_ATTRIBUTE_BONUS,
    bonusSkillIds: ['percepcao', 'combate'],
    bonusValue: MODULE_A_CIVIL_PROFESSION_SKILL_BONUS,
    initialEquipmentIds: ['lanterna-tatica', 'radio'],
  },
  {
    id: 'chaveiro-ladrao',
    label: 'Chaveiro / Ladrão',
    summary: 'Abertura de fechos, discrição e trânsito em ambientes ilícitos.',
    primaryAttribute: 'destreza',
    reqValue: 55,
    attributeBonus: MODULE_A_CIVIL_PROFESSION_ATTRIBUTE_BONUS,
    bonusSkillIds: ['furtividade', 'tecnologia'],
    bonusValue: MODULE_A_CIVIL_PROFESSION_SKILL_BONUS,
    initialEquipmentIds: ['kit-gazuas'],
  },
  {
    id: 'entregador-atleta',
    label: 'Entregador / Atleta Amador',
    summary: 'Deslocamento urbano, fôlego e resistência a longas jornadas.',
    primaryAttribute: null,
    attributeOptions: ['fisico', 'destreza'],
    reqValue: 60,
    attributeBonus: MODULE_A_CIVIL_PROFESSION_ATTRIBUTE_BONUS,
    bonusSkillIds: ['atletismo'],
    bonusValue: MODULE_A_CIVIL_PROFESSION_SKILL_BONUS,
    initialEquipmentIds: ['mochila-alta-capacidade', 'estimulantes-energeticos'],
  },
  {
    id: 'psicologo',
    label: 'Psicólogo',
    summary: 'Escuta técnica, leitura de comportamento e contenção emocional.',
    primaryAttribute: 'psique',
    reqValue: 60,
    attributeBonus: MODULE_A_CIVIL_PROFESSION_ATTRIBUTE_BONUS,
    bonusSkillIds: ['percepcao', 'persuasao'],
    bonusValue: MODULE_A_CIVIL_PROFESSION_SKILL_BONUS,
    initialEquipmentIds: ['gravador', 'tranquilizantes'],
  },
]

const derivedStats: readonly DerivedStatDefinition[] = [
  {
    key: 'pv',
    label: 'Pontos de Vida',
    abbreviation: 'PV',
    description:
      'Resistência física acumulada. Fórmula: 5 + ((FIS + PSI) / 20).',
    calculate: (attributes) =>
      Math.floor(5 + (attributes.fisico + attributes.psique) / 20),
  },
  {
    key: 'sanidade',
    label: 'Estabilidade Mental',
    abbreviation: 'SAN',
    description: 'Sanidade total do personagem. Fórmula: PSI.',
    calculate: (attributes) => Math.floor(attributes.psique),
  },
  {
    key: 'estamina',
    label: 'Estamina',
    abbreviation: 'ST',
    description: 'Reserva de esforço diário. Fórmula: FIS / 10.',
    calculate: (attributes) => Math.floor(attributes.fisico / 10),
  },
  {
    key: 'energia',
    label: 'Energia Mental',
    abbreviation: 'EM',
    description: 'Reserva mental de uso diário. Fórmula: (INT + PSI) / 20.',
    calculate: (attributes) => Math.floor((attributes.intelecto + attributes.psique) / 20),
  },
]

const steps: readonly WizardStepDefinition[] = [
  {
    id: 'identity',
    label: 'Identidade',
    title: 'Identidade & Arquétipo',
    description:
      'Registre o nome do personagem e escolha o arquétipo. Personagens Civis escolhem também a profissão contemporânea, que define o atributo principal, o bônus de +10 fora do pool, o pré-requisito da etapa de Atributos e o Motivo de Presença.',
  },
  {
    id: 'attributes',
    label: 'Atributos',
    title: 'Distribuição de Atributos',
    description: `Cada atributo parte de ${MODULE_A_ATTRIBUTE_BASE}. Distribua exatamente ${MODULE_A_ATTRIBUTE_POOL} pontos, respeitando o teto final de ${MODULE_A_ATTRIBUTE_MAX} por atributo (bônus incluídos). Civis precisam levar o atributo principal da profissão ao pré-requisito exigido, já contando o bônus de +${MODULE_A_CIVIL_PROFESSION_ATTRIBUTE_BONUS}.`,
  },
  {
    id: 'skills',
    label: 'Perícias',
    title: 'Distribuição de Perícias',
    description: `O valor base de cada perícia é metade do atributo correspondente. Invista o pool de ${MODULE_A_SKILL_POOL} pontos respeitando o teto final de ${MODULE_A_SKILL_MAX_RANK} por perícia (base + investimento), o que limita o investimento manual a ${MODULE_A_SKILL_MAX_RANK} menos o valor base; perícias de combate do Civil têm teto final de ${MODULE_A_CIVIL_COMBAT_MAX}. Atingir o teto final concede +${MODULE_A_SKILL_BONUS_AT_MAX} pontos de pool. As habilidades gerais são escolhidas depois, com os valores finais já definidos.`,
  },
  {
    id: 'general-skills',
    label: 'Habilidades',
    title: 'Habilidades Gerais',
    description: `Escolha até ${MODULE_A_GENERAL_SKILL_MAX_CHOICES} habilidades gerais. Habilidades físicas e de combate gastam ST; mentais e de suporte gastam EM. Os pré-requisitos são cobrados sobre os atributos e perícias finais. Cada vaga não preenchida concede +${MODULE_A_GENERAL_SKILL_FREE_SLOT_BONUS} pontos em uma perícia na etapa seguinte.`,
  },
  {
    id: 'free-skill-bonus',
    label: 'Bônus',
    title: 'Bônus de Vagas Livres',
    description: `Cada habilidade geral não escolhida concede +${MODULE_A_GENERAL_SKILL_FREE_SLOT_BONUS} pontos diretos em uma perícia do seu personagem. O bônus entra no valor final, fora do pool, mas respeita o teto vigente da perícia. Etapa universal: obrigatória para Detetive, Policial e Civil sempre que houver vaga livre; dispensada quando as duas habilidades forem escolhidas.`,
  },
  {
    id: 'anchors',
    label: 'Âncoras',
    title: 'Âncoras Pessoais',
    description: `Distribua exatamente PSIQUE + ${MODULE_A_ANCHOR_BASE_POINTS} pontos entre ${MODULE_A_ANCHOR_COUNT} âncoras, com no mínimo ${MODULE_A_ANCHOR_MIN_POINTS} pontos em cada uma.`,
  },
  {
    id: 'equipment',
    label: 'Equipamentos',
    title: 'Equipamentos & Inventário',
    description: `Cada item consome slots de carga. A capacidade é floor(FÍSICO / ${MODULE_A_SLOT_ATTRIBUTE_STEP}) + ${MODULE_A_BASE_SLOTS}, ampliada em +${MODULE_A_BACKPACK_SLOT_BONUS} com a mochila de alta capacidade. Armas longas/pesadas são proibidas; armas curtas e munição solta exigem credencial; itens de ofício entram apenas pela profissão.`,
  },
  {
    id: 'review',
    label: 'Revisão',
    title: 'Revisão da Ficha',
    description:
      'Confira atributos finais, derivados, habilidades gerais, perícias, âncoras e inventário antes de exportar a ficha.',
  },
]

/**
 * Configuração completa do Módulo A.
 * A UI consome apenas este contrato (`ModuleRules`), portanto o Módulo B pode
 * ser adicionado ao registry sem alterar componentes.
 */
export const moduleA: ModuleRules = {
  id: 'module-a',
  name: 'Módulo A',
  tagline: 'Investida Civil',
  description:
    'Regras de criação para personagens de campo com foco em investigação e resposta urbana.',
  attributeRules: {
    base: MODULE_A_ATTRIBUTE_BASE,
    pool: MODULE_A_ATTRIBUTE_POOL,
    min: MODULE_A_ATTRIBUTE_BASE,
    max: MODULE_A_ATTRIBUTE_MAX,
    capIncludesBonuses: true,
  },
  skillRules: {
    pool: MODULE_A_SKILL_POOL,
    maxRank: MODULE_A_SKILL_MAX_RANK,
    baseFromAttribute: (attributeValue) => Math.floor(attributeValue / 2),
    bonusAtMax: MODULE_A_SKILL_BONUS_AT_MAX,
    caps: [
      {
        skillIds: MODULE_A_COMBAT_SKILL_IDS,
        archetypeIds: ['civil'],
        maxLimit: MODULE_A_CIVIL_COMBAT_MAX,
      },
    ],
  },
  attributes,
  skills: baseSkills,
  archetypes,
  derivedStats,
  generalSkillRules: {
    maxChoices: MODULE_A_GENERAL_SKILL_MAX_CHOICES,
    freeSlotBonusPerSlot: MODULE_A_GENERAL_SKILL_FREE_SLOT_BONUS,
  },
  generalSkills: MODULE_A_GENERAL_SKILL_CATALOG,
  generalSkillCategories,
  anchorRules: {
    count: MODULE_A_ANCHOR_COUNT,
    basePoints: MODULE_A_ANCHOR_BASE_POINTS,
    minPerAnchor: MODULE_A_ANCHOR_MIN_POINTS,
    attribute: MODULE_A_ANCHOR_ATTRIBUTE,
  },
  civilProfessions: MODULE_A_CIVIL_PROFESSIONS,
  equipmentRules: {
    slotsPerAttributeStep: MODULE_A_SLOT_ATTRIBUTE_STEP,
    baseSlots: MODULE_A_BASE_SLOTS,
    backpackBonus: MODULE_A_BACKPACK_SLOT_BONUS,
    weaponPermitArchetypeIds: MODULE_A_WEAPON_PERMIT_ARCHETYPE_IDS,
    weaponPermitProfessionIds: MODULE_A_WEAPON_PERMIT_PROFESSION_IDS,
  },
  equipmentCategories,
  equipmentCatalog: MODULE_A_EQUIPMENT_CATALOG,
  steps,
}
