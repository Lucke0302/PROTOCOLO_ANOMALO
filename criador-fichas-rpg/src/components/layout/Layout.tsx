import type { ReactNode } from 'react'
import type { ModuleRules, WizardStepDefinition } from '../../types/character'
import { StepIndicator } from '../wizard/StepIndicator'

interface LayoutProps {
  module: ModuleRules
  steps: readonly WizardStepDefinition[]
  stepIndex: number
  children: ReactNode
}

export function Layout({ module, steps, stepIndex, children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-black">
      <header className="no-print border-b border-black">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 items-center justify-center bg-black font-mono text-[11px] font-bold tracking-[0.18em] text-white"
            >
              PA
            </span>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-gray-500">
                Gerador de fichas
              </p>
              <h1 className="text-sm font-semibold uppercase tracking-[0.22em]">
                Protocolo Anômalo
              </h1>
            </div>
          </div>

          <div className="hidden items-center gap-2 border border-gray-300 px-3 py-2 sm:flex">
            <span aria-hidden="true" className="h-1.5 w-1.5 bg-navy-blue" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-600">
              {module.name} · {module.tagline}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <StepIndicator steps={steps} currentIndex={stepIndex} />
        <div className="mt-8">{children}</div>
      </main>

      <footer className="no-print border-t border-gray-200 py-5">
        <p className="mx-auto w-full max-w-5xl px-6 font-mono text-[9px] uppercase tracking-[0.25em] text-gray-400">
          Dados processados localmente · nenhum envio externo
        </p>
      </footer>
    </div>
  )
}
