import { getModule } from './config/modules'
import { Layout } from './components/layout/Layout'
import { AnchorsStep } from './components/wizard/steps/AnchorsStep'
import { AttributesStep } from './components/wizard/steps/AttributesStep'
import { EquipmentStep } from './components/wizard/steps/EquipmentStep'
import { GeneralSkillsStep } from './components/wizard/steps/GeneralSkillsStep'
import { IdentityStep } from './components/wizard/steps/IdentityStep'
import { ReviewStep } from './components/wizard/steps/ReviewStep'
import { SkillsStep } from './components/wizard/steps/SkillsStep'
import { useCharacterStore } from './store/useCharacterStore'
import type { WizardStepId } from './types/character'

function renderStep(stepId: WizardStepId) {
  switch (stepId) {
    case 'identity':
      return <IdentityStep />
    case 'attributes':
      return <AttributesStep />
    case 'general-skills':
      return <GeneralSkillsStep />
    case 'skills':
      return <SkillsStep />
    case 'anchors':
      return <AnchorsStep />
    case 'equipment':
      return <EquipmentStep />
    case 'review':
      return <ReviewStep />
  }
}

function App() {
  const draft = useCharacterStore((state) => state.draft)
  const stepIndex = useCharacterStore((state) => state.stepIndex)

  const rules = getModule(draft.moduleId)
  const step = rules.steps[stepIndex] ?? rules.steps[0]

  return (
    <Layout module={rules} stepIndex={stepIndex}>
      {renderStep(step.id)}
    </Layout>
  )
}

export default App
