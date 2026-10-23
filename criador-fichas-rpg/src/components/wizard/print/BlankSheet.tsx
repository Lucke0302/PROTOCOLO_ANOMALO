import type { AttributeKey, ModuleRules } from '../../../types/character'

interface BlankSheetProps {
  rules: ModuleRules
}

/** Abreviação do atributo (FIS/DES/INT/PSI) conforme as regras do módulo. */
function getAttributeAbbreviation(
  rules: ModuleRules,
  key: AttributeKey,
): string {
  return (
    rules.attributes.find((attribute) => attribute.key === key)
      ?.abbreviation ?? key
  )
}

/** Extrai apenas a fórmula da descrição do derivado (ex.: "PSI"). */
function getFormula(description: string): string {
  const marker = 'Fórmula:'
  const index = description.indexOf(marker)

  if (index === -1) {
    return description
  }

  return description.slice(index + marker.length).trim()
}

/** Gera as linhas numeradas (1..count) usadas nas tabelas vazias. */
function range(count: number): number[] {
  const values: number[] = []

  for (let index = 1; index <= count; index += 1) {
    values.push(index)
  }

  return values
}

function WriteLine({ label }: { label: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-600">
        {label}
      </p>
      <div className="mt-1 h-5 border-b border-black" />
    </div>
  )
}

/**
 * Ficha em branco diagramada em exatamente 2 folhas A4 para preenchimento
 * manual, mantendo a identidade visual P&B (linhas e campos vazios).
 * Folha 1 = identidade, atributos, derivados e perícias base.
 * Folha 2 = habilidades, âncoras pessoais e inventário.
 */
export function BlankSheet({ rules }: BlankSheetProps) {
  const baseSkills = rules.skills.filter((skill) => skill.category === 'base')
  const generalSkillRows = range(5)
  const inventoryRows = range(15)
  const anchorRows = range(rules.anchorRules.count)

  return (
    <div className="print-sheet hidden print:block print:text-[11px] print:leading-snug">
      <div className="print-page-break">
        <header className="print-avoid-break border border-black p-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gray-600">
                Protocolo Anômalo · {rules.name}
              </p>
              <h2 className="mt-1 text-xl font-semibold uppercase tracking-[0.06em]">
                Ficha de personagem
              </h2>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">
                Preenchimento manual · atributos base{' '}
                {rules.attributeRules.base} · pool{' '}
                {rules.attributeRules.pool} pontos
              </p>
            </div>
            <div className="shrink-0 border border-black px-3 py-2 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em]">
                Ficha em branco
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em]">
                {rules.name}
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2.5">
            <WriteLine label="Nome do personagem" />
            <WriteLine label="Arquétipo" />
            <WriteLine label="Profissão contemporânea" />
            <WriteLine label="Atributo principal / perícia bonificada" />
          </div>

          <div className="mt-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-600">
              Motivo de presença
            </p>
            <div className="mt-1 h-5 border-b border-black" />
            <div className="mt-1.5 h-5 border-b border-black" />
          </div>
        </header>

        <section className="print-avoid-break mt-4">
          <div className="flex items-baseline justify-between border-b border-black pb-1">
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
              Atributos
            </h3>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">
              base {rules.attributeRules.base} + pontos distribuídos · teto{' '}
              {rules.attributeRules.max}
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
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-gray-500">
                    base {rules.attributeRules.base}
                  </span>
                </div>
                <p className="mt-1 text-[10px] font-medium leading-snug">
                  {definition.label}
                </p>
                <div className="mt-1.5 h-9 border border-black" />
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-gray-500">
                  base + pts = total
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="print-avoid-break mt-4">
          <div className="flex items-baseline justify-between border-b border-black pb-1">
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
              Derivados
            </h3>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">
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
                  <div className="h-7 w-14 border border-black" />
                </div>
                <p className="mt-1 text-[10px] font-medium leading-snug">
                  {definition.label}
                </p>
                <p className="mt-0.5 font-mono text-[10px] leading-snug text-gray-600">
                  {getFormula(definition.description)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="print-avoid-break mt-4">
          <div className="flex items-baseline justify-between border-b border-black pb-1">
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
              Perícias base
            </h3>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">
              valor base = floor(ATR / 2) · teto final{' '}
              {rules.skillRules.maxRank} · pool {rules.skillRules.pool}
            </span>
          </div>
          <table className="mt-2 border border-black">
            <thead>
              <tr className="border-b border-black font-mono text-[10px] uppercase tracking-[0.1em]">
                <th className="w-10 border-r border-gray-400 px-2 py-1.5 text-left font-normal">
                  Nº
                </th>
                <th className="border-r border-gray-400 px-2 py-1.5 text-left font-normal">
                  Perícia
                </th>
                <th className="w-12 border-r border-gray-400 px-2 py-1.5 text-center font-normal">
                  Atr.
                </th>
                <th className="w-24 border-r border-gray-400 px-2 py-1.5 text-center font-normal">
                  Valor base
                </th>
                <th className="w-24 border-r border-gray-400 px-2 py-1.5 text-center font-normal">
                  Pontos
                </th>
                <th className="w-20 px-2 py-1.5 text-center font-normal">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {baseSkills.map((skill, index) => (
                <tr key={skill.id} className="border-t border-gray-300">
                  <td className="h-[28px] border-r border-gray-300 px-2 font-mono text-[10px] text-gray-500">
                    {String(index + 1).padStart(2, '0')}
                  </td>
                  <td className="border-r border-gray-300 px-2 text-[10px]">
                    {skill.label}
                  </td>
                  <td className="border-r border-gray-300 px-2 text-center font-mono text-[10px]">
                    {getAttributeAbbreviation(rules, skill.attribute)}
                  </td>
                  <td className="border-r border-gray-300" />
                  <td className="border-r border-gray-300" />
                  <td />
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-gray-500">
            Distribua os {rules.skillRules.pool} pontos do pool · bônus de
            arquétipo/profissão/vaga entram no total
          </p>
        </section>
      </div>

      <section className="print-avoid-break border border-black p-2.5">
        <div className="flex items-baseline justify-between border-b border-black pb-1">
          <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
            Habilidades gerais
          </h3>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">
            até {rules.generalSkillRules.maxChoices} escolhas · físicas{' '}
            {rules.generalSkillCategories
              .find((category) => category.id === 'physical')
              ?.abbreviation ?? 'ST'}{' '}
            · mentais{' '}
            {rules.generalSkillCategories.find(
              (category) => category.id === 'mental',
            )?.abbreviation ?? 'EM'}
          </span>
        </div>
        <table className="mt-2 border border-black">
          <thead>
            <tr className="border-b border-black font-mono text-[10px] uppercase tracking-[0.1em]">
              <th className="w-44 border-r border-gray-400 px-2 py-1 text-left font-normal">
                Habilidade
              </th>
              <th className="w-24 border-r border-gray-400 px-2 py-1 text-center font-normal">
                Custo
              </th>
              <th className="px-2 py-1 text-left font-normal">
                Efeito / uso
              </th>
            </tr>
          </thead>
          <tbody>
            {generalSkillRows.map((row) => (
              <tr key={row} className="border-t border-gray-300">
                <td className="h-7 border-r border-gray-300 px-2 font-mono text-[10px] text-gray-400">
                  {String(row).padStart(2, '0')}
                </td>
                <td className="border-r border-gray-300" />
                <td />
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-gray-500">
          Cada vaga não preenchida concede +
          {rules.generalSkillRules.freeSlotBonusPerSlot} pontos em uma perícia
        </p>
      </section>

      <section className="print-avoid-break mt-3">
        <div className="flex items-baseline justify-between border-b border-black pb-1">
          <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
            Âncoras pessoais
          </h3>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">
            {getAttributeAbbreviation(rules, rules.anchorRules.attribute)} +{' '}
            {rules.anchorRules.basePoints} pontos · mínimo{' '}
            {rules.anchorRules.minPerAnchor} por âncora
          </span>
        </div>

        <div className="mt-2 space-y-1.5">
          {anchorRows.map((slot) => (
            <div
              key={slot}
              className="print-avoid-break border border-black p-2.5"
            >
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em]">
                      {String(slot).padStart(2, '0')}
                    </span>
                    <div className="h-4 flex-1 border-b border-black" />
                  </div>
                  <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-600">
                    Descrição
                  </p>
                  <div className="mt-1 h-4 border-b border-gray-500" />
                  <div className="mt-1 h-4 border-b border-gray-500" />
                </div>
                <div className="shrink-0 text-center">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-600">
                    Pontos
                  </p>
                  <div className="mt-1 h-8 w-16 border border-black" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="print-avoid-break mt-3">
        <div className="flex items-baseline justify-between border-b border-black pb-1">
          <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
            Equipamentos &amp; inventário
          </h3>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">
            capacidade = floor({getAttributeAbbreviation(rules, 'fisico')} /{' '}
            {rules.equipmentRules.slotsPerAttributeStep}) +{' '}
            {rules.equipmentRules.baseSlots} · mochila +
            {rules.equipmentRules.backpackBonus}
          </span>
        </div>

        <div className="mt-2 grid grid-cols-4 gap-3 border border-black p-2.5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-600">
              Slots base
            </p>
            <div className="mt-1 h-5 border-b border-black" />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-600">
              Modificador
            </p>
            <div className="mt-1 h-5 border-b border-black" />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-600">
              Capacidade
            </p>
            <div className="mt-1 h-5 border-b border-black" />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-600">
              Ocupado
            </p>
            <div className="mt-1 h-5 border-b border-black" />
          </div>
        </div>

        <table className="mt-2 border border-black">
          <thead>
            <tr className="border-b border-black font-mono text-[10px] uppercase tracking-[0.1em]">
              <th className="w-10 border-r border-gray-400 px-2 py-1.5 text-left font-normal">
                Nº
              </th>
              <th className="border-r border-gray-400 px-2 py-1.5 text-left font-normal">
                Item
              </th>
              <th className="w-24 px-2 py-1.5 text-center font-normal">Slots</th>
            </tr>
          </thead>
          <tbody>
            {inventoryRows.map((row) => (
              <tr key={row} className="border-t border-gray-300">
                <td className="h-[18px] border-r border-gray-300 px-2 font-mono text-[10px] text-gray-400">
                  {String(row).padStart(2, '0')}
                </td>
                <td className="border-r border-gray-300" />
                <td />
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className="mt-3 border-t border-gray-300 pt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-gray-500">
        Ficha em branco · {rules.name} · Protocolo Anômalo
      </p>
    </div>
  )
}