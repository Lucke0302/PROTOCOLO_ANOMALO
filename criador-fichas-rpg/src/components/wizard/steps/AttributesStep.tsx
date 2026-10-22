import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { getModule } from '../../../config/modules'
import {
  applyAttributeBonuses,
  calculateDerivedStats,
  getArchetype,
  getAttributeCaps,
  getDraftProfession,
  getProfessionAttributeRequirement,
  getProfessionRequirementStatus,
  getRemainingAttributePoints,
  getSpentAttributePoints,
} from '../../../lib/characterRules'
import {
  createAttributesSchema,
  type AttributesFormValues,
} from '../../../lib/validation'
import { useCharacterStore } from '../../../store/useCharacterStore'
import { AttributeDistribution } from '../AttributeDistribution'
import { DerivedStatsPanel } from '../DerivedStatsPanel'
import { StepHeader } from '../StepHeader'
import { WizardFooter } from '../WizardFooter'

export function AttributesStep() {
  const draft = useCharacterStore((state) => state.draft)
  const stepIndex = useCharacterStore((state) => state.stepIndex)
  const setAttributes = useCharacterStore((state) => state.setAttributes)
  const nextStep = useCharacterStore((state) => state.nextStep)
  const previousStep = useCharacterStore((state) => state.previousStep)

  const rules = getModule(draft.moduleId)
  const step = rules.steps[stepIndex]
  const archetype = getArchetype(rules, draft.archetypeId)
  const profession = getDraftProfession(draft, rules)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AttributesFormValues>({
    resolver: zodResolver(
      createAttributesSchema(
        rules,
        archetype,
        profession,
        draft.professionAttributeChoice,
      ),
    ),
    defaultValues: draft.attributes,
    mode: 'onChange',
  })

  const attributes = useWatch({ control }) as AttributesFormValues
  const caps = getAttributeCaps(
    rules,
    archetype,
    profession,
    draft.professionAttributeChoice,
  )
  const spent = getSpentAttributePoints(attributes, rules)
  const remaining = getRemainingAttributePoints(attributes, rules)
  const pool = rules.attributeRules.pool
  const spentPercent = Math.min(100, Math.max(0, (spent / pool) * 100))

  const previewAttributes = applyAttributeBonuses(
    rules,
    attributes,
    archetype,
    profession,
    draft.professionAttributeChoice,
  )
  const previewDerived = calculateDerivedStats(previewAttributes, rules)

  const requirement = getProfessionAttributeRequirement(
    profession,
    draft.professionAttributeChoice,
  )
  const requirementStatus = getProfessionRequirementStatus(
    profession,
    draft.professionAttributeChoice,
    rules.attributes,
    previewAttributes,
  )
  const requirementMet = requirementStatus?.met ?? true
  const professionAttributeLabel = requirement
    ? (rules.attributes.find(
        (attribute) => attribute.key === requirement.attribute,
      )?.label ?? requirement.attribute)
    : null
  const attributeErrorMessages = rules.attributes
    .map((definition) => errors[definition.key]?.message)
    .filter((message): message is string => Boolean(message))

  // Mantém o rascunho sincronizado para que as etapas seguintes (perícias,
  // carga, revisão) usem exatamente os atributos distribuídos aqui.
  useEffect(() => {
    setAttributes(attributes)
  }, [attributes, setAttributes])

  const onSubmit = handleSubmit((values) => {
    setAttributes(values)
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
        <div className="panel">
          <div className="grid grid-cols-1 divide-y divide-gray-300 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="p-4">
              <p className="label-micro">Pool do módulo</p>
              <p className="mt-1 font-mono text-2xl leading-none">{pool}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-gray-500">
                pontos para distribuir
              </p>
            </div>
            <div className="p-4">
              <p className="label-micro">Distribuídos</p>
              <p className="mt-1 font-mono text-2xl leading-none">{spent}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-gray-500">
                soma acima da base {rules.attributeRules.base}
              </p>
            </div>
            <div className="p-4">
              <p className="label-micro">Restantes</p>
              <p
                className={`mt-1 font-mono text-2xl leading-none ${
                  remaining === 0 ? 'text-navy-blue' : ''
                }`}
              >
                {remaining}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-gray-500">
                {remaining === 0 ? 'pool completo' : 'distribua todos os pontos'}
              </p>
            </div>
          </div>
          <div aria-hidden="true" className="h-1.5 bg-gray-100">
            <div
              className="h-full bg-navy-blue transition-all duration-150"
              style={{ width: `${spentPercent}%` }}
            />
          </div>
        </div>

        {attributeErrorMessages.length > 0 ? (
          <div
            role="alert"
            className="space-y-1 border border-navy-blue bg-navy-blue-50 px-3 py-2 text-xs text-navy-blue"
          >
            {attributeErrorMessages.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        ) : null}

        {archetype ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border border-gray-300 p-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-gray-500">
              Arquétipo
            </span>
            <span className="text-xs font-medium">{archetype.label}</span>
            <span className="text-[11px] text-gray-500">
              Bônus aplicados apenas na prévia e na ficha final.
            </span>
          </div>
        ) : null}

        <AttributeDistribution
          control={control}
          rules={rules.attributeRules}
          attributes={rules.attributes}
          archetype={archetype}
          profession={profession}
          professionAttributeChoice={draft.professionAttributeChoice}
          caps={caps}
          remaining={remaining}
        />

        {requirement && professionAttributeLabel ? (
          <div
            className={`border p-3 text-xs ${
              requirementMet
                ? 'border-gray-300 text-gray-600'
                : 'border-navy-blue bg-navy-blue-50 text-navy-blue'
            }`}
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.16em]">
              Pré-requisito da profissão · {profession?.label}
            </p>
            <p className="mt-1 font-medium">
              {professionAttributeLabel}{' '}
              {requirementStatus?.current ?? 0}/{requirement.required}
              {requirementMet ? ' · requisito atendido' : ' · requisito pendente'}
            </p>
            <p className="mt-1 leading-snug">
              {requirementMet
                ? `Bônus de +${requirement.bonus} da profissão aplicado fora do pool.`
                : `Invista pelo menos ${requirement.minBase} no valor base para atingir ${requirement.required} com o bônus de +${requirement.bonus}.`}
            </p>
          </div>
        ) : null}

        <section>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-semibold">Prévia dos derivados</h3>
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-400">
              calculado em tempo real
            </span>
          </div>
          <DerivedStatsPanel rules={rules} derived={previewDerived} />
        </section>

        <WizardFooter
          onBack={previousStep}
          nextLabel="Avançar para habilidades"
          nextDisabled={remaining !== 0 || !requirementMet}
          hint={
            !requirementMet && professionAttributeLabel
              ? `${professionAttributeLabel} precisa atingir ${requirement?.required} no valor final (bônus de +${requirement?.bonus} incluso).`
              : remaining === 0
                ? 'Pool completo. Avance para escolher as habilidades gerais.'
                : `Ainda restam ${remaining} ponto(s) de atributo para distribuir.`
          }
        />
      </form>
    </section>
  )
}
