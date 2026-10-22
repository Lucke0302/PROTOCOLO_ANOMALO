import type { ModuleRules } from '../../types/character'
import { moduleA } from './moduleA'

/**
 * Registry de módulos de regras.
 * Para adicionar o Módulo B: crie `moduleB.ts` seguindo o contrato `ModuleRules`
 * e registre-o aqui. Nenhum componente visual precisa ser alterado.
 */
export const MODULE_REGISTRY: Record<string, ModuleRules> = {
  [moduleA.id]: moduleA,
}

export const DEFAULT_MODULE_ID = moduleA.id

export function getModule(moduleId: string): ModuleRules {
  return MODULE_REGISTRY[moduleId] ?? moduleA
}
