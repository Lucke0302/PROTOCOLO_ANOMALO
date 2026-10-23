import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { ModuleRules, WizardStepDefinition } from '../../types/character'
import { StepIndicator } from '../wizard/StepIndicator'

const GLITCH_TITLE = 'PROTOCOLO ANÔMALO'
const NOISE_CHARS = [
  '█',
  '░',
  '▒',
  '▓',
  'X',
  'Ø',
  '?',
  '!',
  '#',
  '%',
  '&',
  '0',
  '1',
  'Δ',
  '§',
] as const

/** Posições imutáveis: 'P' de PROTOCOLO, 'A' de ANÔMALO e o espaço separador. */
const FIXED_POSITIONS = new Set([
  0,
  GLITCH_TITLE.indexOf(' '),
  GLITCH_TITLE.indexOf('A'),
])

function pickNoiseChar(current: string): string {
  const index = Math.floor(Math.random() * NOISE_CHARS.length)
  const next = NOISE_CHARS[index]

  if (next === current) {
    return NOISE_CHARS[(index + 1) % NOISE_CHARS.length]
  }

  return next
}

function GlitchTitle() {
  const [chars, setChars] = useState<string[]>(() => GLITCH_TITLE.split(''))

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const timers = new Set<number>()

    // Cada posição mutável tem o seu próprio timer recursivo com delay
    // sorteado a cada mutação, garantindo oscilação totalmente descoordenada.
    const scheduleMutation = (position: number) => {
      const delay = 40 + Math.random() * 200

      const timer = window.setTimeout(() => {
        timers.delete(timer)

        setChars((previous) => {
          const next = [...previous]
          const revealOriginal = Math.random() < 0.3

          next[position] = revealOriginal
            ? GLITCH_TITLE[position]
            : pickNoiseChar(next[position])

          return next
        })

        scheduleMutation(position)
      }, delay)

      timers.add(timer)
    }

    GLITCH_TITLE.split('').forEach((_, position) => {
      if (FIXED_POSITIONS.has(position)) {
        return
      }

      scheduleMutation(position)
    })

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      timers.clear()
    }
  }, [])

  return (
    <h1
      aria-label={GLITCH_TITLE}
      className="whitespace-pre font-mono text-sm font-semibold uppercase tracking-[0.22em]"
    >
      <span aria-hidden="true">{chars.join('')}</span>
    </h1>
  )
}

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
              <GlitchTitle />
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
