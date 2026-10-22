import { getAnchorPointsTotal, getGeneralSkillPoolBonus } from '../../lib/characterRules'
import type {
  Anchor,
  DerivedStats,
  GeneralSkill,
  ModuleRules,
} from '../../types/character'

interface DerivedStatsPanelProps {
  rules: ModuleRules
  derived: DerivedStats
  /** Quando presente, exibe o resumo de habilidades gerais e âncoras. */
  generalSkills?: readonly GeneralSkill[]
  anchors?: readonly Anchor[]
  anchorPool?: number
}

export function DerivedStatsPanel({
  rules,
  derived,
  generalSkills,
  anchors,
  anchorPool = 0,
}: DerivedStatsPanelProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {rules.derivedStats.map((definition) => (
        <div
          key={definition.key}
          className="border border-gray-300 bg-white p-4"
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="label-micro">{definition.abbreviation}</span>
            <span className="font-mono text-2xl font-semibold leading-none">
              {derived[definition.key]}
            </span>
          </div>
          <p className="mt-2 text-xs font-medium">{definition.label}</p>
          <p className="mt-1 text-[11px] leading-snug text-gray-500">
            {definition.description}
          </p>
        </div>
      ))}

      {generalSkills ? (
        <div className="border border-gray-300 bg-white p-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="label-micro">HAB</span>
            <span className="font-mono text-2xl font-semibold leading-none">
              {generalSkills.length}/{rules.generalSkillRules.maxChoices}
            </span>
          </div>
          <p className="mt-2 text-xs font-medium">Habilidades gerais</p>
          <p className="mt-1 text-[11px] leading-snug text-gray-500">
            +{getGeneralSkillPoolBonus(generalSkills.length, rules)} pontos de
            pool por vagas não preenchidas.
          </p>
          {generalSkills.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {generalSkills.map((skill) => (
                <li
                  key={skill.id}
                  className="font-mono text-[9px] uppercase tracking-[0.1em] text-navy-blue"
                >
                  {skill.label} · {skill.cost}{' '}
                  {skill.resource === 'estamina' ? 'ST' : 'EM'}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {anchors ? (
        <div className="border border-gray-300 bg-white p-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="label-micro">ANC</span>
            <span className="font-mono text-2xl font-semibold leading-none">
              {getAnchorPointsTotal(anchors)}/{anchorPool}
            </span>
          </div>
          <p className="mt-2 text-xs font-medium">Âncoras pessoais</p>
          <p className="mt-1 text-[11px] leading-snug text-gray-500">
            Pontos distribuídos entre {anchors.length} vínculos.
          </p>
          {anchors.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {anchors.map((anchor) => (
                <li
                  key={anchor.id}
                  className="flex items-baseline justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-500"
                >
                  <span className="truncate">{anchor.name || 'Sem nome'}</span>
                  <span className="shrink-0 text-navy-blue">{anchor.points}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
