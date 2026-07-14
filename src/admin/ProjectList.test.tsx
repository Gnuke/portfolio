import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProjectList from './ProjectList'
import { buildProject } from '../test/fakes'

describe('ProjectList', () => {
  const projects = [
    buildProject({ title: '진행 중인 것', status: 'current' }),
    buildProject({ title: '완성한 것', status: 'completed' }),
    buildProject({ title: '예정인 것', status: 'planned' }),
  ]

  test('제목과 상태 배지를 한눈에 구분할 수 있다', () => {
    render(<ProjectList projects={projects} onEdit={() => {}} onDelete={() => {}} />)

    expect(screen.getByText('진행 중인 것')).toBeInTheDocument()
    expect(screen.getByText('완성한 것')).toBeInTheDocument()
    expect(screen.getByText('예정인 것')).toBeInTheDocument()
    expect(screen.getByText('진행 중')).toBeInTheDocument()
    expect(screen.getByText('완성')).toBeInTheDocument()
    expect(screen.getByText('예정')).toBeInTheDocument()
  })

  test('수정 버튼은 해당 프로젝트로 onEdit을 호출한다', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(<ProjectList projects={projects} onEdit={onEdit} onDelete={() => {}} />)

    await user.click(screen.getAllByRole('button', { name: '수정' })[1])
    expect(onEdit).toHaveBeenCalledWith(projects[1])
  })

  test('삭제는 확인 절차를 거친 후에만 onDelete를 호출한다', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<ProjectList projects={projects} onEdit={() => {}} onDelete={onDelete} />)
    await user.click(screen.getAllByRole('button', { name: '삭제' })[0])

    expect(confirmSpy).toHaveBeenCalled()
    expect(onDelete).toHaveBeenCalledWith(projects[0])
    confirmSpy.mockRestore()
  })

  test('확인을 취소하면 onDelete를 호출하지 않는다', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

    render(<ProjectList projects={projects} onEdit={() => {}} onDelete={onDelete} />)
    await user.click(screen.getAllByRole('button', { name: '삭제' })[0])

    expect(onDelete).not.toHaveBeenCalled()
    confirmSpy.mockRestore()
  })
})
