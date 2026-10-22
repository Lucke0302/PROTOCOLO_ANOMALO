import { z } from 'zod'
import { ATTRIBUTE_KEYS } from '../config/modules/moduleA'
import {
  applyAttributeBonuses,
  getAnchorPointsTotal,
  getCivilProfession,
  getAttributeCaps,
  getProfessionAttributeRequirement,
  getProfessionPrimaryAttribute,
  getProfessionSkillId,
  getSkillCaps,
  getTotalSkillPool,
} from './characterRules'
import type {
  Anchor,
  ArchetypeDefinition,
  AttributeKey,
  Attributes,
  CivilProfession,
  CivilProfessionId,
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
}

export type AttributesFormValues = Attributes

export type SkillsFormValues = SkillRanks

export type AnchorsFormValues = {
  anchors: Anchor[]
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
    })
    .superRefine((values, context) => {
      const archetype = rules.archetypes.find(
        (definition) => definition.id === values.archetypeId,
      )

      if (!archetype || archetype.id !== 'civil') return
      if (rules.civilProfessions.length === 0) return

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
 * Etapa 3: pontos investidos entre 0 e o teto da perícia (que pode ser
 * reduzido por arquétipo) e pool total distribuído por completo. Perícias no
 * teto concedem bônus de pool, por isso o total esperado é dinâmico.
 * O shape é construído a partir do módulo, permitindo que o Módulo B tenha
 * um conjunto próprio de perícias sem alterar este arquivo.
 */
export function createSkillsSchema(
  rules: ModuleRules,
  archetype: ArchetypeDefinition | null = null,
  chosenGeneralSkills = 0,
) {
  const caps = getSkillCaps(rules, archetype)

  const shape: Record<string, z.ZodNumber> = {}
  for (const skill of rules.skills) {
    const cap = caps[skill.id]

    shape[skill.id] = z
      .number()
      .int({ message: 'Use apenas valores inteiros.' })
      .min(0, { message: 'O mínimo é 0 ponto.' })
      .max(cap, { message: `O teto desta perícia é ${cap} pontos.` })
  }

  return z
    .object(shape)
    .superRefine((values, context) => {
      const spent = Object.values(values).reduce(
        (total, rank) => total + rank,
        0,
      )
      const totalPool = getTotalSkillPool(
        values as SkillRanks,
        rules,
        chosenGeneralSkills,
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
 * Etapa de âncoras: exatamente 3 campos nomeados, nenhum abaixo do mínimo e
 * somatório ESTRITAMENTE igual a PSIQUE + 20. O total é recalculado a cada
 * alteração de atributo e chega aqui já como valor final.
 */
export function createAnchorsSchema(rules: ModuleRules, totalPoints: number) {
  const { count, minPerAnchor } = rules.anchorRules

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
    })
    .superRefine((values, context) => {
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

