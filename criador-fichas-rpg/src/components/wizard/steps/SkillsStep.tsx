import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { getModule } from '../../../config/modules'
import {
  applyAttributeBonuses,
  getArchetype,
  getDraftProfession,
  getGeneralSkillPoolBonus,
  getProfessionSkillId,
  getRemainingSkillPoints,
  getSkillBaseValues,
  getSkillCaps,
  getSkillPoolBonus,
  getSpentSkillPoints,
  getTotalSkillPool,
} from '../../../lib/characterRules'
import {
  createSkillsSchema,
  type SkillsFormValues,
} from '../../../lib/validation'
import { useCharacterStore } from '../../../store/useCharacterStore'
import { SkillDistribution } from '../SkillDistribution'
import { StepHeader } from '../StepHeader'
import { WizardFooter } from '../WizardFooter'

export function SkillsStep() {
  const draft = useCharacterStore((state) => state.draft)
  const stepIndex = useCharacterStore((state) => state.stepIndex)
  const setSkills = useCharacterStore((state) => state.setSkills)
  const nextStep = useCharacterStore((state) => state.nextStep)
  const previousStep = useCharacterStore((state) => state.previousStep)

  const rules = getModule(draft.moduleId)
  const step = rules.steps[stepIndex]
  const archetype = getArchetype(rules, draft.archetypeId)
  const profession = getDraftProfession(draft, rules)
  const professionSkillId = getProfessionSkillId(
    profession,
    draft.professionSkillChoice,
  )
  const professionBonus = profession?.bonusValue ?? 0
  const professionSkillLabel = professionSkillId
    ? (rules.skills.find((skill) => skill.id === professionSkillId)?.label ??
      professionSkillId)
    : null
  const baseSkills = rules.skills.filter((skill) => skill.category === 'base')
  const moduleSkills = rules.skills.filter(
    (skill) => skill.category === 'module',
  )

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SkillsFormValues>({
    resolver: zodResolver(
      createSkillsSchema(rules, archetype, draft.generalSkills.length),
    ),
    defaultValues: draft.skills,
    mode: 'onChange',
  })

  const skills = useWatch({ control }) as SkillsFormValues
  const finalAttributes = applyAttributeBonuses(
    rules,
    draft.attributes,
    archetype,
    profession,
    draft.professionAttributeChoice,
  )
  const baseValues = getSkillBaseValues(rules, finalAttributes)
  const caps = getSkillCaps(rules, archetype)
  const spent = getSpentSkillPoints(skills)
  const totalPool = getTotalSkillPool(skills, rules, draft.generalSkills.length)
  const poolBonus = getSkillPoolBonus(skills, rules)
  const generalSkillBonus = getGeneralSkillPoolBonus(
    draft.generalSkills.length,
    rules,
  )
  const remaining = getRemainingSkillPoints(
    skills,
    rules,
    draft.generalSkills.length,
  )
  const spentPercent = Math.min(
    100,
    Math.max(0, totalPool > 0 ? (spent / totalPool) * 100 : 0),
  )
  const firstSkillId = rules.skills[0]?.id
  const poolError = firstSkillId ? errors[firstSkillId]?.message : undefined

  const onSubmit = handleSubmit((values) => {
    setSkills(values)
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
          <div className="grid grid-cols-1 divide-y divide-gray-300 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
            <div className="p-4">
              <p className="label-micro">Pool disponível</p>
              <p
                className={`mt-1 font-mono text-2xl leading-none ${
                  totalPool > rules.skillRules.pool ? 'text-navy-blue' : ''
                }`}
              >
                {totalPool}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-gray-500">
                base {rules.skillRules.pool} · habilidades +{generalSkillBonus}
              </p>
            </div>
            <div className="p-4">
              <p className="label-micro">Bônus conquistado</p>
              <p className="mt-1 font-mono text-2xl leading-none text-navy-blue">
                +{poolBonus}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-gray-500">
                +{rules.skillRules.bonusAtMax} por perícia no teto{' '}
                {rules.skillRules.maxRank}
              </p>
            </div>
            <div className="p-4">
              <p className="label-micro">Investidos</p>
              <p className="mt-1 font-mono text-2xl leading-none">{spent}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-gray-500">
                de {totalPool} pontos disponíveis
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

        {poolError ? (
          <p
            role="alert"
            className="border border-navy-blue bg-navy-blue-50 px-3 py-2 text-xs text-navy-blue"
          >
            {poolError}
          </p>
        ) : null}

        {archetype ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border border-gray-300 p-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-gray-500">
              Arquétipo
            </span>
            <span className="text-xs font-medium">{archetype.label}</span>
            <span className="text-[11px] text-gray-500">
              Bônus de perícia aparecem como marcação adicional.
            </span>
          </div>
        ) : null}

        {profession ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border border-gray-300 p-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-gray-500">
              Profissão
            </span>
            <span className="text-xs font-medium">{profession.label}</span>
            {professionSkillLabel ? (
              <span className="text-[11px] text-gray-500">
                +{professionBonus} em {professionSkillLabel} (valor final, fora
                do pool)
              </span>
            ) : null}
          </div>
        ) : null}

        <section>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-semibold">Perícias base</h3>
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-400">
              comuns a todos os módulos
            </span>
          </div>
          <SkillDistribution
            control={control}
            skills={baseSkills}
            attributes={rules.attributes}
            baseValues={baseValues}
            caps={caps}
            bonusThreshold={rules.skillRules.maxRank}
            bonusAtMax={rules.skillRules.bonusAtMax}
            remaining={remaining}
            archetype={archetype}
            professionSkillId={professionSkillId}
            professionBonus={professionBonus}
          />
        </section>

        <section>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-semibold">Perícias · {rules.name}</h3>
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-400">
              específicas do módulo
            </span>
          </div>
          <SkillDistribution
            control={control}
            skills={moduleSkills}
            attributes={rules.attributes}
            baseValues={baseValues}
            caps={caps}
            bonusThreshold={rules.skillRules.maxRank}
            bonusAtMax={rules.skillRules.bonusAtMax}
            remaining={remaining}
            archetype={archetype}
            professionSkillId={professionSkillId}
            professionBonus={professionBonus}
          />
        </section>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border border-gray-300 p-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-gray-500">
              Habilidades gerais
            </span>
            <span className="text-xs font-medium">
              {draft.generalSkills.length}/
              {rules.generalSkillRules.maxChoices} escolhidas
            </span>
            <span className="text-[11px] text-gray-500">
              +{generalSkillBonus} pontos de pool por vagas não preenchidas.
            </span>
          </div>

        <WizardFooter
          onBack={previousStep}
          nextLabel="Avançar para âncoras"
          hint={
            remaining === 0
              ? 'Pool completo. Avance para distribuir as âncoras.'
              : remaining > 0
                ? `Ainda restam ${remaining} ponto(s) de perícia para distribuir.`
                : `Excedeu o pool em ${Math.abs(remaining)} ponto(s). Reduza os investimentos antes de avançar.`
          }
        />
      </form>
    </section>
  )
}
