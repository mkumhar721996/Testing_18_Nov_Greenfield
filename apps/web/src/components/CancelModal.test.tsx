import { fireEvent, render, screen } from '@testing-library/react'
import { CancelModal } from './CancelModal'

describe('CancelModal', () => {
  it('renders nothing when closed', () => {
    render(<CancelModal open={false} approverName="Arjun" onConfirm={vi.fn()} onClose={vi.fn()} />)
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })

  it('AC10: confirms the cancellation', () => {
    const onConfirm = vi.fn()
    render(<CancelModal open approverName="Arjun" onConfirm={onConfirm} onClose={vi.fn()} />)
    expect(screen.getByRole('alertdialog')).toHaveTextContent(/Arjun will no longer see it/)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel request' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('keeps the request on "Keep request" and on Escape', () => {
    const onClose = vi.fn()
    render(<CancelModal open approverName="Arjun" onConfirm={vi.fn()} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Keep request' }))
    fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('shows a spinner and disables the buttons while cancelling', () => {
    render(<CancelModal open busy approverName="Arjun" onConfirm={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Cancelling request/ })).toBeDisabled()
  })
})
