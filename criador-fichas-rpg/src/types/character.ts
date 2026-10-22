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

export type ModuleASkillId =
  | 'analise-de-cena'
  | 'interrogatorio'
  | 'conducao'
  | 'manuseio-de-evidencias'
  | 'protocolo-de-campo'

export type SkillId = BaseSkillId | ModuleASkillId

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

/**
 * Pré-requisitos avaliados com os atributos finais e o valor final das
 * perícias (base do atributo + investimento + bônus de arquétipo).
 */
export interface GeneralSkillRequirement {
  attributes?: Partial<Record<AttributeKey, number>>
  skills?: Partial<Record<SkillId, number>>
}

export interface GeneralSkill {
  id: GeneralSkillId
  label: string
  category: GeneralSkillCategory
  /** Recurso gasto pela habilidade: ST para físicas, EM para mentais. */
  resource: ResourceKey
  /** Custo no recurso indicado. */
  cost: number
  description: string
  effect: string
  requirement?: GeneralSkillRequirement
}

export interface GeneralSkillRules {
  /** Máximo de habilidades gerais escolhidas. */
  maxChoices: number
  /** Bônus de pool de perícias por habilidade NÃO escolhida. */
  poolBonusPerUnchosen: number
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
  | 'general-skills'
  | 'skills'
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
}

/** Ocupação atual de carga do personagem. */
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

/** Limite de investimento reduzido para certas perícias e arquétipos. */
export interface SkillCapRule {
  skillIds: readonly SkillId[]
  archetypeIds: readonly ArchetypeId[]
  /** Fração do teto de investimento permitida (ex.: 0.4 = 40%). */
  maxRatio: number
}

export interface SkillRules {
  /** Pool de pontos que deve ser investido por completo. */
  pool: number
  /** Teto de pontos aplicados manualmente em uma única perícia. */
  maxRank: number
  /** Valor base da perícia derivado do atributo correspondente. */
  baseFromAttribute: (attributeValue: number) => number
  /** Pontos extras de pool concedidos quando uma perícia atinge o teto. */
  bonusAtMax: number
  /** Limites adicionais de investimento por arquétipo. */
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
  /** Pontos distribuídos manualmente em cada atributo. */
  attributes: Attributes
  /** Pontos investidos manualmente em cada perícia. */
  skills: SkillRanks
  /** Habilidades gerais escolhidas (0 a `generalSkillRules.maxChoices`). */
  generalSkills: GeneralSkill[]
  /** Âncoras pessoais com pontos distribuídos. */
  anchors: Anchor[]
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
  anchors: Anchor[]
  /** Pool efetivo de perícias (base + habilidades gerais + bônus de teto). */
  skillPool: number
  /** Total de pontos exigido pelas âncoras. */
  anchorPool: number
  equipments: Equipment[]
  carry: CarryCapacity
  spentAttributePoints: number
  spentSkillPoints: number
}
