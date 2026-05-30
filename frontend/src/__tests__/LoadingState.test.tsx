import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingState } from '@/components/ui/loading-state'

describe('LoadingState', () => {
  it('renders a loading message', () => {
    render(<LoadingState message="Cargando datos..." />)
    expect(screen.getByText('Cargando datos...')).toBeInTheDocument()
  })

  it('renders default message when none provided', () => {
    render(<LoadingState />)
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })
})
