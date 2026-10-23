import { Check, Lock, Plus, X } from 'lucide-react'
import { getModule } from '../../../config/modules'
import {
  calculateDerivedStats,
  canChooseGeneralSkill,
  getFinalAttributes,
  getFinalSkillValues,
  getFreeSkillBonusSlots,
  getFreeSkillBonusTotal,
  getGeneralSkillRequirements,
  getWizardSteps,
  meetsGeneralSkillRequirements,
} from '../../../lib/characterRules'
import { useCharacterStore } from '../../../store/useCharacterStore'
import { Button } from '../../ui/Button'
import { StepHeader } from '../StepHeader'
import { WizardFooter } from '../WizardFooter'

export function GeneralSkillsStep() {
  const draft = useCharacterStore((state) => state.draft)
  const stepIndex = useCharacterStore((state) => state.stepIndex)
  const addGeneralSkill = useCharacterStore((state) => state.addGeneralSkill)
  const removeGeneralSkill = useCharacterStore(
    (state) => state.removeGeneralSkill,
  )
  const nextStep = useCharacterStore((state) => state.nextStep)
  const previousStep = useCharacterStore((state) => state.previousStep)

  const rules = getModule(draft.moduleId)
  const step = getWizardSteps(draft, rules)[stepIndex]
  const { maxChoices } = rules.generalSkillRules
  const chosen = draft.generalSkills
  const remainingChoices = Math.max(0, maxChoices - chosen.length)
  const freeBonusSlots = getFreeSkillBonusSlots(chosen.length, rules)
  const freeBonusTotal = getFreeSkillBonusTotal(chosen.length, rules)
  const freeSlotBonus = rules.generalSkillRules.freeSlotBonusPerSlot
  const isFull = chosen.length >= maxChoices

  const finalAttributes = getFinalAttributes(draft, rules)
  const finalSkills = getFinalSkillValues(draft, rules)
  const derived = calculateDerivedStats(finalAttributes, rules)
  const invalidChosen = chosen.filter(
    (skill) =>
      !meetsGeneralSkillRequirements(skill, rules, finalAttributes, finalSkills),
  )

  const spentStamina = chosen
    .filter((skill) => skill.resource === 'estamina')
    .reduce((total, skill) => total + skill.cost, 0)
  const spentEnergy = chosen
    .filter((skill) => skill.resource === 'energia')
    .reduce((total, skill) => total + skill.cost, 0)

  return (
    <section aria-labelledby="step-title">
      <StepHeader
        eyebrow={`${rules.name} · Etapa 0${stepIndex + 1}`}
        title={step.title}
        description={step.description}
      />

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          nextStep()
        }}
        className="space-y-6"
      >
        <div className="panel">
          <div className="grid grid-cols-1 divide-y divide-gray-300 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="p-4">
              <p className="label-micro">Escolhidas</p>
              <p className="mt-1 font-mono text-2xl leading-none">
                {chosen.length}/{maxChoices}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-gray-500">
                habilidades gerais
              </p>
            </div>
            <div className="p-4">
              <p className="label-micro">Vagas livres</p>
              <p
                className={`mt-1 font-mono text-2xl leading-none ${
                  remainingChoices === 0 ? '' : 'text-navy-blue'
                }`}
              >
                {remainingChoices}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-gray-500">
                não preenchidas
              </p>
            </div>
            <div className="p-4">
              <p className="label-micro">Bônus em perícias</p>
              <p className="mt-1 font-mono text-2xl leading-none text-navy-blue">
                +{freeBonusTotal}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-gray-500">
                +{freeSlotBonus} por vaga livre · {freeBonusSlots} vaga(s)
              </p>
            </div>
          </div>
          <div aria-hidden="true" className="h-1.5 bg-gray-100">
            <div
              className="h-full bg-navy-blue transition-all duration-150"
              style={{
                width: `${Math.min(100, (chosen.length / maxChoices) * 100)}%`,
              }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-gray-300 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">
            <span>
              Custo escolhido: {spentStamina} ST · {spentEnergy} EM
            </span>
            <span>
              Reservas: {derived.estamina} ST · {derived.energia} EM
            </span>
          </div>
        </div>

        {invalidChosen.length > 0 ? (
          <p
            role="alert"
            className="border border-navy-blue bg-navy-blue-50 px-3 py-2 text-xs text-navy-blue"
          >
            {invalidChosen.length} habilidade(s) escolhida(s) deixaram de cumprir
            os pré-requisitos após a alteração de atributos:{' '}
            {invalidChosen.map((skill) => skill.label).join(', ')}. Remova ou
            ajuste os atributos e as perícias para continuar.
          </p>
        ) : null}

        {rules.generalSkillCategories.map((category) => {
          const items = rules.generalSkills.filter(
            (skill) => skill.category === category.id,
          )
          if (items.length === 0) return null

          return (
            <section
              key={category.id}
              aria-labelledby={`general-skill-${category.id}`}
            >
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <div>
                  <h3
                    id={`general-skill-${category.id}`}
                    className="text-sm font-semibold"
                  >
                    Habilidades {category.label}
                  </h3>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    {category.description} Custo em {category.abbreviation}.
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.18em] text-gray-400">
                  {items.length} no catálogo
                </span>
              </div>

              <ul className="grid gap-3 sm:grid-cols-2">
                {items.map((skill) => {
                  const isChosen = chosen.some((entry) => entry.id === skill.id)
                  const requirements = getGeneralSkillRequirements(
                    skill,
                    rules,
                    finalAttributes,
                    finalSkills,
                  )
                  const meetsRequirements = meetsGeneralSkillRequirements(
                    skill,
                    rules,
                    finalAttributes,
                    finalSkills,
                  )
                  const canChoose = canChooseGeneralSkill(skill, draft, rules)
                  const isBlocked = !isChosen && !canChoose
                  const blockReason = isFull
                    ? `Limite de ${maxChoices} escolhas atingido.`
                    : 'Pré-requisitos não atingidos.'

                  return (
                    <li
                      key={skill.id}
                      className={`flex h-full flex-col justify-between gap-3 border p-3 ${
                        isChosen
                          ? 'border-navy-blue bg-navy-blue-50'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold leading-snug">
                            {skill.label}
                          </p>
                          <span className="shrink-0 border border-gray-300 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-600">
                            {skill.cost} {category.abbreviation}
                          </span>
                        </div>
                        {skill.costNote ? (
                          <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-400">
                            + {skill.costNote}
                          </p>
                        ) : null}
                        <p className="mt-1.5 text-[11px] leading-snug text-gray-500">
                          {skill.description}
                        </p>
                        <p className="mt-1.5 font-mono text-[9px] uppercase leading-relaxed tracking-[0.1em] text-navy-blue">
                          {skill.effect}
                        </p>

                        {requirements.length > 0 ? (
                          <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                            {requirements.map((status) => (
                              <li
                                key={`${skill.id}-${status.label}`}
                                className={`font-mono text-[9px] uppercase tracking-[0.1em] ${
                                  status.met ? 'text-navy-blue' : 'text-gray-400'
                                }`}
                              >
                                {status.met ? '✓' : '✕'}{' '}
                                {status.alternative ? 'OU ' : ''}
                                {status.label} {status.current}/{status.required}
                              </li>
                            ))}
                          </ul>
                        ) : null}

                        {!meetsRequirements ? (
                          <p className="mt-2 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-400">
                            <Lock className="h-3 w-3" aria-hidden="true" />
                            pré-requisito bloqueado
                          </p>
                        ) : null}
                      </div>

                      {isChosen ? (
                        <Button
                          variant="secondary"
                          onClick={() => removeGeneralSkill(skill.id)}
                          aria-label={`Remover ${skill.label}`}
                          className="w-full px-2 py-1.5 text-[10px]"
                          icon={<X className="h-3 w-3" aria-hidden="true" />}
                        >
                          Remover
                        </Button>
                      ) : (
                        <Button
                          variant={isBlocked ? 'ghost' : 'primary'}
                          onClick={() => addGeneralSkill(skill)}
                          disabled={isBlocked}
                          aria-label={`Escolher ${skill.label}`}
                          title={isBlocked ? blockReason : undefined}
                          className="w-full px-2 py-1.5 text-[10px]"
                          icon={
                            isBlocked ? (
                              <Lock className="h-3 w-3" aria-hidden="true" />
                            ) : (
                              <Plus className="h-3 w-3" aria-hidden="true" />
                            )
                          }
                        >
                          {isBlocked ? 'Indisponível' : 'Escolher'}
                        </Button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}


        <section>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-semibold">Habilidades escolhidas</h3>
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-400">
              {chosen.length}/{maxChoices}
            </span>
          </div>

          {chosen.length > 0 ? (
            <ul className="divide-y divide-gray-200 border border-gray-300">
              {chosen.map((skill) => (
                <li
                  key={skill.id}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">{skill.label}</p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-400">
                      {skill.cost}{' '}
                      {skill.resource === 'estamina' ? 'ST' : 'EM'} ·{' '}
                      {skill.category === 'physical' ? 'Física' : 'Mental'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Check
                      className="h-3.5 w-3.5 text-navy-blue"
                      aria-hidden="true"
                    />
                    <Button
                      variant="ghost"
                      onClick={() => removeGeneralSkill(skill.id)}
                      aria-label={`Remover ${skill.label}`}
                      className="px-1.5 py-1"
                      icon={<X className="h-3 w-3" aria-hidden="true" />}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="border border-gray-300 p-4 text-xs text-gray-500">
              Nenhuma habilidade escolhida. As {freeBonusSlots} vagas livres
              somam +{freeBonusTotal} pontos a distribuir em perícias na etapa
              seguinte.
            </p>
          )}
        </section>

        <WizardFooter
          onBack={previousStep}
          nextLabel={
            freeBonusSlots > 0
              ? 'Avançar para bônus de vagas'
              : 'Avançar para âncoras'
          }
          hint={
            remainingChoices > 0
              ? `${remainingChoices} vaga(s) livre(s) geram +${freeBonusTotal} pontos de perícia na próxima etapa.`
              : 'Limite de habilidades atingido. A etapa de bônus é dispensada — avance para as âncoras.'
          }
        />
      </form>
    </section>
  )
}

