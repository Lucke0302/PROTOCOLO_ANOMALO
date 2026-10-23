import { ArrowLeft, Download, Printer, RotateCcw } from 'lucide-react'
import { getModule } from '../../../config/modules'
import {
  buildCharacterSheet,
  getAnchorPointsTotal,
  getFreeSkillBonuses,
  getFreeSkillBonusTotal,
  getProfessionRequirementStatus,
  getSkillBaseValues,
  getTotalAttributeBonus,
  getTotalSkillPool,
  getWizardSteps,
} from '../../../lib/characterRules'
import { useCharacterStore } from '../../../store/useCharacterStore'
import { Button } from '../../ui/Button'
import { DerivedStatsPanel } from '../DerivedStatsPanel'
import { StepHeader } from '../StepHeader'

function slugify(value: string): string {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'ficha'
}

export function ReviewStep() {
  const draft = useCharacterStore((state) => state.draft)
  const stepIndex = useCharacterStore((state) => state.stepIndex)
  const previousStep = useCharacterStore((state) => state.previousStep)
  const resetDraft = useCharacterStore((state) => state.resetDraft)

  const rules = getModule(draft.moduleId)
  const step = getWizardSteps(draft, rules)[stepIndex]
  const sheet = buildCharacterSheet(draft, rules)
  const baseSkillValues = getSkillBaseValues(rules, sheet.attributes)
  const freeSkillBonuses = getFreeSkillBonuses(sheet.freeSkillBonusPicks, rules)

  const investedSkills = rules.skills
    .map((definition) => ({
      definition,
      total: sheet.skills[definition.id],
      base: baseSkillValues[definition.id],
      invested: draft.skills[definition.id],
      bonus: sheet.archetype?.skillBonuses?.[definition.id] ?? 0,
      professionBonus:
        sheet.professionSkillId === definition.id
          ? sheet.professionSkillBonus
          : 0,
      freeBonus: freeSkillBonuses[definition.id],
    }))
    .filter(
      (entry) =>
        entry.invested > 0 ||
        entry.bonus > 0 ||
        entry.professionBonus > 0 ||
        entry.freeBonus > 0,
    )
    .sort(
      (a, b) =>
        b.total - a.total ||
        a.definition.label.localeCompare(b.definition.label, 'pt-BR'),
    )

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(sheet, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${slugify(sheet.name)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    const previousTitle = document.title

    // O cabeçalho de cada página impressa usa o <title>: limpar antes do
    // disparo e restaurar logo depois mantém a aba intacta e o PDF limpo.
    document.title = ''

    try {
      window.print()
    } finally {
      document.title = previousTitle
    }
  }

  const handleReset = () => {
    if (window.confirm('Descartar a ficha atual e iniciar uma nova?')) {
      resetDraft()
    }
  }

  return (
    <section aria-labelledby="step-title">
      <div className="no-print">
        <StepHeader
          eyebrow={`${rules.name} · Etapa 0${stepIndex + 1}`}
          title={step.title}
          description={step.description}
        />
      </div>

      <div className="panel p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="label-micro">Ficha de personagem</p>
            <h3 className="mt-1 text-2xl font-semibold tracking-tight">
              {sheet.name}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {sheet.archetype?.label ?? 'Sem arquétipo'} · {rules.name}
            </p>
            {sheet.profession ? (
              <>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-navy-blue">
                  Profissão · {sheet.profession.label}
                </p>
                {sheet.professionAttribute ? (
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">
                    Atributo principal ·{' '}
                    {rules.attributes.find(
                      (attribute) =>
                        attribute.key === sheet.professionAttribute,
                    )?.label ?? sheet.professionAttribute}{' '}
                    (+{sheet.professionAttributeBonus} fora do pool)
                  </p>
                ) : null}
              </>
            ) : null}
            {sheet.presenceReason ? (
              <p className="mt-2 max-w-xl text-xs leading-relaxed text-gray-600">
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-400">
                  Motivo de presença ·{' '}
                </span>
                {sheet.presenceReason}
              </p>
            ) : null}
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">
              Atributos {sheet.spentAttributePoints}/
              {rules.attributeRules.pool} · Perícias {sheet.spentSkillPoints}/
              {getTotalSkillPool(draft.skills, rules, sheet.attributes)} · Habilidades{' '}
              {sheet.generalSkills.length}/
              {rules.generalSkillRules.maxChoices} · Bônus vagas +{sheet.freeSkillBonusPicks.length * rules.generalSkillRules.freeSlotBonusPerSlot}{' '}
              · Âncoras {getAnchorPointsTotal(sheet.anchors)}/
              {sheet.anchorPool} · Carga {sheet.carry.usedSlots}/
              {sheet.carry.maxSlots}
            </p>
            {sheet.archetype ? (
              <p className="mt-3 max-w-xl text-xs leading-relaxed text-gray-500">
                {sheet.archetype.description}
              </p>
            ) : null}
          </div>

          <div className="no-print flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={handleExport}
              icon={<Download className="h-3.5 w-3.5" aria-hidden="true" />}
            >
              Exportar JSON
            </Button>
            <Button
              variant="secondary"
              onClick={handlePrint}
              icon={<Printer className="h-3.5 w-3.5" aria-hidden="true" />}
            >
              Imprimir
            </Button>
          </div>
        </div>
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-semibold">Derivados</h3>
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-400">
            valores finais
          </span>
        </div>
        <DerivedStatsPanel
          rules={rules}
          derived={sheet.derived}
          generalSkills={sheet.generalSkills}
          anchors={sheet.anchors}
          anchorPool={sheet.anchorPool}
        />
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-semibold">Atributos finais</h3>
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-400">
            distribuído + arquétipo
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {rules.attributes.map((definition) => {
            const bonus = getTotalAttributeBonus(
              sheet.archetype,
              sheet.profession,
              draft.professionAttributeChoice,
              definition.key,
            )

            return (
              <div key={definition.key} className="panel p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="label-micro">{definition.abbreviation}</span>
                  {bonus > 0 ? (
                    <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-navy-blue">
                      +{bonus}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 font-mono text-3xl font-semibold leading-none">
                  {sheet.attributes[definition.key]}
                </p>
                <p className="mt-2 text-xs font-medium">{definition.label}</p>
                <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-400">
                  distribuído {draft.attributes[definition.key]}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {sheet.archetype?.id === 'civil' ? (
      <section className="mt-6">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-semibold">Profissão civil</h3>
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-400">
            bônus fora do pool
          </span>
        </div>

        {sheet.profession ? (
          <div className="panel p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em]">
                  {sheet.profession.label}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">
                  {sheet.profession.summary}
                </p>
                <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-500">
                  {(() => {
                    const status = getProfessionRequirementStatus(
                      sheet.profession,
                      draft.professionAttributeChoice,
                      rules.attributes,
                      sheet.attributes,
                    )
                    if (!status) return 'Atributo principal não definido'

                    return `${status.label} ${status.current}/${status.required} · ${
                      status.met ? 'requisito atendido' : 'requisito pendente'
                    }${sheet.professionAttributeBonus > 0 ? ` · bônus +${sheet.professionAttributeBonus} aplicado` : ''}`
                  })()}
                </p>
              </div>

              <div className="shrink-0 border-t border-gray-200 pt-3 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                <p className="label-micro">Perícia bonificada</p>
                <p className="mt-1 text-sm font-medium">
                  {sheet.professionSkillId
                    ? (rules.skills.find(
                        (skill) => skill.id === sheet.professionSkillId,
                      )?.label ?? sheet.professionSkillId)
                    : 'Não definida'}
                </p>
                <p className="mt-1 font-mono text-lg leading-none text-navy-blue">
                  +{sheet.professionSkillBonus}
                </p>
              </div>
            </div>

            <div className="mt-4 border-t border-gray-200 pt-3">
              <p className="label-micro">Itens iniciais imutáveis</p>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-500">
                {sheet.profession.initialEquipmentIds
                  .map(
                    (id) =>
                      rules.equipmentCatalog.find((item) => item.id === id)
                        ?.label ?? id,
                  )
                  .join(' · ')}
              </p>
            </div>
          </div>
        ) : (
          <p className="border border-gray-300 p-4 text-xs text-gray-500">
            Nenhuma profissão civil registrada para este personagem.
          </p>
        )}
      </section>
      ) : null}

      <section className="mt-6">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-semibold">Perícias</h3>
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-400">
            valores finais
          </span>
        </div>

        {investedSkills.length > 0 ? (
          <ul className="divide-y divide-gray-200 border border-gray-300">
            {investedSkills.map(
              ({
                definition,
                total,
                base,
                invested,
                bonus,
                professionBonus,
                freeBonus,
              }) => (
              <li
                key={definition.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm">{definition.label}</p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-400">
                    {definition.category === 'base' ? 'Base' : rules.name} · base{' '}
                    {base} · investido {invested}
                  </p>
                </div>
                <div className="flex shrink-0 items-baseline gap-2">
                  {bonus > 0 ? (
                    <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-navy-blue">
                      +{bonus} arq.
                    </span>
                  ) : null}
                  {professionBonus > 0 ? (
                    <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-navy-blue">
                      +{professionBonus} prof.
                    </span>
                  ) : null}
                  {freeBonus > 0 ? (
                    <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-navy-blue">
                      +{freeBonus} vaga
                    </span>
                  ) : null}
                  <span className="font-mono text-lg leading-none">{total}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="border border-gray-300 p-4 text-xs text-gray-500">
            Nenhuma perícia recebeu pontos.
          </p>
        )}
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-semibold">Habilidades gerais</h3>
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-400">
            {sheet.generalSkills.length}/{rules.generalSkillRules.maxChoices}{' '}
            escolhidas · +
            {getFreeSkillBonusTotal(sheet.generalSkills.length, rules)} em
            perícias
          </span>
        </div>

        {sheet.generalSkills.length > 0 ? (
          <ul className="divide-y divide-gray-200 border border-gray-300">
            {sheet.generalSkills.map((skill) => {
              const category = rules.generalSkillCategories.find(
                (definition) => definition.id === skill.category,
              )

              return (
                <li
                  key={skill.id}
                  className="flex items-start justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">{skill.label}</p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-400">
                      {category?.label ?? skill.category} · {skill.cost}{' '}
                      {skill.resource === 'estamina' ? 'ST' : 'EM'}
                      {skill.costNote ? ` · ${skill.costNote}` : ''}
                    </p>
                    <p className="mt-1 text-[11px] leading-snug text-gray-500">
                      {skill.effect}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-lg leading-none text-navy-blue">
                    {skill.cost}
                  </span>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="border border-gray-300 p-4 text-xs text-gray-500">
            Nenhuma habilidade geral escolhida. As vagas livres viraram bônus
            direto em perícias.
          </p>
        )}
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-semibold">Bônus de vagas livres</h3>
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-400">
            +{getFreeSkillBonusTotal(sheet.generalSkills.length, rules)} pontos
            · fora do pool, respeitando o teto
          </span>
        </div>

        {sheet.freeSkillBonusPicks.length > 0 ? (
          <ul className="divide-y divide-gray-200 border border-gray-300">
            {sheet.freeSkillBonusPicks.map((skillId, index) => (
              <li
                key={`${skillId}-${index}`}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm">
                    {rules.skills.find((skill) => skill.id === skillId)?.label ??
                      skillId}
                  </p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-400">
                    vaga 0{index + 1} · valor final {sheet.skills[skillId]}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-lg leading-none text-navy-blue">
                  +{rules.generalSkillRules.freeSlotBonusPerSlot}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="border border-gray-300 p-4 text-xs text-gray-500">
            Nenhuma vaga livre: as duas habilidades gerais foram escolhidas.
          </p>
        )}
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-semibold">Âncoras pessoais</h3>
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-400">
            {getAnchorPointsTotal(sheet.anchors)}/{sheet.anchorPool} pontos
          </span>
        </div>

        <ul className="divide-y divide-gray-200 border border-gray-300">
          {sheet.anchors.map((anchor) => (
            <li
              key={anchor.id}
              className="flex items-start justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm">{anchor.name || 'Sem nome'}</p>
                {anchor.description ? (
                  <p className="mt-1 text-[11px] leading-snug text-gray-500">
                    {anchor.description}
                  </p>
                ) : null}
              </div>
              <span className="shrink-0 font-mono text-lg leading-none">
                {anchor.points}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border border-gray-300 p-3 font-mono text-[9px] uppercase tracking-[0.12em] text-gray-500">
          <span>
            {rules.attributes.find(
              (attribute) => attribute.key === rules.anchorRules.attribute,
            )?.abbreviation ?? 'Atributo'}{' '}
            {sheet.attributes[rules.anchorRules.attribute]}
          </span>
          <span>+ {rules.anchorRules.basePoints} base</span>
          <span>Total {sheet.anchorPool}</span>
          <span className="text-navy-blue">
            mínimo {rules.anchorRules.minPerAnchor} por âncora
          </span>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-semibold">Equipamentos & inventário</h3>
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-400">
            {sheet.carry.usedSlots}/{sheet.carry.maxSlots} slots
          </span>
        </div>

        {sheet.equipments.length > 0 ? (
          <ul className="divide-y divide-gray-200 border border-gray-300">
            {sheet.equipments.map((item) => {
              const category = rules.equipmentCategories.find(
                (definition) => definition.id === item.category,
              )
              const isGranted =
                sheet.profession?.initialEquipmentIds.includes(item.id) ?? false

              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">{item.label}</p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-400">
                      {category?.label ?? item.category} · {item.slotCost} slot
                      {item.slotCost === 1 ? '' : 's'}
                      {isGranted ? (
                        <span className="text-navy-blue"> · profissão</span>
                      ) : null}
                    </p>
                    {item.effect ? (
                      <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-navy-blue">
                        {item.effect}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 font-mono text-lg leading-none">
                    {item.slotCost}
                  </span>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="border border-gray-300 p-4 text-xs text-gray-500">
            Nenhum equipamento carregado.
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border border-gray-300 p-3 font-mono text-[9px] uppercase tracking-[0.12em] text-gray-500">
          <span>Slots base {sheet.carry.baseSlots}</span>
          <span>Modificador +{sheet.carry.bonusSlots}</span>
          <span>Capacidade {sheet.carry.maxSlots}</span>
          <span className="text-navy-blue">
            Ocupado {sheet.carry.usedSlots}/{sheet.carry.maxSlots}
          </span>
          {sheet.profession ? <span>Itens da profissão são imutáveis</span> : null}
        </div>
      </section>

      <div className="no-print mt-8 flex flex-col gap-4 border-t border-gray-300 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="secondary"
          onClick={previousStep}
          icon={<ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />}
        >
          Voltar
        </Button>
        <Button
          variant="ghost"
          onClick={handleReset}
          icon={<RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />}
        >
          Nova ficha
        </Button>
      </div>
    </section>
  )
}
