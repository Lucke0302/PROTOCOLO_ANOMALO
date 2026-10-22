import { create } from 'zustand'
import { DEFAULT_MODULE_ID, getModule } from '../config/modules'
import {
  applyAttributeBonuses,
  canChooseGeneralSkill,
  canEquipItem,
  createInitialDraft,
  getArchetype,
  getCivilProfession,
  getDraftProfession,
  getEffectiveEquipments,
  isStepComplete,
} from '../lib/characterRules'
import type {
  Anchor,
  ArchetypeId,
  AttributeKey,
  Attributes,
  CharacterDraft,
  CivilProfessionId,
  Equipment,
  GeneralSkill,
  GeneralSkillId,
  SkillId,
  SkillRanks,
} from '../types/character'

interface CharacterStore {
  draft: CharacterDraft
  stepIndex: number
  setName: (name: string) => void
  setArchetype: (archetypeId: ArchetypeId) => void
  setIdentity: (identity: {
    name: string
    archetypeId: ArchetypeId
    professionId: CivilProfessionId | null
    professionSkillChoice: SkillId | null
    professionAttributeChoice: AttributeKey | null
  }) => void
  setAttributes: (attributes: Attributes) => void
  setSkills: (skills: SkillRanks) => void
  addGeneralSkill: (skill: GeneralSkill) => void
  removeGeneralSkill: (skillId: GeneralSkillId) => void
  setAnchors: (anchors: Anchor[]) => void
  addEquipment: (item: Equipment) => void
  removeEquipment: (itemId: string) => void
  goToStep: (index: number) => void
  nextStep: () => void
  previousStep: () => void
  switchModule: (moduleId: string) => void
  resetDraft: () => void
}

const initialModule = getModule(DEFAULT_MODULE_ID)

export const useCharacterStore = create<CharacterStore>()((set, get) => ({
  draft: createInitialDraft(initialModule),
  stepIndex: 0,

  setName: (name) =>
    set((state) => ({
      draft: { ...state.draft, name },
    })),

  // Trocar de arquétipo limpa a profissão e as escolhas derivadas quando o
  // personagem deixa de ser Civil.
  setArchetype: (archetypeId) => {
    const { draft } = get()
    const keepsProfession = archetypeId === 'civil'

    set({
      draft: {
        ...draft,
        archetypeId,
        professionId: keepsProfession ? draft.professionId : null,
        professionSkillChoice: keepsProfession
          ? draft.professionSkillChoice
          : null,
        professionAttributeChoice: keepsProfession
          ? draft.professionAttributeChoice
          : null,
      },
    })
  },

  // Identidade concentra nome, arquétipo e — para Civis — a profissão
  // contemporânea com a perícia bonificada e o atributo principal flexível.
  // Escolhas que não se aplicam à profissão selecionada são descartadas.
  setIdentity: ({
    name,
    archetypeId,
    professionId,
    professionSkillChoice,
    professionAttributeChoice,
  }) => {
    const { draft } = get()
    const rules = getModule(draft.moduleId)
    const profession =
      archetypeId === 'civil' ? getCivilProfession(rules, professionId) : null
    const keepsSkillChoice =
      profession !== null &&
      profession.bonusSkillIds.length > 1 &&
      professionSkillChoice !== null &&
      profession.bonusSkillIds.includes(professionSkillChoice)
    const keepsAttributeChoice =
      profession !== null &&
      profession.primaryAttribute === null &&
      professionAttributeChoice !== null &&
      (profession.attributeOptions?.includes(professionAttributeChoice) ??
        false)

    set({
      draft: {
        ...draft,
        name,
        archetypeId,
        professionId: profession?.id ?? null,
        professionSkillChoice: keepsSkillChoice ? professionSkillChoice : null,
        professionAttributeChoice: keepsAttributeChoice
          ? professionAttributeChoice
          : null,
      },
    })
  },

  setAttributes: (attributes) =>
    set((state) => ({
      draft: { ...state.draft, attributes },
    })),

  setSkills: (skills) =>
    set((state) => ({
      draft: { ...state.draft, skills },
    })),

  // Habilidades gerais: o limite de 2 escolhas e os pré-requisitos são
  // revalidados aqui para manter o rascunho sempre consistente.
  addGeneralSkill: (skill) => {
    const { draft } = get()
    const rules = getModule(draft.moduleId)

    if (!canChooseGeneralSkill(skill, draft, rules)) return

    set({
      draft: {
        ...draft,
        generalSkills: [...draft.generalSkills, skill],
      },
    })
  },

  removeGeneralSkill: (skillId) =>
    set((state) => ({
      draft: {
        ...state.draft,
        generalSkills: state.draft.generalSkills.filter(
          (skill) => skill.id !== skillId,
        ),
      },
    })),

  // As âncoras são copiadas para não compartilhar referência com o formulário.
  setAnchors: (anchors) =>
    set((state) => ({
      draft: {
        ...state.draft,
        anchors: anchors.map((anchor) => ({ ...anchor })),
      },
    })),

  // O store também protege o limite de carga: adicionar item fora das regras
  // não altera o rascunho (a UI já desabilita a ação).
  addEquipment: (item) => {
    const { draft } = get()
    const rules = getModule(draft.moduleId)
    const archetype = getArchetype(rules, draft.archetypeId)
    const finalAttributes = applyAttributeBonuses(
      rules,
      draft.attributes,
      archetype,
      getDraftProfession(draft, rules),
      draft.professionAttributeChoice,
    )

    if (
      !canEquipItem(
        item,
        finalAttributes,
        getEffectiveEquipments(draft, rules),
        rules.equipmentRules,
      )
    ) {
      return
    }

    set({
      draft: { ...draft, equipments: [...draft.equipments, item] },
    })
  },

  removeEquipment: (itemId) =>
    set((state) => ({
      draft: {
        ...state.draft,
        equipments: state.draft.equipments.filter((item) => item.id !== itemId),
      },
    })),

  // Navegação direta só permite voltar; avançar exige validação da etapa.
  goToStep: (index) => {
    const { stepIndex, draft } = get()
    const rules = getModule(draft.moduleId)
    const target = Math.max(0, Math.min(index, stepIndex, rules.steps.length - 1))
    set({ stepIndex: target })
  },

  nextStep: () => {
    const { draft, stepIndex } = get()
    const rules = getModule(draft.moduleId)
    const currentStep = rules.steps[stepIndex]

    if (!currentStep || !isStepComplete(currentStep.id, draft, rules)) return

    set({
      stepIndex: Math.min(stepIndex + 1, rules.steps.length - 1),
    })
  },

  previousStep: () => {
    const { stepIndex } = get()
    set({ stepIndex: Math.max(0, stepIndex - 1) })
  },

  switchModule: (moduleId) => {
    const rules = getModule(moduleId)
    set({ draft: createInitialDraft(rules), stepIndex: 0 })
  },

  resetDraft: () => {
    const { draft } = get()
    set({ draft: createInitialDraft(getModule(draft.moduleId)), stepIndex: 0 })
  },
}))
