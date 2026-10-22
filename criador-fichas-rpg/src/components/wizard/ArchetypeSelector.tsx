import type {
  ArchetypeDefinition,
  AttributeDefinition,
} from '../../types/character'

interface ArchetypeSelectorProps {
  archetypes: readonly ArchetypeDefinition[]
  attributes: readonly AttributeDefinition[]
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  name: string
  /** Bônus de atributo concedido pela profissão do arquétipo (fora do pool). */
  professionAttributeBonus?: number
  error?: string
}

export function ArchetypeSelector({
  archetypes,
  attributes,
  value,
  onChange,
  onBlur,
  name,
  professionAttributeBonus,
  error,
}: ArchetypeSelectorProps) {
  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Arquétipo"
        aria-invalid={error ? true : undefined}
        className="grid gap-3 sm:grid-cols-3"
      >
        {archetypes.map((archetype) => {
          const selected = value === archetype.id
          const bonuses = attributes
            .map((attribute) => {
              const bonus = archetype.attributeBonuses[attribute.key]
              return bonus
                ? `+${bonus} ${attribute.abbreviation}`
                : null
            })
            .filter((bonus): bonus is string => bonus !== null)
            .join(' · ')
          const bonusLabel =
            archetype.id === 'civil' && professionAttributeBonus
              ? `${bonuses} · +${professionAttributeBonus} no atributo principal da profissão`
              : bonuses

          return (
            <label
              key={archetype.id}
              className={`flex cursor-pointer flex-col border p-4 transition-colors duration-150 ${
                selected
                  ? 'border-navy-blue ring-1 ring-inset ring-navy-blue'
                  : 'border-gray-300 hover:border-black'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={archetype.id}
                checked={selected}
                onChange={(event) => onChange(event.target.value)}
                onBlur={onBlur}
                className="sr-only"
              />
              <span className="flex items-start justify-between gap-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em]">
                  {archetype.label}
                </span>
                <span
                  aria-hidden="true"
                  className={`mt-0.5 h-2.5 w-2.5 shrink-0 border ${
                    selected
                      ? 'border-navy-blue bg-navy-blue'
                      : 'border-gray-400 bg-white'
                  }`}
                />
              </span>
              <span className="mt-1 text-xs leading-snug text-gray-600">
                {archetype.summary}
              </span>
              <span className="mt-3 border-t border-gray-200 pt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-navy-blue">
                {bonusLabel}
              </span>
            </label>
          )
        })}
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-xs text-navy-blue">
          {error}
        </p>
      ) : null}
    </div>
  )
}
