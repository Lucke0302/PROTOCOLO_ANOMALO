import { Check, Sparkles } from 'lucide-react'
import { getModule } from '../../../config/modules'
import {
  getFinalSkillValues,
  getFreeSkillBonuses,
  getFreeSkillBonusIssues,
  getFreeSkillBonusRemaining,
  getFreeSkillBonusSlots,
  getFreeSkillBonusTotal,
  getWizardSteps,
} from '../../../lib/characterRules'
import { createFreeSkillBonusSchema } from '../../../lib/validation'
import { useCharacterStore } from '../../../store/useCharacterStore'
import type { SkillId } from '../../../types/character'
import { StepHeader } from '../StepHeader'
import { WizardFooter } from '../WizardFooter'

export function FreeSkillBonusStep() {
  const draft = useCharacterStore((state) => state.draft)
  const stepIndex = useCharacterStore((state) => state.stepIndex)
  const setFreeSkillBonusPick = useCharacterStore(
    (state) => state.setFreeSkillBonusPick,
  )
  const nextStep = useCharacterStore((state) => state.nextStep)
  const previousStep = useCharacterStore((state) => state.previousStep)

  const rules = getModule(draft.moduleId)
  const step = getWizardSteps(draft, rules)[stepIndex]
  const { maxChoices, freeSlotBonusPerSlot } = rules.generalSkillRules
  const slots = getFreeSkillBonusSlots(draft.generalSkills.length, rules)
  const totalBonus = getFreeSkillBonusTotal(draft.generalSkills.length, rules)
  const picks = draft.freeSkillBonusPicks
  const remainingSlots = Math.max(0, slots - picks.length)
  const finalSkills = getFinalSkillValues(draft, rules)
  const bonuses = getFreeSkillBonuses(picks, rules)
  const distributedBonus = picks.length * freeSlotBonusPerSlot
  const skillLabel = (skillId: SkillId): string =>
    rules.skills.find((skill) => skill.id === skillId)?.label ?? skillId

  const issues = getFreeSkillBonusIssues(draft, rules)
  const isComplete = issues.length === 0
  const schema = createFreeSkillBonusSchema(rules, draft)

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
          if (!schema.safeParse({ picks }).success) return
          nextStep()
        }}
        className="space-y-6"
      >
        <div className="panel">
          <div className="grid grid-cols-1 divide-y divide-gray-300 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="p-4">
              <p className="label-micro">Vagas livres</p>
              <p className="mt-1 font-mono text-2xl leading-none">{slots}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-gray-500">
                {draft.generalSkills.length}/{maxChoices} habilidades escolhidas
              </p>
            </div>
            <div className="p-4">
              <p className="label-micro">Bônus disponível</p>
              <p className="mt-1 font-mono text-2xl leading-none text-navy-blue">
                +{totalBonus}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-gray-500">
                +{freeSlotBonusPerSlot} por perícia
              </p>
            </div>
            <div className="p-4">
              <p className="label-micro">Distribuído</p>
              <p
                className={`mt-1 font-mono text-2xl leading-none ${
                  isComplete ? 'text-navy-blue' : ''
                }`}
              >
                +{distributedBonus}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-gray-500">
                {remainingSlots === 0
                  ? 'distribuição exata'
                  : `${remainingSlots} vaga(s) em aberto`}
              </p>
            </div>
          </div>
          <div aria-hidden="true" className="h-1.5 bg-gray-100">
            <div
              className="h-full bg-navy-blue transition-all duration-150"
              style={{
                width: `${slots > 0 ? Math.min(100, (picks.length / slots) * 100) : 100}%`,
              }}
            />
          </div>
          <p className="border-t border-gray-300 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">
            Bônus aplicado ao valor final, fora do pool e respeitando o teto
            vigente da perícia
          </p>
        </div>
        {slots === 0 ? (
          <p className="border border-gray-300 p-4 text-xs text-gray-500">
            Todas as vagas de habilidade foram preenchidas. Nenhum bônus de
            perícia disponível — avance para as âncoras.
          </p>
        ) : (
          <section aria-labelledby="free-skill-bonus-title">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h3 id="free-skill-bonus-title" className="text-sm font-semibold">
                Escolha das perícias bonificadas
              </h3>
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-400">
                {picks.length}/{slots} definidas
              </span>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: slots }, (_, index) => {
                const selected = picks[index]
                const isLocked = index > picks.length
                const remaining = getFreeSkillBonusRemaining(
                  draft,
                  rules,
                  index,
                )

                return (
                  <li key={`free-slot-${index}`} className="panel p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-gray-500">
                        <Sparkles className="h-3 w-3" aria-hidden="true" />
                        Vaga 0{index + 1}
                      </span>
                      <span className="border border-gray-300 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-500">
                        +{freeSlotBonusPerSlot}
                      </span>
                    </div>

                    <label
                      htmlFor={`free-slot-${index}`}
                      className="label-micro"
                    >
                      Perícia bonificada
                    </label>
                    <select
                      id={`free-slot-${index}`}
                      value={selected ?? ''}
                      disabled={isLocked}
                      onChange={(event) =>
                        setFreeSkillBonusPick(
                          index,
                          event.target.value === ''
                            ? null
                            : (event.target.value as SkillId),
                        )
                      }
                      className="mt-1.5 w-full border border-gray-300 bg-white px-2.5 py-2 text-sm outline-none transition-colors focus:border-navy-blue focus:ring-1 focus:ring-navy-blue disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <option value="">Escolha uma perícia</option>
                      {rules.skills.map((skill) => {
                        const isCurrent = selected === skill.id
                        const canReceive =
                          remaining[skill.id] >= freeSlotBonusPerSlot

                        return (
                          <option
                            key={skill.id}
                            value={skill.id}
                            disabled={!isCurrent && !canReceive}
                          >
                            {skill.label} · valor final {finalSkills[skill.id]}
                            {!isCurrent && !canReceive ? ' · teto atingido' : ''}
                          </option>
                        )
                      })}
                    </select>

                    {selected ? (
                      <p className="mt-2 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-navy-blue">
                        <Check className="h-3 w-3" aria-hidden="true" />
                        {skillLabel(selected)} {finalSkills[selected]} ·{' '}
                        {bonuses[selected]} de vaga
                      </p>
                    ) : (
                      <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-400">
                        {isLocked
                          ? 'Defina a vaga anterior primeiro'
                          : 'Vaga em aberto'}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {issues.length > 0 && slots > 0 ? (
          <p
            role="alert"
            className="border border-navy-blue bg-navy-blue-50 px-3 py-2 text-xs text-navy-blue"
          >
            {issues[0]}
          </p>
        ) : null}

        {picks.length > 0 ? (
          <section aria-labelledby="free-skill-bonus-summary">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h3 id="free-skill-bonus-summary" className="text-sm font-semibold">
                Bônus aplicados
              </h3>
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-400">
                +{distributedBonus} pontos
              </span>
            </div>
            <ul className="divide-y divide-gray-200 border border-gray-300">
              {rules.skills
                .filter((skill) => bonuses[skill.id] > 0)
                .map((skill) => (
                  <li
                    key={skill.id}
                    className="flex items-center justify-between gap-4 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm">{skill.label}</p>
                      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-400">
                        valor final {finalSkills[skill.id]} · sem bônus{' '}
                        {finalSkills[skill.id] - bonuses[skill.id]}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-lg leading-none text-navy-blue">
                      +{bonuses[skill.id]}
                    </span>
                  </li>
                ))}
            </ul>
          </section>
        ) : null}

        <WizardFooter
          onBack={previousStep}
          nextLabel="Avançar para âncoras"
          nextDisabled={!isComplete}
          hint={
            isComplete
              ? 'Bônus distribuído. Avance para montar as âncoras pessoais.'
              : issues[0] ??
                `Faltam ${remainingSlots} perícia(s) para receber o bônus de cada vaga livre.`
          }
        />
      </form>
    </section>
  )
}
