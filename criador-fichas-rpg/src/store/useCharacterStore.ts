import { create } from 'zustand'
import { DEFAULT_MODULE_ID, getModule } from '../config/modules'
import {
  canAssignFreeSkillBonus,
  canChooseGeneralSkill,
  canDraftEquipItem,
  createInitialDraft,
  getCivilProfession,
  getFreeSkillBonusSlots,
  getSanitizedEquipments,
  getWizardSteps,
  isProfessionEquipment,
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
    presenceReason: string
  }) => void
  setAttributes: (attributes: Attributes) => void
  setSkills: (skills: SkillRanks) => void
  addGeneralSkill: (skill: GeneralSkill) => void
  removeGeneralSkill: (skillId: GeneralSkillId) => void
  /** Define a perícia bonificada de uma vaga livre (`null` limpa a vaga). */
  setFreeSkillBonusPick: (index: number, skillId: SkillId | null) => void
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
    const rules = getModule(draft.moduleId)
    const keepsProfession = archetypeId === 'civil'

    const nextDraft: CharacterDraft = {
      ...draft,
      archetypeId,
      professionId: keepsProfession ? draft.professionId : null,
      professionSkillChoice: keepsProfession
        ? draft.professionSkillChoice
        : null,
      professionAttributeChoice: keepsProfession
        ? draft.professionAttributeChoice
        : null,
      presenceReason: keepsProfession ? draft.presenceReason : '',
    }

    set({
      draft: {
        ...nextDraft,
        equipments: getSanitizedEquipments(nextDraft, rules),
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
    presenceReason,
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

    const nextDraft: CharacterDraft = {
      ...draft,
      name,
      archetypeId,
      professionId: profession?.id ?? null,
      professionSkillChoice: keepsSkillChoice ? professionSkillChoice : null,
      professionAttributeChoice: keepsAttributeChoice
        ? professionAttributeChoice
        : null,
      presenceReason: archetypeId === 'civil' ? presenceReason : '',
    }

    // Trocar de arquétipo/profissão invalida itens que exigiam outra credencial
    // ou que pertenciam a outro ofício: eles saem do inventário.
    set({
      draft: {
        ...nextDraft,
        equipments: getSanitizedEquipments(nextDraft, rules),
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
  // revalidados aqui para manter o rascunho sempre consistente. Cada vaga
  // aberta consome um bônus de perícia, então o pool e as escolhas já feitas
  // são recalculados imediatamente a cada inclusão/remoção.
  addGeneralSkill: (skill) => {
    const { draft, stepIndex } = get()
    const rules = getModule(draft.moduleId)

    if (!canChooseGeneralSkill(skill, draft, rules)) return

    const generalSkills = [...draft.generalSkills, skill]
    const nextDraft: CharacterDraft = {
      ...draft,
      generalSkills,
      freeSkillBonusPicks: draft.freeSkillBonusPicks.slice(
        0,
        getFreeSkillBonusSlots(generalSkills.length, rules),
      ),
    }

    set({
      draft: nextDraft,
      stepIndex: Math.min(stepIndex, getWizardSteps(nextDraft, rules).length - 1),
    })
  },

  removeGeneralSkill: (skillId) =>
    set((state) => {
      const rules = getModule(state.draft.moduleId)
      const generalSkills = state.draft.generalSkills.filter(
        (skill) => skill.id !== skillId,
      )
      const nextDraft: CharacterDraft = {
        ...state.draft,
        generalSkills,
        freeSkillBonusPicks: state.draft.freeSkillBonusPicks.slice(
          0,
          getFreeSkillBonusSlots(generalSkills.length, rules),
        ),
      }

      return {
        draft: nextDraft,
        stepIndex: Math.min(
          state.stepIndex,
          getWizardSteps(nextDraft, rules).length - 1,
        ),
      }
    }),

  // Etapa de bônus: uma perícia por vaga livre. O índice precisa ser contíguo
  // para que a lista nunca tenha buracos e a escolha precisa caber no teto
  // final da perícia (60 na criação; 40 em combate para Civis).
  setFreeSkillBonusPick: (index, skillId) =>
    set((state) => {
      const rules = getModule(state.draft.moduleId)
      const slots = getFreeSkillBonusSlots(
        state.draft.generalSkills.length,
        rules,
      )
      const picks = [...state.draft.freeSkillBonusPicks]
      if (index < 0 || index > slots || index > picks.length) return {}

      if (
        skillId !== null &&
        !canAssignFreeSkillBonus(state.draft, rules, index, skillId)
      ) {
        return {}
      }

      if (skillId === null) {
        picks.splice(index, 1)
      } else if (index === picks.length) {
        picks.push(skillId)
      } else {
        picks[index] = skillId
      }

      return { draft: { ...state.draft, freeSkillBonusPicks: picks } }
    }),

  // As âncoras são copiadas para não compartilhar referência com o formulário.
  setAnchors: (anchors) =>
    set((state) => ({
      draft: {
        ...state.draft,
        anchors: anchors.map((anchor) => ({ ...anchor })),
      },
    })),

  // O store também protege o limite de carga e as restrições de criação:
  // adicionar item fora das regras não altera o rascunho (a UI já desabilita).
  addEquipment: (item) => {
    const { draft } = get()
    const rules = getModule(draft.moduleId)

    if (!canDraftEquipItem(item, draft, rules)) return

    set({
      draft: { ...draft, equipments: [...draft.equipments, item] },
    })
  },

  // Itens de ofício concedidos pela profissão são imutáveis.
  removeEquipment: (itemId) => {
    const { draft } = get()
    const rules = getModule(draft.moduleId)

    if (isProfessionEquipment(itemId, draft, rules)) return

    set({
      draft: {
        ...draft,
        equipments: draft.equipments.filter((item) => item.id !== itemId),
      },
    })
  },

  // Navegação direta só permite voltar; avançar exige validação da etapa.
  // Os índices seguem a lista de etapas visíveis, que omite a etapa de bônus
  // quando as duas habilidades gerais estão preenchidas.
  goToStep: (index) => {
    const { stepIndex, draft } = get()
    const rules = getModule(draft.moduleId)
    const steps = getWizardSteps(draft, rules)
    const target = Math.max(0, Math.min(index, stepIndex, steps.length - 1))
    set({ stepIndex: target })
  },

  nextStep: () => {
    const { draft, stepIndex } = get()
    const rules = getModule(draft.moduleId)
    const steps = getWizardSteps(draft, rules)
    const currentStep = steps[stepIndex]

    if (!currentStep || !isStepComplete(currentStep.id, draft, rules)) return

    set({ stepIndex: Math.min(stepIndex + 1, steps.length - 1) })
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
