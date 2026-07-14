import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

function Probe() {
  const [clicked, setClicked] = useState(false)
  return (
    <button onClick={() => setClicked(true)}>
      {clicked ? 'clicked' : 'idle'}
    </button>
  )
}

test('renders a component into jsdom', () => {
  render(<Probe />)
  expect(screen.getByRole('button')).toHaveTextContent('idle')
})

test('user interaction updates state', async () => {
  const user = userEvent.setup()
  render(<Probe />)
  await user.click(screen.getByRole('button'))
  expect(screen.getByRole('button')).toHaveTextContent('clicked')
})
