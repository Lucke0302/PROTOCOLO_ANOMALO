import { z } from 'zod'
import { ATTRIBUTE_KEYS } from '../config/modules/moduleA'
import {
  applyAttributeBonuses,
  getAnchorPointsTotal,
  getCivilProfession,
  getAttributeCaps,
  getEquipmentLoadoutIssues,
  getFreeSkillBonusIssues,
  getFreeSkillBonusSlots,
  getProfessionAttributeRequirement,
  getProfessionPrimaryAttribute,
  getProfessionSkillId,
  getSkillBaseValues,
  getSkillCaps,
  getTotalSkillPool,
  PRESENCE_REASON_MIN_LENGTH,
} from './characterRules'
import type {
  Anchor,
  ArchetypeDefinition,
  AttributeKey,
  Attributes,
  CharacterDraft,
  CivilProfession,
  CivilProfessionId,
  Equipment,
  ModuleRules,
  SkillId,
  SkillRanks,
} from '../types/character'

export type IdentityFormValues = {
  name: string
  archetypeId: string
  professionId: string
  professionSkillChoice: string
  professionAttributeChoice: string
  presenceReason: string
}

export type AttributesFormValues = Attributes

export type SkillsFormValues = SkillRanks

export type FreeSkillBonusFormValues = {
  picks: string[]
}

export type EquipmentFormValues = {
  equipmentIds: string[]
}

export type AnchorsFormValues = {
  anchors: Anchor[]
  initialDisturbance: string
}

/**
 * Etapa 1: nome e arquétipo obrigatórios. Civis também definem, no mesmo passo,
 * a profissão contemporânea, a perícia bonificada (quando houver mais de uma) e
 * o atributo principal (apenas quando a profissão é flexível).
 */
export function createIdentitySchema(rules: ModuleRules) {
  const archetypeIds: readonly string[] = rules.archetypes.map(
    (archetype) => archetype.id,
  )
  const attributeKeys: readonly string[] = rules.attributes.map(
    (attribute) => attribute.key,
  )

  return z
    .object({
      name: z
        .string()
        .trim()
        .min(3, { message: 'Informe ao menos 3 caracteres.' })
        .max(60, { message: 'Use no máximo 60 caracteres.' }),
      archetypeId: z
        .string()
        .min(1, { message: 'Selecione um arquétipo.' })
        .refine((value) => archetypeIds.includes(value), {
          message: 'Selecione um arquétipo válido.',
        }),
      professionId: z.string(),
      professionSkillChoice: z.string(),
      professionAttributeChoice: z.string(),
      presenceReason: z
        .string()
        .trim()
        .max(280, { message: 'Use no máximo 280 caracteres.' }),
    })
    .superRefine((values, context) => {
      const archetype = rules.archetypes.find(
        (definition) => definition.id === values.archetypeId,
      )

      if (!archetype || archetype.id !== 'civil') return
      if (rules.civilProfessions.length === 0) return

      if (values.presenceReason.length < PRESENCE_REASON_MIN_LENGTH) {
        context.addIssue({
          code: 'custom',
          path: ['presenceReason'],
          message: `Descreva o motivo de presença com pelo menos ${PRESENCE_REASON_MIN_LENGTH} caracteres.`,
        })
      }

      const profession = getCivilProfession(
        rules,
        values.professionId as CivilProfessionId,
      )

      if (!profession) {
        context.addIssue({
          code: 'custom',
          path: ['professionId'],
          message: 'Selecione uma profissão contemporânea.',
        })
        return
      }

      if (
        profession.bonusSkillIds.length > 1 &&
        getProfessionSkillId(profession, values.professionSkillChoice as SkillId) ===
          null
      ) {
        context.addIssue({
          code: 'custom',
          path: ['professionSkillChoice'],
          message: 'Selecione a perícia bonificada pela profissão.',
        })
      }

      if (
        !profession.primaryAttribute &&
        (!attributeKeys.includes(values.professionAttributeChoice) ||
          getProfessionPrimaryAttribute(
            profession,
            values.professionAttributeChoice as AttributeKey,
          ) === null)
      ) {
        context.addIssue({
          code: 'custom',
          path: ['professionAttributeChoice'],
          message: 'Escolha o atributo principal da profissão.',
        })
      }
    })
}

/**
 * Etapa 2: cada atributo respeita a base e o teto de distribuição (teto final
 * do módulo descontados os bônus de arquétipo e profissão), o pool deve ser
 * distribuído por completo e o atributo principal da profissão precisa atingir
 * o pré-requisito no valor FINAL.
 */
export function createAttributesSchema(
  rules: ModuleRules,
  archetype: ArchetypeDefinition | null = null,
  profession: CivilProfession | null = null,
  professionAttributeChoice: AttributeKey | null = null,
) {
  const { min, pool, max } = rules.attributeRules
  const caps = getAttributeCaps(
    rules,
    archetype,
    profession,
    professionAttributeChoice,
  )
  const requirement = getProfessionAttributeRequirement(
    profession,
    professionAttributeChoice,
  )

  const createField = (key: AttributeKey) =>
    z
      .number()
      .int({ message: 'Use apenas valores inteiros.' })
      .min(min, { message: `O valor mínimo é ${min}.` })
      .max(caps[key], {
        message: `O valor máximo é ${caps[key]} (teto ${max} já inclui os bônus de arquétipo e profissão).`,
      })

  const shape = {
    fisico: createField('fisico'),
    destreza: createField('destreza'),
    intelecto: createField('intelecto'),
    psique: createField('psique'),
  }

  return z.object(shape).superRefine((values, context) => {
    const spent = ATTRIBUTE_KEYS.reduce(
      (total, key) => total + (values[key] - min),
      0,
    )
    const remaining = pool - spent

    if (remaining !== 0) {
      context.addIssue({
        code: 'custom',
        path: ['fisico'],
        message:
          remaining > 0
            ? `Distribua exatamente ${pool} pontos. Ainda restam ${remaining}.`
            : `Você excedeu o limite de ${pool} pontos em ${Math.abs(remaining)}.`,
      })
    }

    if (!requirement) return

    const finalAttributes = applyAttributeBonuses(
      rules,
      values as Attributes,
      archetype,
      profession,
      professionAttributeChoice,
    )
    const current = finalAttributes[requirement.attribute]
    if (current >= requirement.required) return

    const definition = rules.attributes.find(
      (attribute) => attribute.key === requirement.attribute,
    )
    const label = definition?.label ?? requirement.attribute

    context.addIssue({
      code: 'custom',
      path: [requirement.attribute],
      message: `${label} precisa chegar a ${requirement.required} no valor final (bônus de +${requirement.bonus} da profissão incluso): invista pelo menos ${requirement.minBase} no valor base. Atual: ${current}.`,
    })
  })
}

/**
 * Etapa 3: pontos investidos entre 0 e o teto de INVESTIMENTO de cada perícia
 * (teto final absoluto menos o valor base do atributo, podendo ser reduzido por
 * arquétipo) e pool total distribuído por completo. Perícias no teto final
 * concedem bônus de pool, por isso o total esperado é dinâmico.
 * O shape é construído a partir do módulo, permitindo que o Módulo B tenha
 * um conjunto próprio de perícias sem alterar este arquivo.
 */
export function createSkillsSchema(
  rules: ModuleRules,
  archetype: ArchetypeDefinition | null,
  attributes: Attributes,
) {
  const caps = getSkillCaps(rules, archetype, attributes)
  const baseValues = getSkillBaseValues(rules, attributes)

  const shape: Record<string, z.ZodNumber> = {}
  for (const skill of rules.skills) {
    const cap = caps[skill.id]
    const totalCap = cap + (baseValues[skill.id] ?? 0)

    shape[skill.id] = z
      .number()
      .int({ message: 'Use apenas valores inteiros.' })
      .min(0, { message: 'O mínimo é 0 ponto.' })
      .max(cap, {
        message: `O teto desta perícia é ${cap} ponto(s) investido(s) (valor final máximo ${totalCap}).`,
      })
  }

  return z
    .object(shape)
    .superRefine((values, context) => {
      // Inputs numéricos do HTML podem devolver strings ("10"): sem o casting
      // matemático a soma concatenaria e o pool pendente ficaria irreal.
      const spent = Object.values(values).reduce(
        (total, rank) => total + (Number(rank) || 0),
        0,
      )
      const totalPool = getTotalSkillPool(
        values as SkillRanks,
        rules,
        attributes,
      )
      const remaining = totalPool - spent

      if (remaining !== 0) {
        context.addIssue({
          code: 'custom',
          path: [rules.skills[0].id],
          message:
            remaining > 0
              ? `Distribua exatamente ${totalPool} pontos de perícia. Ainda restam ${remaining}.`
              : `Você excedeu o total de ${totalPool} pontos em ${Math.abs(remaining)}.`,
        })
      }
    }) as unknown as z.ZodType<SkillRanks, SkillRanks>
}

/**
 * Etapa de bônus de vagas livres: exatamente uma perícia por vaga aberta
 * (nenhuma quando as duas habilidades gerais foram escolhidas), sem
 * ultrapassar o teto vigente de cada perícia. Universal a Detetive, Policial e
 * Civil — o pool é sempre (2 - escolhidas) * 10.
 */
export function createFreeSkillBonusSchema(
  rules: ModuleRules,
  draft: CharacterDraft,
) {
  const slots = getFreeSkillBonusSlots(draft.generalSkills.length, rules)
  const perSlot = rules.generalSkillRules.freeSlotBonusPerSlot
  const skillIds: readonly string[] = rules.skills.map((skill) => skill.id)

  return z
    .object({
      picks: z.array(z.string()).length(slots, {
        message:
          slots === 0
            ? 'Nenhuma vaga livre: não há pontos de bônus a distribuir.'
            : `Distribua exatamente ${slots * perSlot} pontos: selecione ${slots} perícia(s) bonificada(s).`,
      }),
    })
    .superRefine((values, context) => {
      const unknown = values.picks.filter(
        (skillId) => !skillIds.includes(skillId),
      )

      for (const skillId of unknown) {
        context.addIssue({
          code: 'custom',
          path: ['picks'],
          message: `Perícia desconhecida: ${skillId}.`,
        })
      }

      if (unknown.length > 0 || values.picks.length !== slots) return

      const issues = getFreeSkillBonusIssues(
        { ...draft, freeSkillBonusPicks: values.picks as SkillId[] },
        rules,
      )

      for (const message of issues) {
        context.addIssue({ code: 'custom', path: ['picks'], message })
      }
    }) as unknown as z.ZodType<FreeSkillBonusFormValues, FreeSkillBonusFormValues>
}

/**
 * Etapa de Equipamentos: os itens escolhidos precisam existir no catálogo e
 * respeitar as restrições de criação (armas longas/pesadas proibidas no Nível 1,
 * itens de ofício exclusivos da profissão concedente e credencial de porte).
 * Os itens da profissão são derivados do rascunho e não passam por aqui.
 */
export function createEquipmentSchema(
  rules: ModuleRules,
  draft: CharacterDraft,
) {
  return z
    .object({ equipmentIds: z.array(z.string()) })
    .superRefine((values, context) => {
      const items: Equipment[] = []

      for (const id of values.equipmentIds) {
        const item = rules.equipmentCatalog.find(
          (catalogItem) => catalogItem.id === id,
        )

        if (!item) {
          context.addIssue({
            code: 'custom',
            path: ['equipmentIds'],
            message: `Item desconhecido no catálogo: ${id}.`,
          })
          continue
        }

        items.push(item)
      }

      const issues = getEquipmentLoadoutIssues(
        { ...draft, equipments: items },
        rules,
      )

      for (const message of issues) {
        context.addIssue({
          code: 'custom',
          path: ['equipmentIds'],
          message,
        })
      }
    }) as unknown as z.ZodType<EquipmentFormValues, EquipmentFormValues>
}

/**
 * Etapa de âncoras: exatamente 3 campos nomeados, nenhum abaixo do mínimo e
 * somatório ESTRITAMENTE igual a PSIQUE + 20. O total é recalculado a cada
 * alteração de atributo e chega aqui já como valor final.
 *
 * Quando a Estabilidade Mental final fica abaixo do limite do módulo, a mesma
 * etapa passa a exigir um distúrbio inicial (Cicatrizes da Mente).
 */
export function createAnchorsSchema(
  rules: ModuleRules,
  totalPoints: number,
  sanity: number,
) {
  const { count, minPerAnchor } = rules.anchorRules
  const { sanityThreshold, options } = rules.disturbanceRules
  const requiresDisturbance = sanity < sanityThreshold

  const anchorShape = z.object({
    id: z.string().min(1),
    name: z
      .string()
      .trim()
      .min(3, { message: 'Descreva a âncora com ao menos 3 caracteres.' })
      .max(60, { message: 'Use no máximo 60 caracteres.' }),
    description: z
      .string()
      .trim()
      .max(240, { message: 'Use no máximo 240 caracteres.' }),
    points: z
      .number({ message: 'Informe os pontos da âncora.' })
      .int({ message: 'Use apenas valores inteiros.' })
      .min(minPerAnchor, {
        message: `O mínimo por âncora é ${minPerAnchor} pontos.`,
      }),
  })

  return z
    .object({
      anchors: z
        .array(anchorShape)
        .length(count, { message: `Informe exatamente ${count} âncoras.` }),
      initialDisturbance: z.string(),
    })
    .superRefine((values, context) => {
      if (
        requiresDisturbance &&
        !options.some((option) => option.id === values.initialDisturbance)
      ) {
        context.addIssue({
          code: 'custom',
          path: ['initialDisturbance'],
          message: `SAN ${sanity} abaixo de ${sanityThreshold}: escolha um distúrbio inicial.`,
        })
      }

      const total = getAnchorPointsTotal(values.anchors)
      if (total === totalPoints) return

      const remaining = totalPoints - total
      context.addIssue({
        code: 'custom',
        path: ['anchors', count - 1, 'points'],
        message:
          remaining > 0
            ? `Distribua exatamente ${totalPoints} pontos. Ainda faltam ${remaining}.`
            : `O total de ${totalPoints} pontos foi excedido em ${Math.abs(remaining)}.`,
      })
    }) as unknown as z.ZodType<AnchorsFormValues, AnchorsFormValues>
}

