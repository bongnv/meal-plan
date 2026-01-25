import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

import { ReconnectModal } from './ReconnectModal'

// Wrapper with MantineProvider
function Wrapper({ children }: { children: React.ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>
}

describe('ReconnectModal', () => {
  const mockOnReconnect = vi.fn()
  const mockOnWorkOffline = vi.fn()

  it('should not render when closed', () => {
    render(
      <ReconnectModal
        opened={false}
        fileName="data.json.gz"
        onReconnect={mockOnReconnect}
        onWorkOffline={mockOnWorkOffline}
      />,
      { wrapper: Wrapper }
    )

    expect(
      screen.queryByText(/session has expired/i)
    ).not.toBeInTheDocument()
  })

  it('should render when opened', () => {
    render(
      <ReconnectModal
        opened={true}
        fileName="data.json.gz"
        onReconnect={mockOnReconnect}
        onWorkOffline={mockOnWorkOffline}
      />,
      { wrapper: Wrapper }
    )

    expect(screen.getByText(/session has expired/i)).toBeInTheDocument()
  })

  it('should display the file name', () => {
    render(
      <ReconnectModal
        opened={true}
        fileName="my-meal-plan.json.gz"
        onReconnect={mockOnReconnect}
        onWorkOffline={mockOnWorkOffline}
      />,
      { wrapper: Wrapper }
    )

    expect(screen.getByText(/my-meal-plan\.json\.gz/)).toBeInTheDocument()
  })

  it('should have Reconnect to OneDrive button', () => {
    render(
      <ReconnectModal
        opened={true}
        fileName="data.json.gz"
        onReconnect={mockOnReconnect}
        onWorkOffline={mockOnWorkOffline}
      />,
      { wrapper: Wrapper }
    )

    expect(
      screen.getByRole('button', { name: /reconnect to onedrive/i })
    ).toBeInTheDocument()
  })

  it('should have Work Offline button', () => {
    render(
      <ReconnectModal
        opened={true}
        fileName="data.json.gz"
        onReconnect={mockOnReconnect}
        onWorkOffline={mockOnWorkOffline}
      />,
      { wrapper: Wrapper }
    )

    expect(
      screen.getByRole('button', { name: /work offline/i })
    ).toBeInTheDocument()
  })

  it('should call onReconnect when Reconnect button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <ReconnectModal
        opened={true}
        fileName="data.json.gz"
        onReconnect={mockOnReconnect}
        onWorkOffline={mockOnWorkOffline}
      />,
      { wrapper: Wrapper }
    )

    const reconnectButton = screen.getByRole('button', {
      name: /reconnect to onedrive/i,
    })
    await user.click(reconnectButton)

    expect(mockOnReconnect).toHaveBeenCalledOnce()
  })

  it('should call onWorkOffline when Work Offline button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <ReconnectModal
        opened={true}
        fileName="data.json.gz"
        onReconnect={mockOnReconnect}
        onWorkOffline={mockOnWorkOffline}
      />,
      { wrapper: Wrapper }
    )

    const workOfflineButton = screen.getByRole('button', {
      name: /work offline/i,
    })
    await user.click(workOfflineButton)

    expect(mockOnWorkOffline).toHaveBeenCalledOnce()
  })

  it('should not allow dismissing by clicking outside', () => {
    render(
      <ReconnectModal
        opened={true}
        fileName="data.json.gz"
        onReconnect={mockOnReconnect}
        onWorkOffline={mockOnWorkOffline}
      />,
      { wrapper: Wrapper }
    )

    // Modal should not have close button or allow clicking overlay
    expect(screen.queryByLabelText(/close/i)).not.toBeInTheDocument()
  })

  it('should show helpful explanation message', () => {
    render(
      <ReconnectModal
        opened={true}
        fileName="data.json.gz"
        onReconnect={mockOnReconnect}
        onWorkOffline={mockOnWorkOffline}
      />,
      { wrapper: Wrapper }
    )

    expect(
      screen.getByText(/reconnect to continue syncing/i)
    ).toBeInTheDocument()
  })
})
