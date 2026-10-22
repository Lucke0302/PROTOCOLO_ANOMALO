import { Backpack, Check, Lock, Plus, X } from 'lucide-react'
import { getModule } from '../../../config/modules'
import {
  applyAttributeBonuses,
  canEquipItem,
  getArchetype,
  getCarryCapacity,
  getDraftProfession,
  getEffectiveEquipments,
  getProfessionEquipment,
} from '../../../lib/characterRules'
import { useCharacterStore } from '../../../store/useCharacterStore'
import { Button } from '../../ui/Button'
import { StepHeader } from '../StepHeader'
import { WizardFooter } from '../WizardFooter'

export function EquipmentStep() {
  const draft = useCharacterStore((state) => state.draft)
  const stepIndex = useCharacterStore((state) => state.stepIndex)
  const addEquipment = useCharacterStore((state) => state.addEquipment)
  const removeEquipment = useCharacterStore((state) => state.removeEquipment)
  const nextStep = useCharacterStore((state) => state.nextStep)
  const previousStep = useCharacterStore((state) => state.previousStep)

  const rules = getModule(draft.moduleId)
  const step = rules.steps[stepIndex]
  const archetype = getArchetype(rules, draft.archetypeId)
  const finalAttributes = applyAttributeBonuses(
    rules,
    draft.attributes,
    archetype,
    getDraftProfession(draft, rules),
    draft.professionAttributeChoice,
  )
  const carry = getCarryCapacity(
    finalAttributes,
    getEffectiveEquipments(draft, rules),
    rules.equipmentRules,
  )
  const professionItems = getProfessionEquipment(draft, rules)
  const grantedIds = new Set(professionItems.map((item) => item.id))
  const equipments = getEffectiveEquipments(draft, rules)
  const remainingSlots = carry.maxSlots - carry.usedSlots
  const isOverloaded = remainingSlots < 0
  const hasBackpack = carry.bonusSlots > 0
  const usedPercent = Math.min(
    100,
    Math.max(
      0,
      carry.maxSlots > 0 ? (carry.usedSlots / carry.maxSlots) * 100 : 100,
    ),
  )

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
          nextStep()
        }}
        className="space-y-6"
      >
        <div className="panel">
          <div className="grid grid-cols-1 divide-y divide-gray-300 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="p-4">
              <p className="label-micro">Capacidade</p>
              <p className="mt-1 font-mono text-2xl leading-none">
                {carry.maxSlots}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-gray-500">
                Físico {finalAttributes.fisico} · base {carry.baseSlots}
                {carry.bonusSlots > 0 ? ` + ${carry.bonusSlots} mochila` : ''}
              </p>
            </div>
            <div className="p-4">
              <p className="label-micro">Ocupados</p>
              <p className="mt-1 font-mono text-2xl leading-none">
                {carry.usedSlots}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-gray-500">
                itens carregados {equipments.length}
              </p>
            </div>
            <div className="p-4">
              <p className="label-micro">Livres</p>
              <p
                className={`mt-1 font-mono text-2xl leading-none ${
                  remainingSlots <= 0 ? 'text-navy-blue' : ''
                }`}
              >
                {remainingSlots}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-gray-500">
                {isOverloaded ? 'carga excedida' : 'slots disponíveis'}
              </p>
            </div>
          </div>
          <div aria-hidden="true" className="h-1.5 bg-gray-100">
            <div
              className={`h-full transition-all duration-150 ${
                isOverloaded ? 'bg-black' : 'bg-navy-blue'
              }`}
              style={{ width: `${usedPercent}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-300 px-4 py-2.5">
            <p
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-600"
              aria-live="polite"
            >
              Ocupado: {carry.usedSlots}/{carry.maxSlots} Slots
            </p>
            {hasBackpack ? (
              <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-navy-blue">
                <Backpack className="h-3 w-3" aria-hidden="true" />
                mochila +{carry.bonusSlots}
              </span>
            ) : null}
          </div>
        </div>

        {isOverloaded ? (
          <p
            role="alert"
            className="border border-navy-blue bg-navy-blue-50 px-3 py-2 text-xs text-navy-blue"
          >
            Carga excedida em {Math.abs(remainingSlots)} slot(s). Remova itens
            para continuar — a capacidade é recalculada pelo Físico final.
          </p>
        ) : null}

        {rules.equipmentCategories.map((category) => {
          const items = rules.equipmentCatalog.filter(
            (item) => item.category === category.id,
          )
          if (items.length === 0) return null

          return (
            <section
              key={category.id}
              aria-labelledby={`category-${category.id}`}
            >
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <div>
                  <h3
                    id={`category-${category.id}`}
                    className="text-sm font-semibold"
                  >
                    {category.label}
                  </h3>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    {category.description}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.18em] text-gray-400">
                  {items.length} itens
                </span>
              </div>

              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => {
                  const isEquipped = equipments.some(
                    (equipped) => equipped.id === item.id,
                  )
                  const isGranted = grantedIds.has(item.id)
                  const canAdd = canEquipItem(
                    item,
                    finalAttributes,
                    equipments,
                    rules.equipmentRules,
                  )
                  const isBlocked = !isEquipped && !canAdd

                  return (
                    <li
                      key={item.id}
                      className={`flex h-full flex-col justify-between gap-3 border p-3 ${
                        isEquipped
                          ? 'border-navy-blue bg-navy-blue-50'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold leading-snug">
                            {item.label}
                          </p>
                          <span className="shrink-0 border border-gray-300 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-600">
                            {item.slotCost === 0
                              ? '0 slot'
                              : `${item.slotCost} slot${item.slotCost > 1 ? 's' : ''}`}
                          </span>
                        </div>
                        <p className="mt-1.5 text-[11px] leading-snug text-gray-500">
                          {item.description}
                        </p>
                        {item.effect ? (
                          <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-navy-blue">
                            {item.effect}
                          </p>
                        ) : null}
                      </div>

                      {isEquipped ? (
                        isGranted ? (
                          <p className="flex items-center justify-center gap-1.5 border border-navy-blue bg-navy-blue-50 px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-navy-blue">
                            <Lock className="h-3 w-3" aria-hidden="true" />
                            Item da profissão
                          </p>
                        ) : (
                          <Button
                            variant="secondary"
                            onClick={() => removeEquipment(item.id)}
                            aria-label={`Remover ${item.label}`}
                            className="w-full px-2 py-1.5 text-[10px]"
                            icon={<X className="h-3 w-3" aria-hidden="true" />}
                          >
                            Remover
                          </Button>
                        )
                      ) : (
                        <Button
                          variant={isBlocked ? 'ghost' : 'primary'}
                          onClick={() => addEquipment(item)}
                          disabled={isBlocked}
                          aria-label={`Adicionar ${item.label}`}
                          title={
                            isBlocked
                              ? 'Slots insuficientes para este item.'
                              : undefined
                          }
                          className="w-full px-2 py-1.5 text-[10px]"
                          icon={<Plus className="h-3 w-3" aria-hidden="true" />}
                        >
                          {isBlocked ? 'Sem slots' : 'Adicionar'}
                        </Button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}

        <section>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-semibold">Inventário atual</h3>
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-400">
              {carry.usedSlots}/{carry.maxSlots} slots
            </span>
          </div>

          {equipments.length > 0 ? (
            <ul className="divide-y divide-gray-200 border border-gray-300">
              {equipments.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">{item.label}</p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-400">
                      {item.slotCost} slot{item.slotCost === 1 ? '' : 's'}
                      {item.effect ? ` · ${item.effect}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {grantedIds.has(item.id) ? (
                      <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-navy-blue">
                        <Lock className="h-3 w-3" aria-hidden="true" />
                        profissão
                      </span>
                    ) : (
                      <>
                        <Check
                          className="h-3.5 w-3.5 text-navy-blue"
                          aria-hidden="true"
                        />
                        <Button
                          variant="ghost"
                          onClick={() => removeEquipment(item.id)}
                          aria-label={`Remover ${item.label}`}
                          className="px-1.5 py-1"
                          icon={<X className="h-3 w-3" aria-hidden="true" />}
                        />
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="border border-gray-300 p-4 text-xs text-gray-500">
              Nenhum item carregado. O inventário pode ficar vazio — a etapa não
              exige equipamentos.
            </p>
          )}
        </section>

        <WizardFooter
          onBack={previousStep}
          nextLabel="Revisar ficha"
          nextDisabled={isOverloaded}
          hint={
            isOverloaded
              ? 'Remova itens até a carga caber no limite de slots.'
              : equipments.length === 0
                ? 'Inventário vazio é permitido. Avance para revisar a ficha.'
                : `Carga dentro do limite: ${remainingSlots} slot(s) livre(s).`
          }
        />
      </form>
    </section>
  )
}

