import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginForm from './LoginForm'
import { createFakeAdminRepository } from '../test/fakes'

describe('LoginForm', () => {
  test('이메일과 비밀번호를 입력해 제출하면 signIn이 호출된다', async () => {
    const user = userEvent.setup()
    const repo = createFakeAdminRepository()
    const signIn = vi.spyOn(repo, 'signIn')

    render(<LoginForm repo={repo} />)
    await user.type(screen.getByLabelText('이메일'), 'admin@example.com')
    await user.type(screen.getByLabelText('비밀번호'), 'correct-password')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(signIn).toHaveBeenCalledWith('admin@example.com', 'correct-password')
  })

  test('빈 필드로 제출하면 signIn을 호출하지 않고 안내를 표시한다', async () => {
    const user = userEvent.setup()
    const repo = createFakeAdminRepository()
    const signIn = vi.spyOn(repo, 'signIn')

    render(<LoginForm repo={repo} />)
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(signIn).not.toHaveBeenCalled()
    expect(screen.getByText('이메일과 비밀번호를 입력해 주세요.')).toBeInTheDocument()
  })

  test('로그인 실패 시 원인을 특정하지 않는 일반 메시지를 표시한다', async () => {
    const user = userEvent.setup()
    const repo = createFakeAdminRepository()

    render(<LoginForm repo={repo} />)
    await user.type(screen.getByLabelText('이메일'), 'admin@example.com')
    await user.type(screen.getByLabelText('비밀번호'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(
      await screen.findByText('이메일 또는 비밀번호가 올바르지 않습니다.'),
    ).toBeInTheDocument()
    // 어떤 필드가 틀렸는지 노출하지 않는다
    expect(screen.queryByText(/비밀번호가 틀렸/)).not.toBeInTheDocument()
  })
})
