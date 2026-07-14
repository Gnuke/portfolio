import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminApp from './AdminApp'
import { createFakeAdminRepository } from '../test/fakes'

describe('AdminApp — 세션 게이트', () => {
  test('세션이 없으면 로그인 화면만 표시하고 관리 UI를 노출하지 않는다', async () => {
    const repo = createFakeAdminRepository({ session: null })
    render(<AdminApp repo={repo} />)

    expect(await screen.findByLabelText('이메일')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '로그아웃' })).not.toBeInTheDocument()
  })

  test('세션이 있으면 대시보드와 로그아웃 버튼을 표시한다', async () => {
    const repo = createFakeAdminRepository({
      session: { email: 'admin@example.com' },
    })
    render(<AdminApp repo={repo} />)

    expect(await screen.findByRole('button', { name: '로그아웃' })).toBeInTheDocument()
    expect(screen.getByText('admin@example.com')).toBeInTheDocument()
    expect(screen.queryByLabelText('이메일')).not.toBeInTheDocument()
  })

  test('로그인에 성공하면 대시보드로 전환된다', async () => {
    const user = userEvent.setup()
    const repo = createFakeAdminRepository({ session: null })
    render(<AdminApp repo={repo} />)

    await user.type(await screen.findByLabelText('이메일'), 'admin@example.com')
    await user.type(screen.getByLabelText('비밀번호'), 'correct-password')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByRole('button', { name: '로그아웃' })).toBeInTheDocument()
  })

  test('로그아웃하면 로그인 화면으로 돌아간다', async () => {
    const user = userEvent.setup()
    const repo = createFakeAdminRepository({
      session: { email: 'admin@example.com' },
    })
    render(<AdminApp repo={repo} />)

    await user.click(await screen.findByRole('button', { name: '로그아웃' }))

    expect(await screen.findByLabelText('이메일')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '로그아웃' })).not.toBeInTheDocument()
  })
})
