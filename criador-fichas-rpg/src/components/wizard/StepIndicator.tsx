import { Check } from 'lucide-react'
import type { WizardStepDefinition } from '../../types/character'

interface StepIndicatorProps {
  steps: readonly WizardStepDefinition[]
  currentIndex: number
}

export function StepIndicator({ steps, currentIndex }: StepIndicatorProps) {
  return (
    <nav aria-label="Etapas de criação" className="no-print">
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {steps.map((step, index) => {
          const isActive = index === currentIndex
          const isComplete = index < currentIndex

          const containerClasses = isActive
            ? 'border-navy-blue bg-navy-blue text-white'
            : isComplete
              ? 'border-black bg-white text-black'
              : 'border-gray-300 bg-white text-gray-400'

          const badgeClasses = isActive
            ? 'border-white/50 text-white'
            : isComplete
              ? 'border-black bg-black text-white'
              : 'border-gray-300 text-gray-400'

          return (
            <li key={step.id} className="min-w-0">
              <div
                aria-current={isActive ? 'step' : undefined}
                className={`flex h-full items-center gap-2 border px-3 py-2.5 ${containerClasses}`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-6 w-6 shrink-0 items-center justify-center border font-mono text-[10px] ${badgeClasses}`}
                >
                  {isComplete ? <Check className="h-3 w-3" /> : index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-mono text-[10px] uppercase tracking-[0.16em]">
                    {step.label}
                  </p>
                  <p
                    className={`truncate font-mono text-[9px] uppercase tracking-[0.15em] ${
                      isActive ? 'text-white/60' : 'text-gray-400'
                    }`}
                  >
                    Etapa 0{index + 1}
                  </p>
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
