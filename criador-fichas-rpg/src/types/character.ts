/**
 * Contratos de dados compartilhados entre a UI e os módulos de regras.
 * Nenhum componente visual deve conhecer limites numéricos: eles vivem em
 * `src/config/modules/*`, sempre tipados por estas interfaces.
 */

export type AttributeKey = 'fisico' | 'destreza' | 'intelecto' | 'psique'

export type Attributes = Record<AttributeKey, number>

export type DerivedKey = 'pv' | 'sanidade' | 'estamina' | 'energia'

export type DerivedStats = Record<DerivedKey, number>

export type ArchetypeId = 'detetive' | 'policial' | 'civil'

export type BaseSkillId =
  | 'atletismo'
  | 'combate'
  | 'furtividade'
  | 'percepcao'
  | 'persuasao'
  | 'intimidacao'
  | 'investigacao'
  | 'tecnologia'
  | 'medicina'
  | 'sobrevivencia'

export type SkillId = BaseSkillId

export type SkillCategory = 'base' | 'module'

export type SkillRanks = Record<SkillId, number>

export type GeneralSkillId =
  | 'mira-estavel'
  | 'arrancada-de-adrenalina'
  | 'fogo-de-supressao'
  | 'resiliencia-bruta'
  | 'desfibrilador-humano'
  | 'hiperfoco-investigativo'
  | 'voz-de-comando'
  | 'memoria-eidetica'

export type GeneralSkillCategory = 'physical' | 'mental'

/** Recurso consumido ao acionar uma habilidade geral. */
export type ResourceKey = 'estamina' | 'energia'

/** Exigência individual de uma habilidade: atributo OU perícia com mínimo. */
export type GeneralSkillRequirementEntry =
  | {
      attribute: AttributeKey
      /** Valor mínimo exigido no atributo final. */
      min: number
      /** Rótulo exibido na UI; padrão: nome do atributo no módulo. */
      label?: string
    }
  | {
      skill: SkillId
      /** Valor mínimo exigido no valor final da perícia. */
      min: number
      /** Rótulo exibido na UI; padrão: nome da perícia no módulo. */
      label?: string
    }

/**
 * Pré-requisitos avaliados com os atributos finais e o valor final das
 * perícias (base do atributo + investimento + bônus de arquétipo/profissão).
 *
 * - `all`: precisa ser integralmente satisfeito (E).
 * - `anyOf`: cada grupo é um conjunto que deve ser satisfeito por inteiro;
 *   basta que UM dos grupos seja satisfeito (OU).
 */
export interface GeneralSkillRequirement {
  all?: readonly GeneralSkillRequirementEntry[]
  anyOf?: readonly (readonly GeneralSkillRequirementEntry[])[]
}

export interface GeneralSkill {
  id: GeneralSkillId
  label: string
  category: GeneralSkillCategory
  /** Recurso gasto pela habilidade: ST para físicas, EM para mentais. */
  resource: ResourceKey
  /** Custo no recurso indicado. */
  cost: number
  /** Custo adicional descritivo (ex.: munição gasta por turno). */
  costNote?: string
  description: string
  effect: string
  requirement?: GeneralSkillRequirement
}

export interface GeneralSkillRules {
  /** Máximo de habilidades gerais escolhidas. */
  maxChoices: number
  /** Bônus de perícia concedido por habilidade NÃO escolhida. */
  freeSlotBonusPerSlot: number
}

export interface GeneralSkillCategoryDefinition {
  id: GeneralSkillCategory
  label: string
  description: string
  resource: ResourceKey
  /** Abreviação do recurso exibida na UI (ST / EM). */
  abbreviation: string
}

/** Situação de um pré-requisito exibida na etapa de habilidades. */
export interface GeneralSkillRequirementStatus {
  label: string
  current: number
  required: number
  met: boolean
  /** Exigência pertencente a um grupo alternativo (OU). */
  alternative?: boolean
}

/** Âncora pessoal: vínculo narrativo com pontos investidos. */
export interface Anchor {
  id: string
  name: string
  description: string
  points: number
}

export interface AnchorRules {
  /** Quantidade exata de âncoras exigidas. */
  count: number
  /** Pontos somados ao atributo de referência para definir o total. */
  basePoints: number
  /** Mínimo de pontos por âncora. */
  minPerAnchor: number
  /** Atributo que define o total de pontos. */
  attribute: AttributeKey
}

export type WizardStepId =
  | 'identity'
  | 'attributes'
  | 'skills'
  | 'general-skills'
  | 'free-skill-bonus'
  | 'anchors'
  | 'equipment'
  | 'review'

export type EquipmentCategory = 'weapon' | 'survival' | 'profession' | 'utility'

/**
 * Item do catálogo de equipamentos do módulo. `slotCost` é o custo fixo em
 * slots de carga (0 para itens de bolso) e `slotBonus` representa modificadores
 * que ampliam o limite máximo de carga (ex.: mochila).
 */
export interface Equipment {
  id: string
  label: string
  category: EquipmentCategory
  slotCost: number
  description: string
  /** Efeito mecânico opcional aplicado na ficha final. */
  effect?: string
  /** Bônus concedido ao limite máximo de slots (mochila). */
  slotBonus?: number
  /**
   * Proibido na criação de ficha de Nível 1 (armas longas/pesadas). A
   * restrição vale para qualquer arquétipo ou profissão.
   */
  creationBlocked?: boolean
  /**
   * Item de ofício: entra no inventário apenas pela profissão declarada em
   * `grantedByProfessionIds`, de forma automática e não removível.
   */
  isExclusiveToProfession?: boolean
  /** Profissões que concedem o item quando `isExclusiveToProfession`. */
  grantedByProfessionIds?: readonly CivilProfessionId[]
  /** Exige porte/credencial de arma para ser escolhido na criação. */
  requiresWeaponPermit?: boolean
}

export interface EquipmentCategoryDefinition {
  id: EquipmentCategory
  label: string
  description: string
}

/** Limites de carga do módulo, isolados da UI. */
export interface EquipmentRules {
  /** Cada faixa deste valor no atributo concede +1 slot. */
  slotsPerAttributeStep: number
  /** Slots concedidos antes de considerar o atributo. */
  baseSlots: number
  /** Bônus de slots concedido pelos itens com `slotBonus`. */
  backpackBonus: number
  /** Arquétipos que podem portar arma curta na criação (mediante aprovação). */
  weaponPermitArchetypeIds: readonly ArchetypeId[]
  /** Profissões civis que podem portar arma curta na criação. */
  weaponPermitProfessionIds: readonly CivilProfessionId[]
}

/** Ocupação atual de carga do personagem. */
/** Distúrbio psicológico inicial (Cicatrizes da Mente). */
export interface InitialDisturbanceDefinition {
  id: string
  label: string
  description: string
}

export interface DisturbanceRules {
  /**
   * Limite de Estabilidade Mental (SAN): abaixo deste valor o personagem
   * precisa registrar um distúrbio inicial. A partir dele, o campo é ocultado
   * e qualquer valor guardado no rascunho é descartado.
   */
  sanityThreshold: number
  /** Opções disponíveis no select de Cicatrizes da Mente. */
  options: readonly InitialDisturbanceDefinition[]
}

export interface CarryCapacity {
  usedSlots: number
  baseSlots: number
  bonusSlots: number
  maxSlots: number
}

export interface AttributeDefinition {
  key: AttributeKey
  label: string
  abbreviation: string
  description: string
}

export interface SkillDefinition {
  id: SkillId
  label: string
  description: string
  /** Atributo que define o valor base da perícia. */
  attribute: AttributeKey
  category: SkillCategory
}

export interface ArchetypeDefinition {
  id: ArchetypeId
  label: string
  summary: string
  description: string
  /** Bônus fixos aplicados depois da distribuição (não consomem o pool). */
  attributeBonuses: Partial<Attributes>
  /** Bônus fixos de perícia aplicados após a distribuição. */
  skillBonuses?: Partial<SkillRanks>
}

export type CivilProfessionId =
  | 'eletricista-mecanico'
  | 'paramedico-enfermeiro'
  | 'seguranca-privada'
  | 'chaveiro-ladrao'
  | 'entregador-atleta'
  | 'psicologo'

/**
 * Profissão contemporânea exclusiva do arquétipo Civil. A profissão é escolhida
 * na etapa de Identidade e define o atributo principal: ele recebe o bônus fixo
 * de arquétipo (fora do pool) e é o atributo cobrado pelo pré-requisito.
 */
export interface CivilProfession {
  id: CivilProfessionId
  label: string
  summary: string
  /**
   * Atributo principal engessado. `null` indica profissão flexível: o jogador
   * escolhe uma das `attributeOptions` na etapa de Identidade.
   */
  primaryAttribute: AttributeKey | null
  /** Opções de atributo principal quando a profissão é flexível. */
  attributeOptions?: readonly AttributeKey[]
  /** Pré-requisito avaliado sobre o valor FINAL do atributo principal. */
  reqValue: number
  /** Bônus fixo somado ao atributo principal, fora do pool de pontos. */
  attributeBonus: number
  /** Perícias elegíveis ao bônus; mais de uma exige `professionSkillChoice`. */
  bonusSkillIds: readonly SkillId[]
  /** Pontos somados ao valor final da perícia escolhida (não consomem pool). */
  bonusValue: number
  /** Itens injetados automática e imutavelmente no inventário inicial. */
  initialEquipmentIds: readonly string[]
}

export interface DerivedStatDefinition {
  key: DerivedKey
  label: string
  abbreviation: string
  description: string
  calculate: (attributes: Attributes) => number
}

export interface AttributeRules {
  /** Valor inicial de cada atributo antes da distribuição. */
  base: number
  /** Total de pontos que devem ser distribuídos entre todos os atributos. */
  pool: number
  min: number
  max: number
  /**
   * Quando verdadeiro, `max` representa o teto final do atributo, ou seja,
   * bônus de arquétipo incluídos. A distribuição manual fica limitada a
   * `max - bônus`.
   */
  capIncludesBonuses: boolean
}

/** Limite absoluto do valor final (base + investimento) para certas perícias. */
export interface SkillCapRule {
  skillIds: readonly SkillId[]
  archetypeIds: readonly ArchetypeId[]
  /** Teto absoluto do valor final permitido (ex.: 40). */
  maxLimit: number
}

export interface SkillRules {
  /** Pool de pontos que deve ser investido por completo. */
  pool: number
  /**
   * Teto absoluto do valor final (base do atributo + pontos investidos) de uma
   * perícia. O investimento manual fica limitado a `maxRank - base`.
   */
  maxRank: number
  /** Valor base da perícia derivado do atributo correspondente. */
  baseFromAttribute: (attributeValue: number) => number
  /** Pontos extras de pool concedidos quando o valor final atinge o teto. */
  bonusAtMax: number
  /** Limites adicionais absolutos de valor final por arquétipo. */
  caps: readonly SkillCapRule[]
}

export interface WizardStepDefinition {
  id: WizardStepId
  label: string
  title: string
  description: string
}

export interface ModuleRules {
  id: string
  name: string
  tagline: string
  description: string
  attributeRules: AttributeRules
  skillRules: SkillRules
  attributes: readonly AttributeDefinition[]
  skills: readonly SkillDefinition[]
  archetypes: readonly ArchetypeDefinition[]
  derivedStats: readonly DerivedStatDefinition[]
  generalSkillRules: GeneralSkillRules
  generalSkills: readonly GeneralSkill[]
  generalSkillCategories: readonly GeneralSkillCategoryDefinition[]
  anchorRules: AnchorRules
  /** Cicatrizes da Mente: distúrbio obrigatório quando a SAN fica abaixo do limite. */
  disturbanceRules: DisturbanceRules
  /** Profissões contemporâneas do arquétipo Civil (vazio em módulos sem elas). */
  civilProfessions: readonly CivilProfession[]
  equipmentRules: EquipmentRules
  equipmentCategories: readonly EquipmentCategoryDefinition[]
  equipmentCatalog: readonly Equipment[]
  steps: readonly WizardStepDefinition[]
}

export interface CharacterDraft {
  moduleId: string
  name: string
  archetypeId: ArchetypeId | null
  /**
   * Atributo principal escolhido quando a profissão é flexível (Entregador).
   * Profissões com atributo principal fixo ignoram este campo.
   */
  professionAttributeChoice: AttributeKey | null
  /** Profissão contemporânea escolhida na etapa de Identidade (Civis). */
  professionId: CivilProfessionId | null
  /** Perícia bonificada quando a profissão oferece mais de uma opção. */
  professionSkillChoice: SkillId | null
  /** Motivo de presença: obrigatório para o arquétipo Civil. */
  presenceReason: string
  /** Pontos distribuídos manualmente em cada atributo. */
  attributes: Attributes
  /** Pontos investidos manualmente em cada perícia. */
  skills: SkillRanks
  /** Habilidades gerais escolhidas (0 a `generalSkillRules.maxChoices`). */
  generalSkills: GeneralSkill[]
  /**
   * Uma perícia por vaga de habilidade NÃO escolhida: cada escolha concede
   * `freeSlotBonusPerSlot` pontos diretos no valor final da perícia, fora do
   * pool e sem consumir o teto de investimento.
   */
  freeSkillBonusPicks: SkillId[]
  /** Âncoras pessoais com pontos distribuídos. */
  anchors: Anchor[]
  /**
   * Distúrbio inicial escolhido na etapa de Âncoras. Obrigatório apenas quando
   * a SAN final fica abaixo de `disturbanceRules.sanityThreshold`.
   */
  initialDisturbance: string | null
  /** Itens escolhidos no catálogo de equipamentos do módulo. */
  equipments: Equipment[]
}

export interface CharacterSheet {
  moduleId: string
  moduleName: string
  name: string
  archetype: ArchetypeDefinition | null
  /** Profissão civil escolhida (nula para outros arquétipos). */
  profession: CivilProfession | null
  /** Motivo de presença declarado pelo personagem Civil. */
  presenceReason: string
  /** Atributo principal da profissão (fixo ou escolhido no caso flexível). */
  professionAttribute: AttributeKey | null
  /** Bônus de atributo concedido pela profissão (fora do pool). */
  professionAttributeBonus: number
  /** Perícia que recebeu o bônus da profissão civil. */
  professionSkillId: SkillId | null
  /** Pontos concedidos pela profissão à perícia escolhida. */
  professionSkillBonus: number
  /** Atributos finais: pontos distribuídos + bônus de arquétipo. */
  attributes: Attributes
  /** Valores finais: base do atributo + pontos investidos + bônus. */
  skills: SkillRanks
  derived: DerivedStats
  generalSkills: GeneralSkill[]
  /** Perícias que receberam bônus de vaga livre (uma entrada por vaga). */
  freeSkillBonusPicks: SkillId[]
  anchors: Anchor[]
  /** Distúrbio inicial registrado (null quando a SAN dispensa a escolha). */
  initialDisturbance: string | null
  /** Pool efetivo de perícias (base + bônus de teto). */
  skillPool: number
  /** Total de pontos exigido pelas âncoras. */
  anchorPool: number
  equipments: Equipment[]
  carry: CarryCapacity
  spentAttributePoints: number
  spentSkillPoints: number
}
