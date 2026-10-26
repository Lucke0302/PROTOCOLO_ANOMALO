import { zodResolver } from '@hookform/resolvers/zod'
import { Brain, Anchor as AnchorIcon } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { getModule } from '../../../config/modules'
import {
  calculateDerivedStats,
  getAnchorPool,
  getFinalAttributes,
  getWizardSteps,
} from '../../../lib/characterRules'
import {
  createAnchorsSchema,
  type AnchorsFormValues,
} from '../../../lib/validation'
import { useCharacterStore } from '../../../store/useCharacterStore'
import type { Anchor } from '../../../types/character'
import { StepHeader } from '../StepHeader'
import { WizardFooter } from '../WizardFooter'

export function AnchorsStep() {
  const draft = useCharacterStore((state) => state.draft)
  const stepIndex = useCharacterStore((state) => state.stepIndex)
  const setAnchors = useCharacterStore((state) => state.setAnchors)
  const setInitialDisturbance = useCharacterStore(
    (state) => state.setInitialDisturbance,
  )
  const nextStep = useCharacterStore((state) => state.nextStep)
  const previousStep = useCharacterStore((state) => state.previousStep)

  const rules = getModule(draft.moduleId)
  const step = getWizardSteps(draft, rules)[stepIndex]
  const { count, minPerAnchor, basePoints } = rules.anchorRules
  const finalAttributes = getFinalAttributes(draft, rules)
  const anchorPool = getAnchorPool(finalAttributes, rules)
  const psique = finalAttributes[rules.anchorRules.attribute]
  // Cicatrizes da Mente: a SAN final é igual à PSIQUE final (derivado).
  const sanity = calculateDerivedStats(finalAttributes, rules).sanidade
  const { sanityThreshold, options: disturbanceOptions } =
    rules.disturbanceRules
  const requiresDisturbance = sanity < sanityThreshold
  const anchorAttributeLabel =
    rules.attributes.find(
      (attribute) => attribute.key === rules.anchorRules.attribute,
    )?.abbreviation ?? 'PSIQUE'

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<AnchorsFormValues>({
    resolver: zodResolver(createAnchorsSchema(rules, anchorPool, sanity)),
    defaultValues: {
      anchors: draft.anchors,
      initialDisturbance: draft.initialDisturbance ?? '',
    },
    mode: 'onChange',
  })

  const values = useWatch({ control }) as AnchorsFormValues
  const anchors = (values.anchors ?? draft.anchors) as Anchor[]
  const disturbanceValue = values.initialDisturbance ?? ''
  const disturbanceError = errors.initialDisturbance?.message
  // Campos numéricos vazios chegam como NaN: o resumo trata como 0 e o Zod
  // bloqueia o avanço com a mensagem específica do campo.
  const totalPoints = anchors.reduce(
    (total, anchor) =>
      total + (Number.isFinite(anchor.points) ? anchor.points : 0),
    0,
  )
  const remainingPoints = anchorPool - totalPoints
  const usedPercent = Math.min(
    100,
    Math.max(0, anchorPool > 0 ? (totalPoints / anchorPool) * 100 : 0),
  )
  const poolError =
    errors.anchors?.[count - 1]?.points?.message ??
    (errors.anchors as { message?: string } | undefined)?.message

  const onSubmit = handleSubmit((formValues) => {
    setInitialDisturbance(
      requiresDisturbance ? formValues.initialDisturbance : null,
    )
    setAnchors(formValues.anchors)
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
              <p className="label-micro">Total exigido</p>
              <p className="mt-1 font-mono text-2xl leading-none">
                {anchorPool}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-gray-500">
                {anchorAttributeLabel} {psique} + {basePoints}
              </p>
            </div>
            <div className="p-4">
              <p className="label-micro">Distribuídos</p>
              <p className="mt-1 font-mono text-2xl leading-none">
                {totalPoints}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-gray-500">
                entre {count} âncoras
              </p>
            </div>
            <div className="p-4">
              <p className="label-micro">Restantes</p>
              <p
                className={`mt-1 font-mono text-2xl leading-none ${
                  remainingPoints === 0 ? 'text-navy-blue' : ''
                }`}
              >
                {remainingPoints}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-gray-500">
                {remainingPoints === 0
                  ? 'distribuição exata'
                  : remainingPoints > 0
                    ? 'faltam pontos'
                    : 'excedeu o total'}
              </p>
            </div>
          </div>
          <div aria-hidden="true" className="h-1.5 bg-gray-100">
            <div
              className={`h-full transition-all duration-150 ${
                remainingPoints === 0 ? 'bg-navy-blue' : 'bg-black'
              }`}
              style={{ width: `${usedPercent}%` }}
            />
          </div>
          <p
            className="border-t border-gray-300 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500"
            aria-live="polite"
          >
            Distribuído {totalPoints}/{anchorPool} pontos · mínimo{' '}
            {minPerAnchor} por âncora
          </p>
        </div>

        {poolError ? (
          <p
            role="alert"
            className="border border-navy-blue bg-navy-blue-50 px-3 py-2 text-xs text-navy-blue"
          >
            {poolError}
          </p>
        ) : null}

        {requiresDisturbance ? (
          <section aria-labelledby="disturbance-title" className="panel p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3
                  id="disturbance-title"
                  className="flex items-center gap-2 text-sm font-semibold"
                >
                  <Brain className="h-4 w-4" aria-hidden="true" />
                  Cicatrizes da Mente
                </h3>
                <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-gray-500">
                  Estabilidade Mental final {sanity}, abaixo do limite de{' '}
                  {sanityThreshold}. Escolha o distúrbio que acompanha o
                  personagem desde a primeira cena.
                </p>
              </div>
              <span className="shrink-0 border border-navy-blue bg-navy-blue-50 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-navy-blue">
                obrigatório
              </span>
            </div>

            <label htmlFor="initial-disturbance" className="label-micro">
              Distúrbio inicial
            </label>
            <select
              id="initial-disturbance"
              aria-invalid={disturbanceError ? true : undefined}
              aria-describedby={
                disturbanceError
                  ? 'initial-disturbance-error'
                  : 'initial-disturbance-hint'
              }
              className="mt-1.5 w-full border border-gray-300 bg-white px-2.5 py-2 text-sm outline-none transition-colors focus:border-navy-blue focus:ring-1 focus:ring-navy-blue"
              {...register('initialDisturbance')}
            >
              <option value="">Selecione um distúrbio</option>
              {disturbanceOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>

            <p
              id="initial-disturbance-hint"
              className="mt-2 text-[11px] leading-relaxed text-gray-500"
            >
              {disturbanceOptions.find(
                (option) => option.id === disturbanceValue,
              )?.description ??
                'O distúrbio orienta a interpretação e as reações sob pressão.'}
            </p>

            {disturbanceError ? (
              <p
                id="initial-disturbance-error"
                role="alert"
                className="mt-1.5 text-[11px] text-navy-blue"
              >
                {disturbanceError}
              </p>
            ) : null}
          </section>
        ) : null}

        <section aria-labelledby="anchors-list-title">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h3 id="anchors-list-title" className="text-sm font-semibold">
              Âncoras pessoais
            </h3>
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-400">
              exatamente {count} âncoras
            </span>
          </div>

          <ul className="grid gap-3 lg:grid-cols-3">
            {draft.anchors.map((anchor, index) => {
              const nameError = errors.anchors?.[index]?.name?.message
              const descriptionError =
                errors.anchors?.[index]?.description?.message
              const pointsError = errors.anchors?.[index]?.points?.message

              return (
                <li key={anchor.id} className="panel flex flex-col p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-gray-500">
                      <AnchorIcon className="h-3 w-3" aria-hidden="true" />
                      Âncora 0{index + 1}
                    </span>
                    <span className="border border-gray-300 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-500">
                      mín. {minPerAnchor}
                    </span>
                  </div>

                  <input type="hidden" {...register(`anchors.${index}.id`)} />

                  <label
                    htmlFor={`anchor-${index}-name`}
                    className="label-micro"
                  >
                    Nome
                  </label>
                  <input
                    id={`anchor-${index}-name`}
                    type="text"
                    autoComplete="off"
                    maxLength={60}
                    placeholder="Ex.: Irmã mais nova"
                    aria-invalid={nameError ? true : undefined}
                    aria-describedby={
                      nameError ? `anchor-${index}-name-error` : undefined
                    }
                    className="mt-1.5 w-full border border-gray-300 bg-white px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-navy-blue focus:ring-1 focus:ring-navy-blue"
                    {...register(`anchors.${index}.name`)}
                  />
                  {nameError ? (
                    <p
                      id={`anchor-${index}-name-error`}
                      role="alert"
                      className="mt-1.5 text-[11px] text-navy-blue"
                    >
                      {nameError}
                    </p>
                  ) : null}

                  <label
                    htmlFor={`anchor-${index}-description`}
                    className="label-micro mt-3"
                  >
                    Descrição
                  </label>
                  <textarea
                    id={`anchor-${index}-description`}
                    rows={3}
                    maxLength={240}
                    placeholder="O que mantém este vínculo vivo?"
                    aria-invalid={descriptionError ? true : undefined}
                    aria-describedby={
                      descriptionError
                        ? `anchor-${index}-description-error`
                        : undefined
                    }
                    className="mt-1.5 w-full resize-none border border-gray-300 bg-white px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-navy-blue focus:ring-1 focus:ring-navy-blue"
                    {...register(`anchors.${index}.description`)}
                  />
                  {descriptionError ? (
                    <p
                      id={`anchor-${index}-description-error`}
                      role="alert"
                      className="mt-1.5 text-[11px] text-navy-blue"
                    >
                      {descriptionError}
                    </p>
                  ) : null}

                  <label
                    htmlFor={`anchor-${index}-points`}
                    className="label-micro mt-3"
                  >
                    Pontos
                  </label>
                  <input
                    id={`anchor-${index}-points`}
                    type="number"
                    min={minPerAnchor}
                    step={1}
                    inputMode="numeric"
                    aria-invalid={pointsError ? true : undefined}
                    aria-describedby={
                      pointsError ? `anchor-${index}-points-error` : undefined
                    }
                    className="mt-1.5 w-full border border-gray-300 bg-white px-2.5 py-2 font-mono text-sm outline-none transition-colors focus:border-navy-blue focus:ring-1 focus:ring-navy-blue"
                    {...register(`anchors.${index}.points`, {
                      valueAsNumber: true,
                    })}
                  />
                  {pointsError ? (
                    <p
                      id={`anchor-${index}-points-error`}
                      role="alert"
                      className="mt-1.5 text-[11px] text-navy-blue"
                    >
                      {pointsError}
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </section>

        {!isValid ? (
          <p
            role="status"
            className="border border-gray-300 bg-white px-3 py-2 text-[11px] leading-relaxed text-gray-500"
          >
            Avanço bloqueado: preencha o nome de cada âncora (mínimo 3
            caracteres) e garanta o somatório exato de {anchorPool} pontos (
            {anchorAttributeLabel} {psique} + {basePoints}), com no mínimo{' '}
            {minPerAnchor} por âncora.
            {requiresDisturbance
              ? ` A SAN ${sanity} exige também um distúrbio inicial (Cicatrizes da Mente).`
              : ''}
          </p>
        ) : null}

        <WizardFooter
          onBack={previousStep}
          nextLabel="Avançar para equipamentos"
          nextDisabled={!isValid}
          hint={
            requiresDisturbance && disturbanceValue === ''
              ? `SAN ${sanity} abaixo de ${sanityThreshold}: selecione uma Cicatriz da Mente.`
              : remainingPoints === 0
                ? `Somatório exato de ${anchorPool} pontos. Avance para os equipamentos.`
                : remainingPoints > 0
                  ? `Faltam ${remainingPoints} ponto(s) para atingir ${anchorPool} (${anchorAttributeLabel} ${psique} + ${basePoints}).`
                  : `Excedeu o total em ${Math.abs(remainingPoints)} ponto(s). Reduza antes de avançar.`
          }
        />
      </form>
    </section>
  )
}

