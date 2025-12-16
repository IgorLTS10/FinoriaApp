// src/test/test-utils.tsx
// Utilitaires personnalisés pour les tests

import { render, type RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import type { ReactElement, ReactNode } from 'react'

// Wrapper qui inclut tous les providers nécessaires
function AllTheProviders({ children }: { children: ReactNode }) {
    return (
        <BrowserRouter>
            {children}
        </BrowserRouter>
    )
}

// Fonction de render personnalisée qui inclut automatiquement les providers
export function renderWithRouter(
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
) {
    return render(ui, { wrapper: AllTheProviders, ...options })
}

// Ré-exporter tout de @testing-library/react
export * from '@testing-library/react'

// Exporter notre render personnalisé comme default
export { renderWithRouter as render }
