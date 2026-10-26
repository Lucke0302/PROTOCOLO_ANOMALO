import type {
  Anchor,
  ArchetypeDefinition,
  ArchetypeId,
  AttributeDefinition,
  AttributeKey,
  Attributes,
  CarryCapacity,
  CharacterDraft,
  CharacterSheet,
  CivilProfession,
  CivilProfessionId,
  DerivedStats,
  Equipment,
  EquipmentRules,
  GeneralSkill,
  GeneralSkillRequirementEntry,
  GeneralSkillRequirementStatus,
  ModuleRules,
  SkillDefinition,
  SkillId,
  SkillRanks,
  WizardStepDefinition,
  WizardStepId,
} from '../types/character'

/**
 * Limites de carga padrão. Módulos podem declarar os seus em `equipmentRules`;
 * este fallback garante que `calculateMaxSlots` funcione isoladamente.
 */
export const DEFAULT_EQUIPMENT_RULES: EquipmentRules = {
  slotsPerAttributeStep: 10,
  baseSlots: 2,
  backpackBonus: 3,
  weaponPermitArchetypeIds: [],
  weaponPermitProfessionIds: [],
}

/** Cria atributos no valor base definido pelo módulo. */
export function createEmptyAttributes(rules: ModuleRules): Attributes {
  const base = rules.attributeRules.base
  return {
    fisico: base,
    destreza: base,
    intelecto: base,
    psique: base,
  }
}

/** Cria o mapa completo de perícias com 0 pontos investidos. */
export function createEmptySkills(rules: ModuleRules): SkillRanks {
  const ranks = {} as SkillRanks
  for (const skill of rules.skills) {
    ranks[skill.id] = 0
  }
  return ranks
}

/** Cria a lista fixa de âncoras no mínimo de pontos permitido. */
export function createInitialAnchors(rules: ModuleRules): Anchor[] {
  return Array.from({ length: rules.anchorRules.count }, (_, index) => ({
    id: `anchor-${index + 1}`,
    name: '',
    description: '',
    points: rules.anchorRules.minPerAnchor,
  }))
}

export function createInitialDraft(rules: ModuleRules): CharacterDraft {
  return {
    moduleId: rules.id,
    name: '',
    archetypeId: null,
    professionAttributeChoice: null,
    professionId: null,
    professionSkillChoice: null,
    presenceReason: '',
    attributes: createEmptyAttributes(rules),
    skills: createEmptySkills(rules),
    generalSkills: [],
    freeSkillBonusPicks: [],
    anchors: createInitialAnchors(rules),
    initialDisturbance: null,
    equipments: [],
  }
}

export function getArchetype(
  rules: ModuleRules,
  archetypeId: ArchetypeId | null,
): ArchetypeDefinition | null {
  if (!archetypeId) return null
  return rules.archetypes.find((archetype) => archetype.id === archetypeId) ?? null
}

export function isArchetypeId(
  value: string,
  rules: ModuleRules,
): value is ArchetypeId {
  return rules.archetypes.some((archetype) => archetype.id === value)
}

export function isAttributeKey(
  value: string,
  rules: ModuleRules,
): value is AttributeKey {
  return rules.attributes.some((attribute) => attribute.key === value)
}

// ---------------------------------------------------------------------------
// Profissões contemporâneas (arquétipo Civil)
// ---------------------------------------------------------------------------

/** Profissão do catálogo pelo id, ou null quando não existir. */
export function getCivilProfession(
  rules: ModuleRules,
  professionId: CivilProfessionId | null,
): CivilProfession | null {
  if (!professionId) return null
  return (
    rules.civilProfessions.find(
      (profession) => profession.id === professionId,
    ) ?? null
  )
}

export function isCivilProfessionId(
  value: string,
  rules: ModuleRules,
): value is CivilProfessionId {
  return rules.civilProfessions.some((profession) => profession.id === value)
}

/**
 * Profissão efetiva do rascunho. Somente o arquétipo Civil possui profissões
 * contemporâneas, portanto qualquer outro arquétipo resulta em null.
 */
export function getDraftProfession(
  draft: CharacterDraft,
  rules: ModuleRules,
): CivilProfession | null {
  const archetype = getArchetype(rules, draft.archetypeId)
  if (!archetype || archetype.id !== 'civil') return null

  return getCivilProfession(rules, draft.professionId)
}

/** Atributo principal efetivo da profissão (fixo ou escolhido no caso flexível). */
export function getProfessionPrimaryAttribute(
  profession: CivilProfession | null,
  choice: AttributeKey | null,
): AttributeKey | null {
  if (!profession) return null
  if (profession.primaryAttribute) return profession.primaryAttribute
  if (!choice || !profession.attributeOptions?.includes(choice)) return null

  return choice
}

/** Pré-requisito da profissão expresso em valor final e investimento mínimo. */
export interface ProfessionAttributeRequirement {
  /** Atributo principal cobrado pela profissão. */
  attribute: AttributeKey
  /** Valor final exigido (distribuição + bônus de arquétipo). */
  required: number
  /** Bônus fixo somado ao atributo principal, fora do pool. */
  bonus: number
  /** Investimento mínimo no valor base para atingir o pré-requisito. */
  minBase: number
}

/**
 * Pré-requisito do atributo principal. Retorna `null` quando a profissão é
 * flexível e o jogador ainda não escolheu entre as opções disponíveis.
 */
export function getProfessionAttributeRequirement(
  profession: CivilProfession | null,
  choice: AttributeKey | null,
): ProfessionAttributeRequirement | null {
  const attribute = getProfessionPrimaryAttribute(profession, choice)
  if (!profession || !attribute) return null

  return {
    attribute,
    required: profession.reqValue,
    bonus: profession.attributeBonus,
    minBase: Math.max(0, profession.reqValue - profession.attributeBonus),
  }
}

/** Status do pré-requisito avaliado sobre os atributos finais. */
export function getProfessionRequirementStatus(
  profession: CivilProfession | null,
  choice: AttributeKey | null,
  attributeDefinitions: readonly AttributeDefinition[],
  attributes: Attributes,
): GeneralSkillRequirementStatus | null {
  const requirement = getProfessionAttributeRequirement(profession, choice)
  if (!requirement) return null

  const definition = attributeDefinitions.find(
    (attribute) => attribute.key === requirement.attribute,
  )
  const current = attributes[requirement.attribute]

  return {
    label: definition?.abbreviation ?? requirement.attribute,
    current,
    required: requirement.required,
    met: current >= requirement.required,
  }
}

/** Pré-requisito atendido sobre os atributos finais (distribuição + bônus). */
export function meetsProfessionRequirement(
  profession: CivilProfession | null,
  choice: AttributeKey | null,
  attributes: Attributes,
): boolean {
  const requirement = getProfessionAttributeRequirement(profession, choice)
  if (!requirement) return true

  return attributes[requirement.attribute] >= requirement.required
}

/** Perícia efetivamente bonificada pela profissão. */
export function getProfessionSkillId(
  profession: CivilProfession | null,
  choice: SkillId | null,
): SkillId | null {
  if (!profession || profession.bonusSkillIds.length === 0) return null
  if (profession.bonusSkillIds.length === 1) return profession.bonusSkillIds[0]

  return choice && profession.bonusSkillIds.includes(choice) ? choice : null
}

/**
 * Escolhas da profissão concluídas na etapa de Identidade: profissão válida,
 * perícia bonificada definida (quando há mais de uma) e atributo principal
 * escolhido (apenas no caso flexível do Entregador).
 */
export function isProfessionSelectionComplete(
  draft: CharacterDraft,
  rules: ModuleRules,
): boolean {
  const archetype = getArchetype(rules, draft.archetypeId)
  if (!archetype || archetype.id !== 'civil') return true
  if (rules.civilProfessions.length === 0) return true

  const profession = getCivilProfession(rules, draft.professionId)
  if (!profession) return false
  if (getProfessionSkillId(profession, draft.professionSkillChoice) === null) {
    return false
  }

  return (
    getProfessionPrimaryAttribute(
      profession,
      draft.professionAttributeChoice,
    ) !== null
  )
}

/**
 * Pré-requisito da profissão validado na etapa de Atributos, sobre o valor
 * final do atributo principal.
 */
export function isProfessionRequirementMet(
  draft: CharacterDraft,
  rules: ModuleRules,
): boolean {
  const archetype = getArchetype(rules, draft.archetypeId)
  if (!archetype || archetype.id !== 'civil') return true
  if (rules.civilProfessions.length === 0) return true

  const profession = getCivilProfession(rules, draft.professionId)
  if (!profession) return false

  return meetsProfessionRequirement(
    profession,
    draft.professionAttributeChoice,
    getFinalAttributes(draft, rules),
  )
}

/** Itens concedidos pela profissão, resolvidos a partir do catálogo. */
export function getProfessionEquipment(
  draft: CharacterDraft,
  rules: ModuleRules,
): Equipment[] {
  const profession = getDraftProfession(draft, rules)
  if (!profession) return []

  const items: Equipment[] = []
  for (const itemId of profession.initialEquipmentIds) {
    const item = rules.equipmentCatalog.find(
      (catalogItem) => catalogItem.id === itemId,
    )
    if (item) items.push(item)
  }

  return items
}

/** Item imutável concedido pela profissão (não pode ser removido). */
export function isProfessionEquipment(
  itemId: string,
  draft: CharacterDraft,
  rules: ModuleRules,
): boolean {
  return getProfessionEquipment(draft, rules).some((item) => item.id === itemId)
}

/**
 * Inventário efetivo: itens da profissão (imutáveis) + itens escolhidos,
 * sem duplicar ids. O custo em slots considera a lista completa.
 */
export function getEffectiveEquipments(
  draft: CharacterDraft,
  rules: ModuleRules,
): Equipment[] {
  const professionItems = getProfessionEquipment(draft, rules)
  const grantedIds = new Set(professionItems.map((item) => item.id))

  return [
    ...professionItems,
    ...draft.equipments.filter((item) => !grantedIds.has(item.id)),
  ]
}

// ---------------------------------------------------------------------------
// Restrições de equipamento na criação (Nível 1)
// ---------------------------------------------------------------------------

/** Mínimo de caracteres do Motivo de Presença exigido do arquétipo Civil. */
export const PRESENCE_REASON_MIN_LENGTH = 10

/** Restrição de criação aplicada a um item do catálogo. */
export interface EquipmentRestriction {
  allowed: boolean
  /** Rótulo curto exibido no card do item (ex.: "Nível 1", "Profissão"). */
  tag: string | null
  /** Motivo completo do bloqueio, pronto para a UI. */
  reason: string | null
}

const EQUIPMENT_ALLOWED: EquipmentRestriction = {
  allowed: true,
  tag: null,
  reason: null,
}

function getProfessionLabels(
  professionIds: readonly CivilProfessionId[],
  rules: ModuleRules,
): string {
  return rules.civilProfessions
    .filter((profession) => professionIds.includes(profession.id))
    .map((profession) => profession.label)
    .join(' / ')
}

/**
 * Porte de arma na criação de ficha: apenas Detetive, Policial ou o Civil com
 * a profissão Segurança Privada. Os demais não têm credencial.
 */
export function hasWeaponPermit(
  draft: CharacterDraft,
  rules: ModuleRules,
): boolean {
  const archetype = getArchetype(rules, draft.archetypeId)
  if (
    archetype &&
    rules.equipmentRules.weaponPermitArchetypeIds.includes(archetype.id)
  ) {
    return true
  }

  const profession = getDraftProfession(draft, rules)
  return (
    profession !== null &&
    rules.equipmentRules.weaponPermitProfessionIds.includes(profession.id)
  )
}

/**
 * Restrições que independem de slots: armas longas/pesadas proibidas no Nível 1,
 * itens de ofício exclusivos da profissão concedente e itens que exigem
 * credencial de porte (armas curtas e munição solta).
 */
export function getEquipmentRestriction(
  item: Equipment,
  draft: CharacterDraft,
  rules: ModuleRules,
): EquipmentRestriction {
  if (item.creationBlocked) {
    return {
      allowed: false,
      tag: 'Nível 1',
      reason: `${item.label} é arma longa/pesada e não pode ser carregada na criação de ficha.`,
    }
  }

  if (item.isExclusiveToProfession) {
    const profession = getDraftProfession(draft, rules)
    const grantIds = item.grantedByProfessionIds ?? []
    const grantedHere =
      profession !== null && grantIds.includes(profession.id)

    if (!grantedHere) {
      const labels = getProfessionLabels(grantIds, rules)
      return {
        allowed: false,
        tag: 'Profissão',
        reason: labels
          ? `Item de ofício exclusivo de ${labels}: entra automaticamente pelo inventário da profissão.`
          : 'Item de ofício indisponível para escolha manual.',
      }
    }
  }

  if (item.requiresWeaponPermit && !hasWeaponPermit(draft, rules)) {
    return {
      allowed: false,
      tag: 'Porte',
      reason:
        'Exige credencial de porte: apenas Detetive, Policial ou Segurança Privada podem carregar este item na criação.',
    }
  }

  return EQUIPMENT_ALLOWED
}

/** Itens do rascunho que violam as restrições de criação (mensagens prontas). */
export function getEquipmentLoadoutIssues(
  draft: CharacterDraft,
  rules: ModuleRules,
): string[] {
  const issues: string[] = []

  for (const item of draft.equipments) {
    const restriction = getEquipmentRestriction(item, draft, rules)
    if (!restriction.allowed && restriction.reason) {
      issues.push(restriction.reason)
    }
  }

  return issues
}

/**
 * Remove itens que deixaram de ser permitidos (ex.: troca de arquétipo ou de
 * profissão). Profissões são derivadas do rascunho, nunca do inventário.
 */
export function getSanitizedEquipments(
  draft: CharacterDraft,
  rules: ModuleRules,
): Equipment[] {
  return draft.equipments.filter(
    (item) => getEquipmentRestriction(item, draft, rules).allowed,
  )
}

/** Adição completa: restrição de criação + duplicidade + limite de slots. */
export function canDraftEquipItem(
  item: Equipment,
  draft: CharacterDraft,
  rules: ModuleRules,
): boolean {
  if (!getEquipmentRestriction(item, draft, rules).allowed) return false

  return canEquipItem(
    item,
    getFinalAttributes(draft, rules),
    getEffectiveEquipments(draft, rules),
    rules.equipmentRules,
  )
}

/** Motivo de presença obrigatório e preenchido (exigido do arquétipo Civil). */
export function hasPresenceReason(
  draft: CharacterDraft,
  rules: ModuleRules,
): boolean {
  const archetype = getArchetype(rules, draft.archetypeId)
  if (!archetype || archetype.id !== 'civil') return true

  return (
    draft.presenceReason.trim().length >= PRESENCE_REASON_MIN_LENGTH
  )
}

/** Bônus fixo de arquétipo em um atributo. */
export function getArchetypeAttributeBonus(
  archetype: ArchetypeDefinition | null,
  key: AttributeKey,
): number {
  if (!archetype) return 0

  return archetype.attributeBonuses[key] ?? 0
}

/**
 * Bônus da profissão no atributo principal. É fixo por profissão (o jogador
 * nunca escolhe livremente onde aplicá-lo, apenas entre as opções declaradas
 * pela própria profissão, como no caso do Entregador).
 */
export function getProfessionAttributeBonus(
  profession: CivilProfession | null,
  choice: AttributeKey | null,
  key: AttributeKey,
): number {
  if (!profession) return 0
  if (getProfessionPrimaryAttribute(profession, choice) !== key) return 0

  return profession.attributeBonus
}

/** Bônus total aplicado após a distribuição (arquétipo + profissão). */
export function getTotalAttributeBonus(
  archetype: ArchetypeDefinition | null,
  profession: CivilProfession | null,
  choice: AttributeKey | null,
  key: AttributeKey,
): number {
  return (
    getArchetypeAttributeBonus(archetype, key) +
    getProfessionAttributeBonus(profession, choice, key)
  )
}

/**
 * Teto de distribuição manual de cada atributo. Quando o teto do módulo já
 * inclui bônus, o limite é reduzido na mesma medida.
 */
export function getAttributeCaps(
  rules: ModuleRules,
  archetype: ArchetypeDefinition | null,
  profession: CivilProfession | null = null,
  professionAttributeChoice: AttributeKey | null = null,
): Record<AttributeKey, number> {
  const caps = {} as Record<AttributeKey, number>

  for (const definition of rules.attributes) {
    const bonus = rules.attributeRules.capIncludesBonuses
      ? getTotalAttributeBonus(
          archetype,
          profession,
          professionAttributeChoice,
          definition.key,
        )
      : 0

    caps[definition.key] = Math.max(
      rules.attributeRules.min,
      rules.attributeRules.max - bonus,
    )
  }

  return caps
}

/** Valor base de uma perícia, derivado do atributo final do personagem. */
export function getSkillBaseValue(
  rules: ModuleRules,
  definition: SkillDefinition,
  attributes: Attributes,
): number {
  return rules.skillRules.baseFromAttribute(attributes[definition.attribute])
}

/** Mapa com o valor base de todas as perícias. */
export function getSkillBaseValues(
  rules: ModuleRules,
  attributes: Attributes,
): SkillRanks {
  const values = {} as SkillRanks
  for (const definition of rules.skills) {
    values[definition.id] = getSkillBaseValue(rules, definition, attributes)
  }
  return values
}

/**
 * Teto absoluto do valor final (base + investimento) de uma perícia: o menor
 * entre `maxRank` e qualquer `maxLimit` aplicável ao arquétipo.
 */
function getEffectiveSkillCap(
  rules: ModuleRules,
  skillId: SkillId,
  archetype: ArchetypeDefinition | null,
): number {
  const { maxRank, caps } = rules.skillRules
  let cap = maxRank

  for (const rule of caps) {
    if (!rule.skillIds.includes(skillId)) continue
    if (rule.archetypeIds.length > 0) {
      if (!archetype || !rule.archetypeIds.includes(archetype.id)) continue
    }
    cap = Math.min(cap, rule.maxLimit)
  }

  return cap
}

/**
 * Teto de pontos que podem ser INVESTIDOS em uma perícia: o teto absoluto do
 * valor final menos o valor base derivado do atributo correspondente.
 */
export function getSkillCap(
  rules: ModuleRules,
  skillId: SkillId,
  archetype: ArchetypeDefinition | null,
  attributes: Attributes,
): number {
  const definition = rules.skills.find((skill) => skill.id === skillId)
  const base = definition ? getSkillBaseValue(rules, definition, attributes) : 0

  return Math.max(0, getEffectiveSkillCap(rules, skillId, archetype) - base)
}

/** Mapa com o teto de investimento de todas as perícias. */
export function getSkillCaps(
  rules: ModuleRules,
  archetype: ArchetypeDefinition | null,
  attributes: Attributes,
): SkillRanks {
  const caps = {} as SkillRanks
  for (const definition of rules.skills) {
    caps[definition.id] = getSkillCap(
      rules,
      definition.id,
      archetype,
      attributes,
    )
  }
  return caps
}

// ---------------------------------------------------------------------------
// Habilidades gerais & âncoras pessoais
// ---------------------------------------------------------------------------

/** Atributos finais: distribuição manual + bônus de arquétipo e profissão. */
export function getFinalAttributes(
  draft: CharacterDraft,
  rules: ModuleRules,
): Attributes {
  return applyAttributeBonuses(
    rules,
    draft.attributes,
    getArchetype(rules, draft.archetypeId),
    getDraftProfession(draft, rules),
    draft.professionAttributeChoice,
  )
}

/** Valor final das perícias do rascunho (base + investimento + bônus). */
export function getFinalSkillValues(
  draft: CharacterDraft,
  rules: ModuleRules,
): SkillRanks {
  return calculateFinalSkills(
    rules,
    draft.skills,
    getFinalAttributes(draft, rules),
    getArchetype(rules, draft.archetypeId),
    getDraftProfession(draft, rules),
    draft.professionSkillChoice,
    getFreeSkillBonuses(draft.freeSkillBonusPicks, rules),
  )
}

/**
 * Vagas de habilidade geral não preenchidas: cada uma vira um bônus direto de
 * `freeSlotBonusPerSlot` pontos em uma perícia escolhida na etapa de Bônus.
 */
export function getFreeSkillBonusSlots(
  chosenCount: number,
  rules: ModuleRules,
): number {
  return Math.max(0, rules.generalSkillRules.maxChoices - chosenCount)
}

/** Total de pontos de bônus disponíveis pelas vagas livres. */
export function getFreeSkillBonusTotal(
  chosenCount: number,
  rules: ModuleRules,
): number {
  return getFreeSkillBonusSlots(chosenCount, rules) *
    rules.generalSkillRules.freeSlotBonusPerSlot
}

/**
 * Etapas visíveis do wizard. A etapa de bônus de vagas livres é universal aos
 * arquétipos e só entra na navegação quando existe pelo menos uma habilidade
 * geral não escolhida (10 ou 20 pontos a distribuir). Com as duas habilidades
 * preenchidas, o fluxo salta de Habilidades Gerais direto para Âncoras.
 */
export function getWizardSteps(
  draft: CharacterDraft,
  rules: ModuleRules,
): readonly WizardStepDefinition[] {
  const hasFreeSkillBonus =
    getFreeSkillBonusSlots(draft.generalSkills.length, rules) > 0

  return rules.steps.filter(
    (step) => step.id !== 'free-skill-bonus' || hasFreeSkillBonus,
  )
}

/** Bônus somado por perícia a partir das escolhas da etapa de Bônus. */
export function getFreeSkillBonuses(
  picks: readonly SkillId[],
  rules: ModuleRules,
): SkillRanks {
  const bonuses = {} as SkillRanks
  for (const definition of rules.skills) {
    bonuses[definition.id] = 0
  }

  const perSlot = rules.generalSkillRules.freeSlotBonusPerSlot
  for (const skillId of picks) {
    if (skillId in bonuses) bonuses[skillId] += perSlot
  }

  return bonuses
}

/**
 * Saldo de cada perícia até o teto vigente (investimento + bônus de vagas).
 * A vaga informada em `ignoredSlot` é desconsiderada para permitir trocar a
 * perícia já escolhida sem contar o próprio bônus duas vezes.
 */
export function getFreeSkillBonusRemaining(
  draft: CharacterDraft,
  rules: ModuleRules,
  ignoredSlot: number | null = null,
): SkillRanks {
  const attributes = getFinalAttributes(draft, rules)
  const caps = getSkillCaps(
    rules,
    getArchetype(rules, draft.archetypeId),
    attributes,
  )
  const perSlot = rules.generalSkillRules.freeSlotBonusPerSlot
  const remaining = {} as SkillRanks

  for (const definition of rules.skills) {
    remaining[definition.id] =
      caps[definition.id] - (draft.skills[definition.id] ?? 0)
  }

  draft.freeSkillBonusPicks.forEach((skillId, index) => {
    if (index === ignoredSlot) return
    if (skillId in remaining) remaining[skillId] -= perSlot
  })

  return remaining
}

/**
 * Uma vaga pode receber a perícia sem ultrapassar o teto final vigente: 60
 * pontos (base + investimento + bônus) na criação e 40 nas perícias de combate
 * do arquétipo Civil.
 */
export function canAssignFreeSkillBonus(
  draft: CharacterDraft,
  rules: ModuleRules,
  slotIndex: number,
  skillId: SkillId,
): boolean {
  if (!rules.skills.some((definition) => definition.id === skillId)) return false

  const remaining = getFreeSkillBonusRemaining(draft, rules, slotIndex)
  return remaining[skillId] >= rules.generalSkillRules.freeSlotBonusPerSlot
}

/**
 * Problemas da alocação de bônus: todas as vagas precisam estar preenchidas e
 * a soma investimento + bônus não pode ultrapassar o teto de cada perícia.
 */
export function getFreeSkillBonusIssues(
  draft: CharacterDraft,
  rules: ModuleRules,
): string[] {
  const slots = getFreeSkillBonusSlots(draft.generalSkills.length, rules)
  const perSlot = rules.generalSkillRules.freeSlotBonusPerSlot
  const picks = draft.freeSkillBonusPicks
  const issues: string[] = []

  if (picks.length < slots) {
    issues.push(
      `Distribua exatamente ${slots * perSlot} pontos de bônus: ainda faltam ${(slots - picks.length) * perSlot}.`,
    )
  } else if (picks.length > slots) {
    issues.push(
      `Há ${picks.length} perícias bonificadas para apenas ${slots} vaga(s) livre(s).`,
    )
  }

  const attributes = getFinalAttributes(draft, rules)
  const caps = getSkillCaps(
    rules,
    getArchetype(rules, draft.archetypeId),
    attributes,
  )
  const allocated = {} as SkillRanks
  for (const definition of rules.skills) allocated[definition.id] = 0

  for (const skillId of picks) {
    const definition = rules.skills.find((item) => item.id === skillId)

    if (!definition) {
      issues.push(`Perícia desconhecida na alocação de bônus: ${skillId}.`)
      continue
    }

    const projected =
      (Number(draft.skills[skillId]) || 0) + allocated[skillId] + perSlot

    if (projected > caps[skillId]) {
      const base = getSkillBaseValue(rules, definition, attributes)
      issues.push(
        `${definition.label} ultrapassa o teto final de ${caps[skillId] + base} pontos (base ${base} + investimento + bônus).`,
      )
    }

    allocated[skillId] += perSlot
  }

  return issues
}

/** Situação de uma exigência individual (atributo ou perícia) da habilidade. */
function getGeneralSkillRequirementEntryStatus(
  entry: GeneralSkillRequirementEntry,
  rules: ModuleRules,
  attributes: Attributes,
  skills: SkillRanks,
  alternative: boolean,
): GeneralSkillRequirementStatus {
  if ('attribute' in entry) {
    const definition = rules.attributes.find((item) => item.key === entry.attribute)
    const current = attributes[entry.attribute] ?? 0

    return {
      label: entry.label ?? definition?.label ?? entry.attribute,
      current,
      required: entry.min,
      met: current >= entry.min,
      alternative,
    }
  }

  const definition = rules.skills.find((item) => item.id === entry.skill)
  const current = skills[entry.skill] ?? 0

  return {
    label: entry.label ?? definition?.label ?? entry.skill,
    current,
    required: entry.min,
    met: current >= entry.min,
    alternative,
  }
}

/** Pré-requisitos de uma habilidade com valor atual e valor exigido. */
export function getGeneralSkillRequirements(
  skill: GeneralSkill,
  rules: ModuleRules,
  attributes: Attributes,
  skills: SkillRanks,
): GeneralSkillRequirementStatus[] {
  const requirement = skill.requirement
  if (!requirement) return []

  const statuses = (requirement.all ?? []).map((entry) =>
    getGeneralSkillRequirementEntryStatus(entry, rules, attributes, skills, false),
  )

  for (const group of requirement.anyOf ?? []) {
    for (const entry of group) {
      statuses.push(
        getGeneralSkillRequirementEntryStatus(entry, rules, attributes, skills, true),
      )
    }
  }

  return statuses
}

export function meetsGeneralSkillRequirements(
  skill: GeneralSkill,
  rules: ModuleRules,
  attributes: Attributes,
  skills: SkillRanks,
): boolean {
  const requirement = skill.requirement
  if (!requirement) return true

  const allMet = (requirement.all ?? []).every(
    (entry) =>
      getGeneralSkillRequirementEntryStatus(entry, rules, attributes, skills, false)
        .met,
  )

  const groups = requirement.anyOf ?? []
  const anyGroupMet =
    groups.length === 0 ||
    groups.some((group) =>
      group.every(
        (entry) =>
          getGeneralSkillRequirementEntryStatus(entry, rules, attributes, skills, true)
            .met,
      ),
    )

  return allMet && anyGroupMet
}

/**
 * Habilidade disponível: ainda não escolhida, com vaga e pré-requisitos.
 * A etapa de habilidades roda depois das perícias, portanto atributos e
 * perícias finais já estão definidos.
 */
export function canChooseGeneralSkill(
  skill: GeneralSkill,
  draft: CharacterDraft,
  rules: ModuleRules,
): boolean {
  if (draft.generalSkills.some((chosen) => chosen.id === skill.id)) return false
  if (draft.generalSkills.length >= rules.generalSkillRules.maxChoices) {
    return false
  }

  return meetsGeneralSkillRequirements(
    skill,
    rules,
    getFinalAttributes(draft, rules),
    getFinalSkillValues(draft, rules),
  )
}

/** Etapa válida: no máximo 2 escolhas, sem repetição e com pré-requisitos. */
export function isGeneralSkillsComplete(
  draft: CharacterDraft,
  rules: ModuleRules,
): boolean {
  const chosen = draft.generalSkills
  if (chosen.length > rules.generalSkillRules.maxChoices) return false

  const uniqueIds = new Set(chosen.map((skill) => skill.id))
  if (uniqueIds.size !== chosen.length) return false

  const attributes = getFinalAttributes(draft, rules)
  const skills = getFinalSkillValues(draft, rules)

  return chosen.every((skill) =>
    meetsGeneralSkillRequirements(skill, rules, attributes, skills),
  )
}

/** Total obrigatório de pontos das âncoras: PSIQUE final + 20. */
export function getAnchorPool(
  attributes: Attributes,
  rules: ModuleRules,
): number {
  return attributes[rules.anchorRules.attribute] + rules.anchorRules.basePoints
}

export function getAnchorPointsTotal(anchors: readonly Anchor[]): number {
  return anchors.reduce((total, anchor) => total + anchor.points, 0)
}

// ---------------------------------------------------------------------------
// Cicatrizes da Mente (distúrbio inicial)
// ---------------------------------------------------------------------------

/** Estabilidade Mental final do rascunho (derivado `sanidade`). */
export function getFinalSanity(
  draft: CharacterDraft,
  rules: ModuleRules,
): number {
  return calculateDerivedStats(getFinalAttributes(draft, rules), rules).sanidade
}

/** Abaixo do limite do módulo o distúrbio inicial passa a ser obrigatório. */
export function requiresInitialDisturbance(
  draft: CharacterDraft,
  rules: ModuleRules,
): boolean {
  return getFinalSanity(draft, rules) < rules.disturbanceRules.sanityThreshold
}

/** O valor informado existe no catálogo de distúrbios do módulo. */
export function isValidInitialDisturbance(
  value: string | null,
  rules: ModuleRules,
): boolean {
  if (!value) return false
  return rules.disturbanceRules.options.some((option) => option.id === value)
}

/**
 * Distúrbio efetivo da ficha: descartado quando a SAN alcança o limite do
 * módulo ou quando o valor guardado não pertence ao catálogo.
 */
export function getInitialDisturbance(
  draft: CharacterDraft,
  rules: ModuleRules,
): string | null {
  if (!requiresInitialDisturbance(draft, rules)) return null
  return isValidInitialDisturbance(draft.initialDisturbance, rules)
    ? draft.initialDisturbance
    : null
}

/** Rótulo do distúrbio para a revisão/impressão da ficha. */
export function getInitialDisturbanceLabel(
  rules: ModuleRules,
  disturbanceId: string | null,
): string | null {
  if (!disturbanceId) return null
  return (
    rules.disturbanceRules.options.find(
      (option) => option.id === disturbanceId,
    )?.label ?? null
  )
}

/**
 * Etapa válida: exatamente 3 âncoras, nenhuma abaixo do mínimo e somatório
 * estritamente igual a PSIQUE + 20. Com a SAN abaixo do limite do módulo, um
 * distúrbio inicial também precisa estar selecionado.
 */
export function isAnchorsComplete(
  draft: CharacterDraft,
  rules: ModuleRules,
): boolean {
  const { count, minPerAnchor } = rules.anchorRules

  if (draft.anchors.length !== count) return false
  if (
    requiresInitialDisturbance(draft, rules) &&
    !isValidInitialDisturbance(draft.initialDisturbance, rules)
  ) {
    return false
  }
  if (
    draft.anchors.some(
      (anchor) => !Number.isInteger(anchor.points) || anchor.points < minPerAnchor,
    )
  ) {
    return false
  }

  return (
    getAnchorPointsTotal(draft.anchors) ===
    getAnchorPool(getFinalAttributes(draft, rules), rules)
  )
}

// ---------------------------------------------------------------------------
// Equipamentos & slots de carga
// ---------------------------------------------------------------------------

/**
 * Capacidade máxima de slots de carga.
 * Fórmula base: floor(FÍSICO / 10) + 2, com +3 quando há mochila.
 */
export function calculateMaxSlots(
  fisico: number,
  hasBackpack: boolean,
  rules: EquipmentRules = DEFAULT_EQUIPMENT_RULES,
): number {
  const fromAttribute = Math.floor(
    Math.max(0, fisico) / rules.slotsPerAttributeStep,
  )

  return (
    fromAttribute + rules.baseSlots + (hasBackpack ? rules.backpackBonus : 0)
  )
}

/** Slots concedidos por itens que ampliam o limite (ex.: mochila). */
export function getEquipmentSlotBonus(
  equipments: readonly Equipment[],
): number {
  return equipments.reduce((total, item) => total + (item.slotBonus ?? 0), 0)
}

/** Verifica se algum item equipado modifica o limite de slots. */
export function hasBackpackModifier(
  equipments: readonly Equipment[],
): boolean {
  return equipments.some((item) => (item.slotBonus ?? 0) > 0)
}

/** Total de slots consumidos pelo inventário atual. */
export function getUsedEquipmentSlots(
  equipments: readonly Equipment[],
): number {
  return equipments.reduce((total, item) => total + item.slotCost, 0)
}

/** Ocupação de carga considerando atributos finais e modificadores. */
export function getCarryCapacity(
  attributes: Attributes,
  equipments: readonly Equipment[],
  rules: EquipmentRules = DEFAULT_EQUIPMENT_RULES,
): CarryCapacity {
  const baseSlots = calculateMaxSlots(attributes.fisico, false, rules)
  const bonusSlots = getEquipmentSlotBonus(equipments)

  return {
    usedSlots: getUsedEquipmentSlots(equipments),
    baseSlots,
    bonusSlots,
    maxSlots: baseSlots + bonusSlots,
  }
}

/**
 * Um item pode ser adicionado quando ainda não está no inventário e o custo
 * cabe no limite — considerando o bônus do próprio item (mochila).
 */
export function canEquipItem(
  item: Equipment,
  attributes: Attributes,
  equipments: readonly Equipment[],
  rules: EquipmentRules = DEFAULT_EQUIPMENT_RULES,
): boolean {
  if (equipments.some((equipped) => equipped.id === item.id)) return false

  const baseSlots = calculateMaxSlots(attributes.fisico, false, rules)
  const maxSlots =
    baseSlots + getEquipmentSlotBonus([...equipments, item])
  const usedSlots = getUsedEquipmentSlots(equipments) + item.slotCost

  return usedSlots <= maxSlots
}

export function getAttributeTotal(attributes: Attributes): number {
  return (
    attributes.fisico +
    attributes.destreza +
    attributes.intelecto +
    attributes.psique
  )
}
export function getSpentAttributePoints(
  attributes: Attributes,
  rules: ModuleRules,
): number {
  return (
    getAttributeTotal(attributes) - rules.attributeRules.base * rules.attributes.length
  )
}

export function getRemainingAttributePoints(
  attributes: Attributes,
  rules: ModuleRules,
): number {
  return rules.attributeRules.pool - getSpentAttributePoints(attributes, rules)
}

export function getSpentSkillPoints(skills: SkillRanks): number {
  // Casting matemático obrigatório: valores vindos de inputs do HTML chegam
  // como string e concatenariam no reduce, dessincronizando o pool da UI.
  return Object.values(skills).reduce(
    (total, rank) => total + (Number(rank) || 0),
    0,
  )
}

/**
 * Bônus de pool concedido por cada perícia cujo valor de base + investimento
 * atingiu o teto absoluto (`maxRank`).
 */
export function getSkillPoolBonus(
  skills: SkillRanks,
  rules: ModuleRules,
  attributes: Attributes,
): number {
  const { maxRank, bonusAtMax } = rules.skillRules
  const reached = rules.skills.filter(
    (definition) =>
      (Number(skills[definition.id]) || 0) +
        getSkillBaseValue(rules, definition, attributes) >=
      maxRank,
  ).length

  return reached * bonusAtMax
}

/** Pool efetivo de perícias: base + bônus de teto. */
export function getTotalSkillPool(
  skills: SkillRanks,
  rules: ModuleRules,
  attributes: Attributes,
): number {
  return rules.skillRules.pool + getSkillPoolBonus(skills, rules, attributes)
}

export function getRemainingSkillPoints(
  skills: SkillRanks,
  rules: ModuleRules,
  attributes: Attributes,
): number {
  return (
    getTotalSkillPool(skills, rules, attributes) - getSpentSkillPoints(skills)
  )
}

/**
 * Aplica os bônus de arquétipo e da profissão respeitando o teto final do
 * módulo. Os bônus não consomem o pool de atributos.
 */
export function applyAttributeBonuses(
  rules: ModuleRules,
  attributes: Attributes,
  archetype: ArchetypeDefinition | null,
  profession: CivilProfession | null = null,
  professionAttributeChoice: AttributeKey | null = null,
): Attributes {
  const cap = rules.attributeRules.capIncludesBonuses
    ? rules.attributeRules.max
    : Number.POSITIVE_INFINITY

  const result: Attributes = { ...attributes }
  for (const definition of rules.attributes) {
    const bonus = getTotalAttributeBonus(
      archetype,
      profession,
      professionAttributeChoice,
      definition.key,
    )
    result[definition.key] = Math.min(
      cap,
      attributes[definition.key] + bonus,
    )
  }
  return result
}

/**
 * Valor final das perícias: base do atributo + investimento + bônus de
 * arquétipo + bônus da profissão civil (aplicado à perícia escolhida) +
 * bônus de vagas livres de habilidade.
 */
export function calculateFinalSkills(
  rules: ModuleRules,
  invested: SkillRanks,
  attributes: Attributes,
  archetype: ArchetypeDefinition | null,
  profession: CivilProfession | null = null,
  professionSkillChoice: SkillId | null = null,
  freeSkillBonuses: SkillRanks | null = null,
): SkillRanks {
  const result = {} as SkillRanks
  const professionSkillId = getProfessionSkillId(
    profession,
    professionSkillChoice,
  )

  for (const definition of rules.skills) {
    const base = getSkillBaseValue(rules, definition, attributes)
    const bonus = archetype?.skillBonuses?.[definition.id] ?? 0
    const professionBonus =
      profession && definition.id === professionSkillId
        ? profession.bonusValue
        : 0
    const freeSlotBonus = freeSkillBonuses?.[definition.id] ?? 0

    result[definition.id] =
      base +
      (Number(invested[definition.id]) || 0) +
      bonus +
      professionBonus +
      freeSlotBonus
  }

  return result
}

export function calculateDerivedStats(
  attributes: Attributes,
  rules: ModuleRules,
): DerivedStats {
  const stats = {} as DerivedStats
  for (const definition of rules.derivedStats) {
    stats[definition.key] = definition.calculate(attributes)
  }
  return stats
}

export function buildCharacterSheet(
  draft: CharacterDraft,
  rules: ModuleRules,
): CharacterSheet {
  const archetype = getArchetype(rules, draft.archetypeId)
  const profession = getDraftProfession(draft, rules)
  const finalAttributes = applyAttributeBonuses(
    rules,
    draft.attributes,
    archetype,
    profession,
    draft.professionAttributeChoice,
  )
  const professionAttribute = getProfessionPrimaryAttribute(
    profession,
    draft.professionAttributeChoice,
  )
  const professionSkillId = getProfessionSkillId(
    profession,
    draft.professionSkillChoice,
  )
  const equipments = getEffectiveEquipments(draft, rules)
  const finalSkills = calculateFinalSkills(
    rules,
    draft.skills,
    finalAttributes,
    archetype,
    profession,
    draft.professionSkillChoice,
    getFreeSkillBonuses(draft.freeSkillBonusPicks, rules),
  )

  return {
    moduleId: rules.id,
    moduleName: rules.name,
    name: draft.name.trim() || 'Sem nome',
    archetype,
    profession,
    presenceReason: draft.presenceReason.trim(),
    professionAttribute,
    professionAttributeBonus: professionAttribute
      ? (profession?.attributeBonus ?? 0)
      : 0,
    professionSkillId,
    professionSkillBonus: professionSkillId ? (profession?.bonusValue ?? 0) : 0,
    attributes: finalAttributes,
    skills: finalSkills,
    derived: calculateDerivedStats(finalAttributes, rules),
    generalSkills: draft.generalSkills,
    freeSkillBonusPicks: draft.freeSkillBonusPicks,
    anchors: draft.anchors,
    initialDisturbance: getInitialDisturbance(draft, rules),
    skillPool: getTotalSkillPool(draft.skills, rules, finalAttributes),
    anchorPool: getAnchorPool(finalAttributes, rules),
    equipments,
    carry: getCarryCapacity(
      finalAttributes,
      equipments,
      rules.equipmentRules,
    ),
    spentAttributePoints: getSpentAttributePoints(draft.attributes, rules),
    spentSkillPoints: getSpentSkillPoints(draft.skills),
  }
}

export function isIdentityComplete(
  draft: CharacterDraft,
  rules: ModuleRules,
): boolean {
  const archetype = getArchetype(rules, draft.archetypeId)
  if (draft.name.trim().length < 3 || !archetype) return false

  return isProfessionSelectionComplete(draft, rules) && hasPresenceReason(draft, rules)
}

export function isAttributesComplete(
  draft: CharacterDraft,
  rules: ModuleRules,
): boolean {
  const { min, pool } = rules.attributeRules
  const archetype = getArchetype(rules, draft.archetypeId)
  const caps = getAttributeCaps(
    rules,
    archetype,
    getDraftProfession(draft, rules),
    draft.professionAttributeChoice,
  )

  const allWithinLimits = rules.attributes.every((definition) => {
    const value = draft.attributes[definition.key]
    return (
      Number.isInteger(value) &&
      value >= min &&
      value <= caps[definition.key]
    )
  })

  return (
    allWithinLimits &&
    getSpentAttributePoints(draft.attributes, rules) === pool &&
    isProfessionRequirementMet(draft, rules)
  )
}

export function isSkillsComplete(
  draft: CharacterDraft,
  rules: ModuleRules,
): boolean {
  const archetype = getArchetype(rules, draft.archetypeId)
  const finalAttributes = getFinalAttributes(draft, rules)
  const caps = getSkillCaps(rules, archetype, finalAttributes)

  const allWithinLimits = rules.skills.every((definition) => {
    const value = draft.skills[definition.id] ?? 0
    return (
      Number.isInteger(value) &&
      value >= 0 &&
      value <= caps[definition.id]
    )
  })

  return (
    allWithinLimits &&
    getSpentSkillPoints(draft.skills) ===
      getTotalSkillPool(draft.skills, rules, finalAttributes)
  )
}

/**
 * Etapa de bônus (universal a todos os arquétipos): 100% dos pontos extras das
 * habilidades rejeitadas precisam estar distribuídos, sem ultrapassar o teto
 * vigente de cada perícia. Com as duas habilidades escolhidas a etapa é
 * automaticamente dispensada.
 */
export function isFreeSkillBonusComplete(
  draft: CharacterDraft,
  rules: ModuleRules,
): boolean {
  return getFreeSkillBonusIssues(draft, rules).length === 0
}

/**
 * Etapa de equipamentos: nenhum item pode violar as restrições de criação
 * (armas proibidas, itens de ofício de outra profissão ou porte sem
 * credencial) e o inventário nunca pode ultrapassar a capacidade de slots.
 */
export function isEquipmentComplete(
  draft: CharacterDraft,
  rules: ModuleRules,
): boolean {
  if (getEquipmentLoadoutIssues(draft, rules).length > 0) return false

  const archetype = getArchetype(rules, draft.archetypeId)
  const attributes = applyAttributeBonuses(
    rules,
    draft.attributes,
    archetype,
    getDraftProfession(draft, rules),
    draft.professionAttributeChoice,
  )
  const { usedSlots, maxSlots } = getCarryCapacity(
    attributes,
    getEffectiveEquipments(draft, rules),
    rules.equipmentRules,
  )

  return usedSlots <= maxSlots
}

export function isStepComplete(
  stepId: WizardStepId,
  draft: CharacterDraft,
  rules: ModuleRules,
): boolean {
  switch (stepId) {
    case 'identity':
      return isIdentityComplete(draft, rules)
    case 'attributes':
      return isAttributesComplete(draft, rules)
    case 'general-skills':
      return isGeneralSkillsComplete(draft, rules)
    case 'free-skill-bonus':
      return isFreeSkillBonusComplete(draft, rules)
    case 'skills':
      return isSkillsComplete(draft, rules)
    case 'anchors':
      return isAnchorsComplete(draft, rules)
    case 'equipment':
      return isEquipmentComplete(draft, rules)
    case 'review':
      return (
        isIdentityComplete(draft, rules) &&
        isAttributesComplete(draft, rules) &&
        isSkillsComplete(draft, rules) &&
        isGeneralSkillsComplete(draft, rules) &&
        isFreeSkillBonusComplete(draft, rules) &&
        isAnchorsComplete(draft, rules) &&
        isEquipmentComplete(draft, rules)
      )
  }
}
