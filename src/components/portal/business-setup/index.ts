/**
 * Business Setup Components - Public API
 * 
 * The new simplified SetupModal is the default.
 * Old SetupOrchestrator (7-step wizard) is deprecated.
 */

// New simplified modal (default)
export { SetupModal } from './modal'
export type { SetupModalProps } from './modal'

// Tab components
export { ExistingEntityTab } from './tabs/ExistingEntityTab'
export { NewEntityTab } from './tabs/NewEntityTab'

// Fields
export { CountryFlagSelector, COUNTRIES } from './fields/CountryFlagSelector'

// Components
export { SetupErrorBoundary } from './components/SetupErrorBoundary'
export { SetupModalSkeleton, EntityCardSkeleton, LoadingSpinner } from './components/LoadingStates'

// Types
export type { SetupFormData, SetupWizardProps } from './types/setup'

// Services
export { lookupLicense, setupEntity, APIError } from './services/businessSetupApi'

/**
 * @deprecated Use SetupModal instead. The 7-step wizard has been retired.
 */
export { default as SetupOrchestrator } from './core/SetupOrchestrator'

/**
 * @deprecated Use SetupModal instead.
 */
export { default as SetupWizard } from './core/SetupOrchestrator'
