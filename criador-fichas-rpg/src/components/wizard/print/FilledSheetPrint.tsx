import { getAnchorPointsTotal, getFreeSkillBonusTotal, getSkillBaseValues } from '../../../lib/characterRules'
import type {
  AttributeKey,
  CharacterDraft,
  CharacterSheet,
  ModuleRules,
} from '../../../types/character'

interface FilledSheetPrintProps {
  rules: ModuleRules
  sheet: CharacterSheet
  draft: CharacterDraft
}

/** Abreviação do atributo (FIS/DES/INT/PSI) a partir das regras do módulo. */
function getAttributeAbbreviation(
  rules: ModuleRules,
  key: AttributeKey,
): string {
  return (
    rules.attributes.find((attribute) => attribute.key === key)
      ?.abbreviation ?? key
  )
}

/**
 * Documento compacto de impressão da ficha preenchida: exatamente 2 folhas A4.
 * Folha 1 = identidade, derivados, atributos e perícias base.
 * Folha 2 = habilidades gerais, âncoras pessoais e equipamentos/inventário.
 */
export function FilledSheetPrint({
  rules,
  sheet,
  draft,
}: FilledSheetPrintProps) {
  const baseSkills = rules.skills.filter((skill) => skill.category === 'base')
  const baseSkillValues = getSkillBaseValues(rules, sheet.attributes)
  const professionalSkillLabel = sheet.professionSkillId
    ? (rules.skills.find((skill) => skill.id === sheet.professionSkillId)
        ?.label ?? sheet.professionSkillId)
    : null

  return (
    <div className="print-sheet hidden print:block print:text-[11px] print:leading-snug">
        <header className="print-avoid-break border border-black p-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gray-600">
                Protocolo Anômalo · {rules.name}
              </p>
              <h2 className="mt-1 text-xl font-semibold uppercase tracking-[0.06em]">
                {sheet.name || 'Sem nome'}
              </h2>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em]">
                {sheet.archetype?.label ?? 'Sem arquétipo'}
                {sheet.profession ? ` · ${sheet.profession.label}` : ''}
                {professionalSkillLabel
                  ? ` · ${professionalSkillLabel} +${sheet.professionSkillBonus}`
                  : ''}
              </p>
            </div>
            <div className="shrink-0 border border-black px-3 py-2 text-right font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em]">
              <p>
                Atributos {sheet.spentAttributePoints}/{rules.attributeRules.pool}
              </p>
              <p>
                Perícias {sheet.spentSkillPoints}/{sheet.skillPool}
              </p>
              <p>
                Habilidades {sheet.generalSkills.length}/
                {rules.generalSkillRules.maxChoices}
              </p>
              <p>
                Âncoras {getAnchorPointsTotal(sheet.anchors)}/{sheet.anchorPool}
              </p>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-6 border-t border-gray-300 pt-2 font-mono text-[10px] uppercase leading-snug tracking-[0.06em] text-gray-700">
            <p>
              Atributo principal ·{' '}
              {sheet.professionAttribute
                ? getAttributeAbbreviation(rules, sheet.professionAttribute)
                : '—'}
              {sheet.professionAttributeBonus > 0
                ? ` +${sheet.professionAttributeBonus}`
                : ''}
            </p>
            <p className="min-w-0">
              Motivo de presença · {sheet.presenceReason || '—'}
            </p>
          </div>
        </header>

        <section className="print-avoid-break mt-4">
          <div className="flex items-baseline justify-between border-b border-black pb-1">
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
              Derivados
            </h3>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-gray-500">
              PV · SAN · ST · EM
            </span>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-3">
            {rules.derivedStats.map((definition) => (
              <div
                key={definition.key}
                className="print-avoid-break border border-black p-3"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em]">
                    {definition.abbreviation}
                  </span>
                  <span className="font-mono text-2xl font-semibold leading-none">
                    {sheet.derived[definition.key]}
                  </span>
                </div>
                <p className="mt-1 text-[10px] font-medium leading-snug">
                  {definition.label}
                </p>
                <p className="mt-0.5 font-mono text-[10px] leading-snug text-gray-600">
                  {definition.description}
                </p>
              </div>
            ))}
          </div>
        </section>
        <section className="print-avoid-break mt-4">
          <div className="flex items-baseline justify-between border-b border-black pb-1">
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
              Atributos
            </h3>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-gray-500">
              base {rules.attributeRules.base} · pool {rules.attributeRules.pool}{' '}
              · teto {rules.attributeRules.max}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-3">
            {rules.attributes.map((definition) => (
              <div
                key={definition.key}
                className="print-avoid-break border border-black p-3"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em]">
                    {definition.abbreviation}
                  </span>
                  <span className="font-mono text-2xl font-semibold leading-none">
                    {sheet.attributes[definition.key]}
                  </span>
                </div>
                <p className="mt-1 text-[10px] font-medium leading-snug">
                  {definition.label}
                </p>
                <p className="mt-0.5 font-mono text-[10px] uppercase leading-snug tracking-[0.08em] text-gray-600">
                  distribuído {draft.attributes[definition.key]} · base{' '}
                  {rules.attributeRules.base}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="print-avoid-break print-page-break mt-4">
          <div className="flex items-baseline justify-between border-b border-black pb-1">
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
              Perícias base
            </h3>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-gray-500">
              base = floor(ATR / 2) · teto final {rules.skillRules.maxRank} ·
              investido {sheet.spentSkillPoints}/{sheet.skillPool}
            </span>
          </div>
          <table className="mt-2 border border-black">
            <thead>
              <tr className="border-b border-black font-mono text-[10px] uppercase tracking-[0.1em]">
                <th className="px-2 py-1.5 text-left font-normal">Perícia</th>
                <th className="w-12 border-l border-gray-400 px-2 py-1.5 text-center font-normal">
                  Atr.
                </th>
                <th className="w-16 border-l border-gray-400 px-2 py-1.5 text-center font-normal">
                  Base
                </th>
                <th className="w-20 border-l border-gray-400 px-2 py-1.5 text-center font-normal">
                  Investido
                </th>
                <th className="w-16 border-l border-gray-400 px-2 py-1.5 text-center font-normal">
                  Bônus
                </th>
                <th className="w-16 border-l border-gray-400 px-2 py-1.5 text-right font-normal">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {baseSkills.map((skill) => {
                const base = baseSkillValues[skill.id]
                const invested = draft.skills[skill.id]
                const total = sheet.skills[skill.id]
                const bonus = total - base - invested

                return (
                  <tr
                    key={skill.id}
                    className="border-t border-gray-300 text-[10px] leading-snug"
                  >
                    <td className="px-2 py-2">{skill.label}</td>
                    <td className="border-l border-gray-300 px-2 py-2 text-center font-mono text-[10px]">
                      {getAttributeAbbreviation(rules, skill.attribute)}
                    </td>
                    <td className="border-l border-gray-300 px-2 py-2 text-center font-mono">
                      {base}
                    </td>
                    <td className="border-l border-gray-300 px-2 py-2 text-center font-mono">
                      {invested}
                    </td>
                    <td className="border-l border-gray-300 px-2 py-2 text-center font-mono text-gray-600">
                      {bonus > 0 ? `+${bonus}` : '—'}
                    </td>
                    <td className="border-l border-gray-300 px-2 py-2 text-right font-mono font-semibold">
                      {total}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>

        <section className="print-avoid-break border border-black p-3">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
              Habilidades gerais
            </h3>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-gray-500">
              {sheet.generalSkills.length}/
              {rules.generalSkillRules.maxChoices} escolhidas · vagas livres +
              {getFreeSkillBonusTotal(sheet.generalSkills.length, rules)}
            </span>
          </div>

          {sheet.generalSkills.length > 0 ? (
            <ul className="mt-2 divide-y divide-gray-300">
              {sheet.generalSkills.map((skill) => (
                <li key={skill.id} className="py-2">
                  <p className="text-[11px] font-medium leading-snug">
                    {skill.label}
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.08em] text-gray-500">
                      {skill.cost}{' '}
                      {skill.resource === 'estamina' ? 'ST' : 'EM'}
                      {skill.costNote ? ` · ${skill.costNote}` : ''}
                    </span>
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] leading-snug text-gray-600">
                    {skill.effect}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[10px] leading-snug text-gray-600">
              Nenhuma habilidade escolhida — as vagas livres viraram bônus
              diretos em perícias.
            </p>
          )}

          {sheet.freeSkillBonusPicks.length > 0 ? (
            <p className="mt-2 border-t border-gray-300 pt-2 font-mono text-[10px] uppercase leading-snug tracking-[0.06em] text-gray-600">
              Bônus de vagas ·{' '}
              {sheet.freeSkillBonusPicks
                .map(
                  (skillId) =>
                    `${
                      rules.skills.find((skill) => skill.id === skillId)
                        ?.label ?? skillId
                    } +${rules.generalSkillRules.freeSlotBonusPerSlot}`,
                )
                .join(' · ')}
            </p>
          ) : null}
        </section>

        <section className="print-avoid-break mt-4">
          <div className="flex items-baseline justify-between border-b border-black pb-1">
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
              Âncoras pessoais
            </h3>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-gray-500">
              {getAnchorPointsTotal(sheet.anchors)}/{sheet.anchorPool} pontos ·
              mínimo {rules.anchorRules.minPerAnchor} por âncora
            </span>
          </div>
          <table className="mt-2 border border-black">
            <thead>
              <tr className="border-b border-black font-mono text-[10px] uppercase tracking-[0.1em]">
                <th className="w-10 border-r border-gray-400 px-2 py-1.5 text-left font-normal">
                  Nº
                </th>
                <th className="w-36 border-r border-gray-400 px-2 py-1.5 text-left font-normal">
                  Nome
                </th>
                <th className="border-r border-gray-400 px-2 py-1.5 text-left font-normal">
                  Descrição
                </th>
                <th className="w-12 px-2 py-1.5 text-right font-normal">Pts</th>
              </tr>
            </thead>
            <tbody>
              {sheet.anchors.map((anchor, index) => (
                <tr
                  key={anchor.id}
                  className="border-t border-gray-300 align-top text-[10px] leading-snug"
                >
                  <td className="border-r border-gray-300 px-2 py-2 font-mono text-[10px]">
                    {String(index + 1).padStart(2, '0')}
                  </td>
                  <td className="border-r border-gray-300 px-2 py-2">
                    {anchor.name || '—'}
                  </td>
                  <td className="border-r border-gray-300 px-2 py-2 text-[10px]">
                    {anchor.description || '—'}
                  </td>
                  <td className="px-2 py-2 text-right font-mono font-semibold">
                    {anchor.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-gray-500">
            {getAttributeAbbreviation(rules, rules.anchorRules.attribute)}{' '}
            {sheet.attributes[rules.anchorRules.attribute]} +{' '}
            {rules.anchorRules.basePoints} base = {sheet.anchorPool} pontos
          </p>
        </section>

        <section className="print-avoid-break mt-4">
          <div className="flex items-baseline justify-between border-b border-black pb-1">
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
              Equipamentos &amp; inventário
            </h3>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-gray-500">
              {sheet.carry.usedSlots}/{sheet.carry.maxSlots} slots ocupados
            </span>
          </div>

          {sheet.equipments.length > 0 ? (
            <table className="mt-2 border border-black">
              <thead>
                <tr className="border-b border-black font-mono text-[10px] uppercase tracking-[0.1em]">
                  <th className="px-2 py-1.5 text-left font-normal">Item</th>
                  <th className="w-24 border-l border-gray-400 px-2 py-1.5 text-left font-normal">
                    Categoria
                  </th>
                  <th className="w-12 border-l border-gray-400 px-2 py-1.5 text-right font-normal">
                    Slots
                  </th>
                </tr>
              </thead>
              <tbody>
                {sheet.equipments.map((item) => {
                  const category = rules.equipmentCategories.find(
                    (definition) => definition.id === item.category,
                  )

                  return (
                    <tr
                      key={item.id}
                      className="border-t border-gray-300 text-[10px] leading-snug"
                    >
                      <td className="px-2 py-1.5">
                        {item.label}
                        {item.effect ? (
                          <span className="font-mono text-[10px] text-gray-500">
                            {' '}
                            · {item.effect}
                          </span>
                        ) : null}
                      </td>
                      <td className="border-l border-gray-300 px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em]">
                        {category?.label ?? item.category}
                      </td>
                      <td className="border-l border-gray-300 px-2 py-1.5 text-right font-mono">
                        {item.slotCost}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <p className="mt-2 text-[10px] text-gray-600">
              Nenhum equipamento carregado.
            </p>
          )}

          <div className="mt-2 grid grid-cols-4 gap-2 border border-black p-2.5 font-mono text-[10px] uppercase leading-snug tracking-[0.06em]">
            <p>Slots base · {sheet.carry.baseSlots}</p>
            <p>Modificador · +{sheet.carry.bonusSlots}</p>
            <p>Capacidade · {sheet.carry.maxSlots}</p>
            <p>
              Ocupado · {sheet.carry.usedSlots}/{sheet.carry.maxSlots}
            </p>
          </div>
        </section>

        <p className="mt-4 border-t border-gray-300 pt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-gray-500">
          Ficha gerada localmente · {rules.name} · Protocolo Anômalo
        </p>
    </div>
  )
}