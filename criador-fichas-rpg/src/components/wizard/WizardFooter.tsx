import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '../ui/Button'

interface WizardFooterProps {
  onBack?: () => void
  nextLabel: string
  hint?: string
  nextDisabled?: boolean
}

export function WizardFooter({
  onBack,
  nextLabel,
  hint,
  nextDisabled = false,
}: WizardFooterProps) {
  return (
    <div className="mt-8 flex flex-col gap-4 border-t border-gray-300 pt-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="max-w-md font-mono text-[10px] leading-relaxed tracking-[0.06em] text-gray-500">
        {hint}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {onBack ? (
          <Button
            type="button"
            variant="secondary"
            onClick={onBack}
            icon={<ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />}
          >
            Voltar
          </Button>
        ) : null}
        <Button
          type="submit"
          disabled={nextDisabled}
          icon={<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />}
        >
          {nextLabel}
        </Button>
      </div>
    </div>
  )
}
