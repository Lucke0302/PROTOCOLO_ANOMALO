import { Check } from 'lucide-react'
import { getProfessionPrimaryAttribute } from '../../lib/characterRules'
import type {
  AttributeDefinition,
  AttributeKey,
  CivilProfession,
  CivilProfessionId,
  Equipment,
  SkillDefinition,
  SkillId,
} from '../../types/character'

interface ProfessionSelectorProps {
  professions: readonly CivilProfession[]
  attributes: readonly AttributeDefinition[]
  skills: readonly SkillDefinition[]
  equipmentCatalog: readonly Equipment[]
  selectedId: CivilProfessionId | null
  selectedSkill: SkillId | null
  selectedAttribute: AttributeKey | null
  onSelect: (professionId: CivilProfessionId) => void
  onSelectSkill: (skillId: SkillId) => void
  onSelectAttribute: (attribute: AttributeKey) => void
  errors?: {
    profession?: string
    skill?: string
    attribute?: string
  }
}

const skillLabel = (skills: readonly SkillDefinition[], id: SkillId): string =>
  skills.find((skill) => skill.id === id)?.label ?? id

const equipmentLabel = (
  catalog: readonly Equipment[],
  id: string,
): string => catalog.find((item) => item.id === id)?.label ?? id

export function ProfessionSelector({
  professions,
  attributes,
  skills,
  equipmentCatalog,
  selectedId,
  selectedSkill,
  selectedAttribute,
  onSelect,
  onSelectSkill,
  onSelectAttribute,
  errors,
}: ProfessionSelectorProps) {
  const attributeLabel = (key: AttributeKey): string =>
    attributes.find((attribute) => attribute.key === key)?.abbreviation ?? key

  return (
    <fieldset className="panel p-5" aria-describedby="profession-hint">
      <legend className="label-micro px-1">Profissão contemporânea</legend>
      <p id="profession-hint" className="mb-4 mt-1 text-xs text-gray-500">
        Exclusiva do arquétipo Civil. A profissão define o atributo principal
        — que recebe o bônus de +10 fora do pool — e o pré-requisito cobrado na
        etapa de Atributos. O bônus de +20 na perícia é aplicado ao valor final.
      </p>

      <div
        role="radiogroup"
        aria-label="Profissão civil"
        className="grid gap-3 sm:grid-cols-2"
      >
        {professions.map((profession) => {
          const selected = selectedId === profession.id
          const primaryAttribute = profession.primaryAttribute
          const attributeOptions = profession.attributeOptions ?? []
          const requirementLabel = primaryAttribute
            ? attributeLabel(primaryAttribute)
            : attributeOptions.map(attributeLabel).join(' ou ')
          const bonusLabel = primaryAttribute
            ? `+${profession.attributeBonus} ${attributeLabel(primaryAttribute)}`
            : `+${profession.attributeBonus} ${requirementLabel}`
          const minBase = Math.max(
            0,
            profession.reqValue - profession.attributeBonus,
          )
          const bonusSkillsLabel = profession.bonusSkillIds
            .map((id) => skillLabel(skills, id))
            .join(' ou ')
          const itemsLabel = profession.initialEquipmentIds
            .map((id) => equipmentLabel(equipmentCatalog, id))
            .join(' · ')
          const resolvedAttribute = getProfessionPrimaryAttribute(
            profession,
            selectedAttribute,
          )

          return (
            <div
              key={profession.id}
              className={`flex h-full flex-col justify-between gap-3 border p-4 transition-colors duration-150 ${
                selected
                  ? 'border-navy-blue ring-1 ring-inset ring-navy-blue'
                  : 'border-gray-300 bg-white'
              }`}
            >
              <label className="flex cursor-pointer flex-col gap-2">
                <span className="flex items-start justify-between gap-2">
                  <span className="font-mono text-[11px] uppercase tracking-[0.16em]">
                    {profession.label}
                  </span>
                  <input
                    type="radio"
                    name="professionId"
                    value={profession.id}
                    checked={selected}
                    onChange={() => onSelect(profession.id)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 h-2.5 w-2.5 shrink-0 border ${
                      selected
                        ? 'border-navy-blue bg-navy-blue'
                        : 'border-gray-400 bg-white'
                    }`}
                  />
                </span>
                <span className="text-xs leading-snug text-gray-600">
                  {profession.summary}
                </span>
                <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-navy-blue">
                  {selected ? (
                    <Check className="h-3 w-3" aria-hidden="true" />
                  ) : null}
                  {`Requer ${requirementLabel} ${profession.reqValue}+ · invista ${minBase} no valor base`}
                </span>
                <span className="border-t border-gray-200 pt-2 text-[11px] leading-snug text-gray-600">
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-navy-blue">
                    {bonusLabel} (fora do pool) · +{profession.bonusValue}{' '}
                    {bonusSkillsLabel}
                  </span>
                  <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.1em] text-gray-500">
                    Itens de ofício automáticos (não removíveis): {itemsLabel}
                  </span>
                </span>
              </label>

              {selected && profession.bonusSkillIds.length > 1 ? (
                <div>
                  <label
                    htmlFor={`profession-skill-${profession.id}`}
                    className="label-micro"
                  >
                    Perícia bonificada
                  </label>
                  <select
                    id={`profession-skill-${profession.id}`}
                    value={selectedSkill ?? ''}
                    onChange={(event) =>
                      onSelectSkill(event.target.value as SkillId)
                    }
                    aria-invalid={errors?.skill ? true : undefined}
                    className="mt-1 w-full border border-gray-300 bg-white px-2 py-2 text-xs outline-none transition-colors focus:border-navy-blue focus:ring-1 focus:ring-navy-blue"
                  >
                    <option value="">Selecione a perícia…</option>
                    {profession.bonusSkillIds.map((id) => (
                      <option key={id} value={id}>
                        {skillLabel(skills, id)} (+{profession.bonusValue})
                      </option>
                    ))}
                  </select>
                  {errors?.skill ? (
                    <p role="alert" className="mt-1 text-xs text-navy-blue">
                      {errors.skill}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {selected && !profession.primaryAttribute ? (
                <div>
                  <label
                    htmlFor={`profession-attribute-${profession.id}`}
                    className="label-micro"
                  >
                    Atributo principal (+{profession.attributeBonus})
                  </label>
                  <select
                    id={`profession-attribute-${profession.id}`}
                    value={resolvedAttribute === null ? '' : resolvedAttribute}
                    onChange={(event) =>
                      onSelectAttribute(event.target.value as AttributeKey)
                    }
                    aria-invalid={errors?.attribute ? true : undefined}
                    className="mt-1 w-full border border-gray-300 bg-white px-2 py-2 text-xs outline-none transition-colors focus:border-navy-blue focus:ring-1 focus:ring-navy-blue"
                  >
                    <option value="">Selecione o atributo…</option>
                    {attributeOptions.map((key) => (
                      <option key={key} value={key}>
                        {attributes.find((attribute) => attribute.key === key)
                          ?.label ?? key}{' '}
                        (+{profession.attributeBonus} e pré-requisito{' '}
                        {profession.reqValue}+)
                      </option>
                    ))}
                  </select>
                  {errors?.attribute ? (
                    <p role="alert" className="mt-1 text-xs text-navy-blue">
                      {errors.attribute}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {errors?.profession ? (
        <p role="alert" className="mt-3 text-xs text-navy-blue">
          {errors.profession}
        </p>
      ) : selectedId ? null : (
        <p className="mt-3 text-xs text-gray-500">
          Selecione uma profissão para liberar o avanço. O pré-requisito é
          conferido na etapa de Atributos, já com o bônus de +10 aplicado.
        </p>
      )}
    </fieldset>
  )
}