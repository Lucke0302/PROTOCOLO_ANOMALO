import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { getModule } from '../../../config/modules'
import {
  getCivilProfession,
  getProfessionPrimaryAttribute,
  getProfessionSkillId,
  isArchetypeId,
  isAttributeKey,
  isCivilProfessionId,
} from '../../../lib/characterRules'
import {
  createIdentitySchema,
  type IdentityFormValues,
} from '../../../lib/validation'
import { useCharacterStore } from '../../../store/useCharacterStore'
import type { AttributeKey, SkillId } from '../../../types/character'
import { ArchetypeSelector } from '../ArchetypeSelector'
import { ProfessionSelector } from '../ProfessionSelector'
import { StepHeader } from '../StepHeader'
import { WizardFooter } from '../WizardFooter'

export function IdentityStep() {
  const draft = useCharacterStore((state) => state.draft)
  const stepIndex = useCharacterStore((state) => state.stepIndex)
  const setIdentity = useCharacterStore((state) => state.setIdentity)
  const nextStep = useCharacterStore((state) => state.nextStep)
  const previousStep = useCharacterStore((state) => state.previousStep)

  const rules = getModule(draft.moduleId)
  const step = rules.steps[stepIndex]

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitted },
  } = useForm<IdentityFormValues>({
    resolver: zodResolver(createIdentitySchema(rules)),
    defaultValues: {
      name: draft.name,
      archetypeId: draft.archetypeId ?? '',
      professionId: draft.professionId ?? '',
      professionSkillChoice: draft.professionSkillChoice ?? '',
      professionAttributeChoice: draft.professionAttributeChoice ?? '',
    },
    mode: 'onTouched',
  })

  const archetypeId = useWatch({ control, name: 'archetypeId' })
  const professionId = useWatch({ control, name: 'professionId' })
  const professionSkillChoice = useWatch({
    control,
    name: 'professionSkillChoice',
  })
  const professionAttributeChoice = useWatch({
    control,
    name: 'professionAttributeChoice',
  })

  const selectedArchetype = rules.archetypes.find(
    (archetype) => archetype.id === archetypeId,
  )
  const isCivil =
    selectedArchetype?.id === 'civil' && rules.civilProfessions.length > 0
  const professionAttributeBonus = isCivil
    ? Math.max(
        ...rules.civilProfessions.map((profession) => profession.attributeBonus),
      )
    : undefined

  const selectedProfession =
    isCivil && isCivilProfessionId(professionId, rules)
      ? getCivilProfession(rules, professionId)
      : null
  const professionErrors = {
    profession:
      isSubmitted && isCivil && !selectedProfession
        ? 'Selecione uma profissão contemporânea.'
        : undefined,
    skill:
      isSubmitted &&
      selectedProfession &&
      selectedProfession.bonusSkillIds.length > 1 &&
      getProfessionSkillId(
        selectedProfession,
        professionSkillChoice as SkillId,
      ) === null
        ? 'Selecione a perícia bonificada pela profissão.'
        : undefined,
    attribute:
      isSubmitted &&
      selectedProfession &&
      selectedProfession.primaryAttribute === null &&
      getProfessionPrimaryAttribute(
        selectedProfession,
        professionAttributeChoice as AttributeKey,
      ) === null
        ? 'Escolha o atributo principal da profissão.'
        : undefined,
  }

  const onSubmit = handleSubmit((values) => {
    if (!isArchetypeId(values.archetypeId, rules)) return

    const profession =
      isCivil && isCivilProfessionId(values.professionId, rules)
        ? getCivilProfession(rules, values.professionId)
        : null
    const keepsSkillChoice =
      profession !== null &&
      profession.bonusSkillIds.includes(values.professionSkillChoice as SkillId)
    const keepsAttributeChoice =
      profession !== null &&
      profession.primaryAttribute === null &&
      isAttributeKey(values.professionAttributeChoice, rules) &&
      (profession.attributeOptions?.includes(
        values.professionAttributeChoice as AttributeKey,
      ) ??
        false)

    setIdentity({
      name: values.name.trim(),
      archetypeId: values.archetypeId,
      professionId: profession?.id ?? null,
      professionSkillChoice: keepsSkillChoice
        ? (values.professionSkillChoice as SkillId)
        : null,
      professionAttributeChoice: keepsAttributeChoice
        ? (values.professionAttributeChoice as AttributeKey)
        : null,
    })
    nextStep()
  })

  return (
    <section aria-labelledby="step-title">
      <StepHeader
        eyebrow={`${rules.name} · Etapa 0${stepIndex + 1}`}
        title={step.title}
        description={step.description}
      />

      <form noValidate onSubmit={onSubmit} className="space-y-6">
        <div className="panel p-5">
          <label htmlFor="character-name" className="label-micro">
            Nome do personagem
          </label>
          <input
            id="character-name"
            type="text"
            autoComplete="off"
            placeholder="Ex.: Marina Vasques"
            maxLength={60}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={
              errors.name ? 'character-name-error' : 'character-name-hint'
            }
            className="mt-2 w-full border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-navy-blue focus:ring-1 focus:ring-navy-blue"
            {...register('name')}
          />
          {errors.name ? (
            <p
              id="character-name-error"
              role="alert"
              className="mt-2 text-xs text-navy-blue"
            >
              {errors.name.message}
            </p>
          ) : (
            <p id="character-name-hint" className="mt-2 text-[11px] text-gray-500">
              Entre 3 e 60 caracteres. Este nome será usado na ficha exportada.
            </p>
          )}
        </div>

        <fieldset className="panel p-5">
          <legend className="label-micro px-1">Arquétipo</legend>
          <p className="mb-4 mt-1 text-xs text-gray-500">
            Os bônus de arquétipo são somados após a distribuição de pontos e não
            consomem o pool.
          </p>
          <Controller
            control={control}
            name="archetypeId"
            render={({ field }) => (
              <ArchetypeSelector
                archetypes={rules.archetypes}
                attributes={rules.attributes}
                value={field.value}
                onChange={(next) => {
                  field.onChange(next)
                  setValue('professionId', '')
                  setValue('professionSkillChoice', '')
                  setValue('professionAttributeChoice', '')
                }}
                onBlur={field.onBlur}
                name={field.name}
                professionAttributeBonus={professionAttributeBonus}
                error={errors.archetypeId?.message}
              />
            )}
          />
        </fieldset>

        {isCivil ? (
          <ProfessionSelector
            professions={rules.civilProfessions}
            attributes={rules.attributes}
            skills={rules.skills}
            equipmentCatalog={rules.equipmentCatalog}
            selectedId={
              isCivilProfessionId(professionId, rules) ? professionId : null
            }
            selectedSkill={
              professionSkillChoice === '' ? null : (professionSkillChoice as SkillId)
            }
            selectedAttribute={
              professionAttributeChoice === ''
                ? null
                : (professionAttributeChoice as AttributeKey)
            }
            onSelect={(next) => {
              setValue('professionId', next, { shouldValidate: true })
              setValue('professionSkillChoice', '')
              setValue('professionAttributeChoice', '')
            }}
            onSelectSkill={(next) =>
              setValue('professionSkillChoice', next, { shouldValidate: true })
            }
            onSelectAttribute={(next) =>
              setValue('professionAttributeChoice', next, {
                shouldValidate: true,
              })
            }
            errors={{
              profession: professionErrors.profession,
              skill: professionErrors.skill,
              attribute: professionErrors.attribute,
            }}
          />
        ) : null}

        <WizardFooter
          onBack={stepIndex > 0 ? previousStep : undefined}
          nextLabel="Avançar para atributos"
          hint={
            isCivil
              ? 'O avanço exige nome, arquétipo, profissão, perícia bonificada e atributo principal (quando flexível). O pré-requisito é conferido na etapa seguinte.'
              : 'O avanço só é liberado com nome válido e um arquétipo selecionado.'
          }
        />
      </form>
    </section>
  )
}
