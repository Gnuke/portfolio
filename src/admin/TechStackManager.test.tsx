import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TechStackManager from './TechStackManager'
import { buildCategory, buildTech, createFakeAdminRepository } from '../test/fakes'
import { techColorFor } from '../data/techColors'

describe('TechStackManager', () => {
  test('기술 스택 목록을 불러와 표시한다', async () => {
    const repo = createFakeAdminRepository({
      tech: [buildTech({ name: 'Java' }), buildTech({ name: 'React' })],
    })
    render(<TechStackManager repo={repo} />)

    expect(await screen.findByText('Java')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
  })

  test('이름을 입력해 추가하면 createTech가 호출되고 목록에 나타난다', async () => {
    const user = userEvent.setup()
    const repo = createFakeAdminRepository()
    const createTech = vi.spyOn(repo, 'createTech')
    render(<TechStackManager repo={repo} />)

    await user.type(await screen.findByLabelText('기술 이름'), 'Docker')
    await user.click(screen.getByRole('button', { name: '추가' }))

    expect(createTech).toHaveBeenCalledWith(expect.objectContaining({ name: 'Docker' }))
    expect(await screen.findByText('Docker')).toBeInTheDocument()
  })

  test('추가 시 이름에 맞는 책등 색을 자동 배정한다', async () => {
    const user = userEvent.setup()
    const repo = createFakeAdminRepository()
    const createTech = vi.spyOn(repo, 'createTech')
    render(<TechStackManager repo={repo} />)

    await user.type(await screen.findByLabelText('기술 이름'), 'Grafana')
    await user.click(screen.getByRole('button', { name: '추가' }))

    expect(createTech).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Grafana', color: techColorFor('Grafana') }),
    )
  })

  test('목록의 각 기술 앞에 배정된 색 견본을 보여준다', async () => {
    const item = buildTech({ name: 'Java', color: '#e76f51' })
    const repo = createFakeAdminRepository({ tech: [item] })
    const { container } = render(<TechStackManager repo={repo} />)

    await screen.findByText('Java')
    const swatch = container.querySelector('.admin-swatch')
    expect(swatch).not.toBeNull()
    expect(swatch).toHaveStyle({ background: '#e76f51' })
  })

  test('이름이 비어 있으면 추가를 거부하고 안내한다', async () => {
    const user = userEvent.setup()
    const repo = createFakeAdminRepository()
    const createTech = vi.spyOn(repo, 'createTech')
    render(<TechStackManager repo={repo} />)

    await user.click(await screen.findByRole('button', { name: '추가' }))

    expect(createTech).not.toHaveBeenCalled()
    expect(screen.getByText('기술 이름을 입력해 주세요.')).toBeInTheDocument()
  })

  test('수정 후 저장하면 updateTech가 호출된다', async () => {
    const user = userEvent.setup()
    const item = buildTech({ name: 'Vue.js' })
    const repo = createFakeAdminRepository({ tech: [item] })
    const updateTech = vi.spyOn(repo, 'updateTech')
    render(<TechStackManager repo={repo} />)

    await user.click(await screen.findByRole('button', { name: '수정' }))
    const nameInput = screen.getByLabelText('기술 이름 수정')
    await user.clear(nameInput)
    await user.type(nameInput, 'Nuxt.js')
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(updateTech).toHaveBeenCalledWith(item.id, expect.objectContaining({ name: 'Nuxt.js' }))
    expect(await screen.findByText('Nuxt.js')).toBeInTheDocument()
  })

  test('이름을 수정하면 새 이름에 맞는 색을 다시 배정한다', async () => {
    const user = userEvent.setup()
    const item = buildTech({ name: 'Recat', color: '#7f9aa6' })
    const repo = createFakeAdminRepository({ tech: [item] })
    const updateTech = vi.spyOn(repo, 'updateTech')
    render(<TechStackManager repo={repo} />)

    await user.click(await screen.findByRole('button', { name: '수정' }))
    const nameInput = screen.getByLabelText('기술 이름 수정')
    await user.clear(nameInput)
    await user.type(nameInput, 'React')
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(updateTech).toHaveBeenCalledWith(
      item.id,
      expect.objectContaining({ name: 'React', color: techColorFor('React') }),
    )
  })

  test('분류 드롭다운은 저장된 선반 목록으로 채워진다', async () => {
    const repo = createFakeAdminRepository({
      categories: [buildCategory({ name: '한글선반', displayOrder: 1 })],
    })
    render(<TechStackManager repo={repo} />)

    expect(await screen.findByRole('option', { name: '한글선반' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '미분류' })).toBeInTheDocument()
  })

  test('선반을 추가하면 분류 드롭다운에도 나타난다', async () => {
    const user = userEvent.setup()
    const repo = createFakeAdminRepository()
    render(<TechStackManager repo={repo} />)

    await user.type(await screen.findByLabelText('새 선반 이름'), 'AI')
    await user.click(screen.getByRole('button', { name: '선반 추가' }))

    expect(await screen.findByRole('option', { name: 'AI' })).toBeInTheDocument()
  })

  test('선반 이름을 바꾸면 소속 기술의 분류 표시도 갱신된다', async () => {
    const user = userEvent.setup()
    const repo = createFakeAdminRepository({
      tech: [buildTech({ name: 'Spring Boot', category: 'Backend' })],
    })
    render(<TechStackManager repo={repo} />)

    await user.click(await screen.findByRole('button', { name: 'Backend 선반 이름 변경' }))
    const input = screen.getByLabelText('선반 이름 수정')
    await user.clear(input)
    await user.type(input, 'Server')
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('Server', { selector: '.admin-badge' })).toBeInTheDocument()
  })

  test('선반 삭제는 확인 후 진행되고 소속 기술은 미분류로 표시된다', async () => {
    const user = userEvent.setup()
    const repo = createFakeAdminRepository({
      tech: [buildTech({ name: 'React', category: 'Frontend' })],
    })
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<TechStackManager repo={repo} />)

    await user.click(await screen.findByRole('button', { name: 'Frontend 선반 삭제' }))

    expect(confirmSpy).toHaveBeenCalled()
    expect(await screen.findByText('미분류', { selector: '.admin-badge' })).toBeInTheDocument()
    confirmSpy.mockRestore()
  })

  test('선반을 위로 옮기면 새 순서가 저장된다', async () => {
    const user = userEvent.setup()
    const repo = createFakeAdminRepository({
      categories: [
        buildCategory({ name: 'Language', displayOrder: 1 }),
        buildCategory({ name: 'Backend', displayOrder: 2 }),
      ],
    })
    render(<TechStackManager repo={repo} />)

    await user.click(await screen.findByRole('button', { name: 'Backend 위로' }))

    const names = (await repo.listCategories()).map((c) => c.name)
    expect(names).toEqual(['Backend', 'Language'])
  })

  test('삭제는 확인 절차 후에만 deleteTech를 호출한다', async () => {
    const user = userEvent.setup()
    const item = buildTech({ name: 'Redis' })
    const repo = createFakeAdminRepository({ tech: [item] })
    const deleteTech = vi.spyOn(repo, 'deleteTech')
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<TechStackManager repo={repo} />)
    await user.click(await screen.findByRole('button', { name: '삭제' }))

    expect(confirmSpy).toHaveBeenCalled()
    expect(deleteTech).toHaveBeenCalledWith(item.id)
    confirmSpy.mockRestore()
  })
})
