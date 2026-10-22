import { useState } from 'react'
import { Controller, type Control } from 'react-hook-form'
import { Minus, Plus } from 'lucide-react'
import type {
  ArchetypeDefinition,
  AttributeDefinition,
  AttributeKey,
  AttributeRules,
  CivilProfession,
} from '../../types/character'
import {
  getArchetypeAttributeBonus,
  getProfessionAttributeBonus,
} from '../../lib/characterRules'
import type { AttributesFormValues } from '../../lib/validation'

interface AttributeDistributionProps {
  control: Control<AttributesFormValues>
  rules: AttributeRules
  attributes: readonly AttributeDefinition[]
  archetype: ArchetypeDefinition | null
  profession: CivilProfession | null
  professionAttributeChoice: AttributeKey | null
  /** Teto de distribuição manual por atributo (bônus já descontados). */
  caps: Record<AttributeKey, number>
  remaining: number
}

/** Passo dos botões de ajuste rápido (o campo digitado aceita qualquer valor). */
const INCREMENT_STEP = 5
const DECREMENT_STEP = 1

export function AttributeDistribution({
  control,
  rules,
  attributes,
  archetype,
  profession,
  professionAttributeChoice,
  caps,
  remaining,
}: AttributeDistributionProps) {
  // Texto digitado por atributo. Sem entrada = exibe o valor já confirmado.
  // Isso permite digitar livremente; o clamp/validação só roda no blur.
  const [drafts, setDrafts] = useState<Partial<Record<AttributeKey, string>>>({})

  const setDraft = (key: AttributeKey, raw: string) =>
    setDrafts((previous) => ({ ...previous, [key]: raw }))

  const clearDraft = (key: AttributeKey) =>
    setDrafts((previous) => {
      if (!(key in previous)) return previous
      const next = { ...previous }
      delete next[key]
      return next
    })

  return (
    <div className="divide-y divide-gray-300 border border-gray-300">
      {attributes.map((definition) => {
        const archetypeBonus = getArchetypeAttributeBonus(
          archetype,
          definition.key,
        )
        const professionBonus = getProfessionAttributeBonus(
          profession,
          professionAttributeChoice,
          definition.key,
        )

        return (
          <Controller
            key={definition.key}
            control={control}
            name={definition.key}
            render={({ field }) => {
              const bonus = archetypeBonus + professionBonus
              const value = Number.isFinite(field.value)
                ? field.value
                : rules.min
              const cap = caps[definition.key]
              const inputValue = drafts[definition.key] ?? String(value)
              const finalValue = Math.min(rules.max, value + bonus)
              const canDecrease = value > rules.min
              const canIncrease = value < cap && remaining > 0
              const fillPercent =
                cap > rules.min
                  ? ((value - rules.min) / (cap - rules.min)) * 100
                  : 0

              const commit = (next: number) => {
                const clamped = Math.min(
                  cap,
                  Math.max(rules.min, Math.trunc(next)),
                )
                field.onChange(clamped)
                clearDraft(definition.key)
              }

              const commitDraft = () => {
                const parsed = Number.parseInt(inputValue, 10)
                commit(Number.isNaN(parsed) ? value : parsed)
              }

              const increase = () => {
                const ceiling = Math.min(cap, value + remaining)
                commit(Math.min(value + INCREMENT_STEP, ceiling))
              }

              return (
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold">
                          {definition.label}
                        </h3>
                        <span className="border border-gray-300 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-gray-500">
                          {definition.abbreviation}
                        </span>
                        {archetypeBonus > 0 ? (
                          <span className="border border-navy-blue px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-navy-blue">
                            +{archetypeBonus} arquétipo
                          </span>
                        ) : null}
                        {professionBonus > 0 ? (
                          <span className="border border-navy-blue px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-navy-blue">
                            +{professionBonus} profissão
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {definition.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => commit(value - DECREMENT_STEP)}
                        disabled={!canDecrease}
                        aria-label={`Reduzir ${definition.label} em ${DECREMENT_STEP}`}
                        className="flex h-10 w-10 items-center justify-center border border-gray-300 bg-white text-black transition-colors hover:border-black disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300"
                      >
                        <Minus className="h-4 w-4" aria-hidden="true" />
                      </button>

                      <input
                        ref={field.ref}
                        name={field.name}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={3}
                        value={inputValue}
                        onChange={(event) =>
                          setDraft(
                            definition.key,
                            event.target.value.replace(/[^0-9]/g, ''),
                          )
                        }
                        onBlur={() => {
                          commitDraft()
                          field.onBlur()
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            event.currentTarget.blur()
                          }
                          if (event.key === 'Escape') {
                            event.preventDefault()
                            clearDraft(definition.key)
                            field.onChange(value)
                          }
                        }}
                        aria-label={`Valor de ${definition.label}`}
                        className="h-10 w-20 border border-gray-300 bg-white text-center font-mono text-base outline-none transition-colors focus:border-navy-blue focus:ring-1 focus:ring-navy-blue"
                      />

                      <button
                        type="button"
                        onClick={increase}
                        disabled={!canIncrease}
                        aria-label={`Aumentar ${definition.label} em ${INCREMENT_STEP}`}
                        className="flex h-10 w-10 items-center justify-center border border-navy-blue bg-navy-blue text-white transition-colors hover:bg-navy-blue-800 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-200 disabled:text-gray-400"
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <div aria-hidden="true" className="h-1.5 flex-1 bg-gray-200">
                      <div
                        className="h-full bg-navy-blue transition-all duration-150"
                        style={{ width: `${fillPercent}%` }}
                      />
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-gray-500">
                      base {rules.min} · teto {cap} · final {finalValue}
                    </span>
                  </div>
                </div>
              )
            }}
          />
        )
      })}
    </div>
  )
}
