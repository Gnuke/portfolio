import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProjectForm from './ProjectForm'
import { buildProject, createFakeAdminRepository } from '../test/fakes'

describe('ProjectForm — 등록', () => {
  test('필수 항목이 비면 저장을 거부하고 누락 항목을 안내한다', async () => {
    const user = userEvent.setup()
    const repo = createFakeAdminRepository()
    const createProject = vi.spyOn(repo, 'createProject')
    const onSaved = vi.fn()

    render(<ProjectForm repo={repo} project={null} onSaved={onSaved} onCancel={() => {}} />)
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(createProject).not.toHaveBeenCalled()
    expect(onSaved).not.toHaveBeenCalled()
    expect(screen.getByText('제목을 입력해 주세요.')).toBeInTheDocument()
    expect(screen.getByText('설명을 입력해 주세요.')).toBeInTheDocument()
  })

  test('유효한 입력이면 createProject를 호출하고 onSaved를 부른다', async () => {
    const user = userEvent.setup()
    const repo = createFakeAdminRepository()
    const createProject = vi.spyOn(repo, 'createProject')
    const onSaved = vi.fn()

    render(<ProjectForm repo={repo} project={null} onSaved={onSaved} onCancel={() => {}} />)
    await user.type(screen.getByLabelText('제목'), '새 프로젝트')
    await user.type(screen.getByLabelText(/설명/), '## 소개\n\n마크다운 설명')
    await user.selectOptions(screen.getByLabelText('상태'), 'completed')
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(createProject).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '새 프로젝트',
        status: 'completed',
      }),
    )
    expect(onSaved).toHaveBeenCalled()
  })

  test('상태는 진행 중/완성/예정 3가지를 선택할 수 있다', () => {
    const repo = createFakeAdminRepository()
    render(<ProjectForm repo={repo} project={null} onSaved={() => {}} onCancel={() => {}} />)

    const select = screen.getByLabelText('상태') as HTMLSelectElement
    const values = Array.from(select.options).map((o) => o.value)
    expect(values).toEqual(['current', 'completed', 'planned'])
  })
})

describe('ProjectForm — 수정', () => {
  test('기존 프로젝트 값이 채워지고 저장 시 updateProject를 호출한다', async () => {
    const user = userEvent.setup()
    const project = buildProject({ title: '기존 제목', description: '기존 설명', status: 'current' })
    const repo = createFakeAdminRepository({ projects: [project] })
    const updateProject = vi.spyOn(repo, 'updateProject')
    const onSaved = vi.fn()

    render(<ProjectForm repo={repo} project={project} onSaved={onSaved} onCancel={() => {}} />)

    expect(screen.getByLabelText('제목')).toHaveValue('기존 제목')

    await user.selectOptions(screen.getByLabelText('상태'), 'planned')
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(updateProject).toHaveBeenCalledWith(
      project.id,
      expect.objectContaining({ title: '기존 제목', status: 'planned' }),
    )
    expect(onSaved).toHaveBeenCalled()
  })
})
