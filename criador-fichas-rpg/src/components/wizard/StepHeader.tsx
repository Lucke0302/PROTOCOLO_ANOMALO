interface StepHeaderProps {
  eyebrow: string
  title: string
  description: string
}

export function StepHeader({ eyebrow, title, description }: StepHeaderProps) {
  return (
    <header className="mb-6">
      <p className="label-micro">{eyebrow}</p>
      <h2
        id="step-title"
        className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl"
      >
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
        {description}
      </p>
    </header>
  )
}
