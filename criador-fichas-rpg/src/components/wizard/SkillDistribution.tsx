import { Controller, type Control } from 'react-hook-form'
import { Minus, Plus } from 'lucide-react'
import type {
  ArchetypeDefinition,
  AttributeDefinition,
  SkillDefinition,
  SkillId,
  SkillRanks,
} from '../../types/character'
import type { SkillsFormValues } from '../../lib/validation'

interface SkillDistributionProps {
  control: Control<SkillsFormValues>
  skills: readonly SkillDefinition[]
  attributes: readonly AttributeDefinition[]
  /** Valor base de cada perícia: floor(atributo correspondente / 2). */
  baseValues: SkillRanks
  /** Teto de pontos investidos por perícia (teto final absoluto - base). */
  caps: SkillRanks
  /** Teto final absoluto que concede bônus de pool ao ser atingido. */
  bonusThreshold: number
  bonusAtMax: number
  remaining: number
  archetype: ArchetypeDefinition | null
  /** Perícia que recebe o bônus da profissão civil. */
  professionSkillId?: SkillId | null
  /** Pontos concedidos pela profissão à perícia escolhida. */
  professionBonus?: number
}

export function SkillDistribution({
  control,
  skills,
  attributes,
  baseValues,
  caps,
  bonusThreshold,
  bonusAtMax,
  remaining,
  archetype,
  professionSkillId = null,
  professionBonus = 0,
}: SkillDistributionProps) {
  return (
    <ul className="divide-y divide-gray-300 border border-gray-300">
      {skills.map((skill) => {
        const bonus = archetype?.skillBonuses?.[skill.id] ?? 0
        const professionSkillBonus =
          skill.id === professionSkillId ? professionBonus : 0
        const base = baseValues[skill.id] ?? 0
        const cap = caps[skill.id] ?? 0
        const totalCap = base + cap
        const reducedCap = totalCap < bonusThreshold
        const attribute = attributes.find(
          (definition) => definition.key === skill.attribute,
        )

        return (
          <li
            key={skill.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-medium">{skill.label}</h3>
                {attribute ? (
                  <span className="border border-gray-300 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-gray-500">
                    {attribute.abbreviation}
                  </span>
                ) : null}
                {bonus > 0 ? (
                  <span className="border border-navy-blue px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-navy-blue">
                    +{bonus} arquétipo
                  </span>
                ) : null}
                {professionSkillBonus > 0 ? (
                  <span className="border border-navy-blue px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-navy-blue">
                    +{professionSkillBonus} profissão
                  </span>
                ) : null}
                {reducedCap ? (
                  <span className="border border-gray-400 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-gray-600">
                    teto {totalCap}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-gray-500">{skill.description}</p>
            </div>

            <Controller
              control={control}
              name={skill.id}
              render={({ field }) => {
                const invested = Number.isFinite(field.value) ? field.value : 0
                const total = base + invested + bonus + professionSkillBonus
                const available = Math.max(0, remaining)
                const maxAllowed = Math.min(cap, invested + available)
                const reachedBonus = base + invested >= bonusThreshold

                const commit = (next: number) => {
                  field.onChange(
                    Math.max(0, Math.min(maxAllowed, Math.trunc(next))),
                  )
                }

                return (
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="mr-1 text-right">
                      <span className="block font-mono text-lg leading-none">
                        {total}
                      </span>
                      <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.1em] text-gray-500">
                        base {base} · {invested}/{cap}
                      </span>
                      {reachedBonus ? (
                        <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.1em] text-navy-blue">
                          +{bonusAtMax} pool
                        </span>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => commit(invested - 1)}
                      disabled={invested <= 0}
                      aria-label={`Reduzir ${skill.label}`}
                      className="flex h-8 w-8 items-center justify-center border border-gray-300 bg-white text-black transition-colors hover:border-black disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300"
                    >
                      <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>

                    <input
                      ref={field.ref}
                      name={field.name}
                      onBlur={field.onBlur}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={maxAllowed}
                      value={invested}
                      onChange={(event) => {
                        const raw = event.target.value
                        if (raw === '') {
                          commit(0)
                          return
                        }
                        const parsed = Number(raw)
                        if (Number.isNaN(parsed)) return
                        commit(parsed)
                      }}
                      aria-label={`Pontos investidos em ${skill.label}`}
                      className="h-8 w-16 border border-gray-300 bg-white text-center font-mono text-sm outline-none transition-colors focus:border-navy-blue focus:ring-1 focus:ring-navy-blue"
                    />

                    <button
                      type="button"
                      onClick={() => commit(invested + 1)}
                      disabled={invested >= maxAllowed}
                      aria-label={`Aumentar ${skill.label}`}
                      className="flex h-8 w-8 items-center justify-center border border-navy-blue bg-navy-blue text-white transition-colors hover:bg-navy-blue-800 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-200 disabled:text-gray-400"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                )
              }}
            />
          </li>
        )
      })}
    </ul>
  )
}
