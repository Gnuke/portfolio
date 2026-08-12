import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InformationPanel from './InformationPanel'
import { ContentContext } from '../context/ContentContext'
import { ROOM_OBJECTS } from '../data/scene'
import type { RoomContent } from '../data/types'
import {
  buildCategory,
  buildImage,
  buildProject,
  buildRoomContent,
  buildTech,
} from '../test/fakes'

const laptop = ROOM_OBJECTS.find((o) => o.id === 'laptop')!
const bookshelf = ROOM_OBJECTS.find((o) => o.id === 'bookshelf')!
const whiteboard = ROOM_OBJECTS.find((o) => o.id === 'whiteboard')!

function renderPanel(object: (typeof ROOM_OBJECTS)[number], content: RoomContent) {
  return render(
    <ContentContext.Provider value={content}>
      <InformationPanel object={object} onClose={() => {}} />
    </ContentContext.Provider>,
  )
}

describe('InformationPanel — 노트북 (FR-016, FR-017)', () => {
  const content = buildRoomContent({
    laptopProjects: [
      buildProject({ title: 'Alpha', status: 'current', description: '**강조** 본문' }),
      buildProject({ title: 'Beta', status: 'completed', description: '베타 설명' }),
    ],
  })

  test('첫 프로젝트(진행 중)와 상태 배지를 표시한다', () => {
    renderPanel(laptop, content)
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('진행 중')).toBeInTheDocument()
  })

  test('마크다운 설명이 서식 적용되어 렌더링된다', () => {
    renderPanel(laptop, content)
    const strong = screen.getByText('강조')
    expect(strong.tagName).toBe('STRONG')
  })

  test('원시 HTML은 실행되지 않는다 (안전 렌더링)', () => {
    const risky = buildRoomContent({
      laptopProjects: [
        buildProject({
          title: 'Risky',
          description: '<script>window.pwned = true</script>안전한 텍스트',
        }),
      ],
    })
    const { container } = renderPanel(laptop, risky)
    expect(container.querySelector('script')).toBeNull()
    expect((window as { pwned?: boolean }).pwned).toBeUndefined()
  })

  test('다음 프로젝트로 전환하면 완성 배지가 표시된다', async () => {
    const user = userEvent.setup()
    renderPanel(laptop, content)

    await user.click(screen.getByRole('button', { name: '다음 프로젝트' }))

    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.getByText('완성')).toBeInTheDocument()
  })

  test('프로젝트가 0건이면 준비 중 안내를 표시한다 (FR-018)', () => {
    renderPanel(laptop, buildRoomContent({ laptopProjects: [] }))
    expect(screen.getByText(/준비 중/)).toBeInTheDocument()
  })
})

describe('InformationPanel — 이미지 갤러리 (FR-021)', () => {
  const withImages = buildRoomContent({
    laptopProjects: [
      buildProject({
        title: 'Gallery',
        images: [
          buildImage({ id: 'cover', url: 'https://cdn.test/cover.png', isCover: true }),
          buildImage({ id: 'second', url: 'https://cdn.test/second.png' }),
        ],
      }),
    ],
  })

  test('대표 이미지가 먼저 표시된다', () => {
    renderPanel(laptop, withImages)
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://cdn.test/cover.png')
  })

  test('다음 이미지로 넘겨볼 수 있다', async () => {
    const user = userEvent.setup()
    renderPanel(laptop, withImages)

    await user.click(screen.getByRole('button', { name: '다음 이미지' }))

    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://cdn.test/second.png')
  })

  test('이미지를 클릭하면 크게 보기 오버레이가 열린다', async () => {
    const user = userEvent.setup()
    renderPanel(laptop, withImages)

    await user.click(screen.getByRole('button', { name: '이미지 크게 보기' }))

    const dialog = screen.getByRole('dialog', { name: '이미지 크게 보기' })
    expect(within(dialog).getByRole('img')).toHaveAttribute(
      'src',
      'https://cdn.test/cover.png',
    )
  })

  // 패널 자체도 role="dialog"이므로 라이트박스는 접근성 이름으로 구분해 조회한다
  test('크게 보기는 닫기 버튼으로 닫힌다', async () => {
    const user = userEvent.setup()
    renderPanel(laptop, withImages)
    await user.click(screen.getByRole('button', { name: '이미지 크게 보기' }))
    const lightbox = screen.getByRole('dialog', { name: '이미지 크게 보기' })

    await user.click(within(lightbox).getByRole('button', { name: '닫기' }))

    expect(
      screen.queryByRole('dialog', { name: '이미지 크게 보기' }),
    ).not.toBeInTheDocument()
  })

  test('크게 보기 안에서 다음/이전 버튼으로 이미지를 넘길 수 있다', async () => {
    const user = userEvent.setup()
    renderPanel(laptop, withImages)
    await user.click(screen.getByRole('button', { name: '이미지 크게 보기' }))
    const lightbox = screen.getByRole('dialog', { name: '이미지 크게 보기' })

    await user.click(within(lightbox).getByRole('button', { name: '다음 이미지' }))
    expect(within(lightbox).getByRole('img')).toHaveAttribute(
      'src',
      'https://cdn.test/second.png',
    )
    expect(within(lightbox).getByRole('button', { name: '다음 이미지' })).toBeDisabled()

    await user.click(within(lightbox).getByRole('button', { name: '이전 이미지' }))
    expect(within(lightbox).getByRole('img')).toHaveAttribute(
      'src',
      'https://cdn.test/cover.png',
    )
  })

  test('크게 보기 안에서 방향키로 이미지를 넘길 수 있고, 넘긴 위치가 갤러리에 유지된다', async () => {
    const user = userEvent.setup()
    renderPanel(laptop, withImages)
    await user.click(screen.getByRole('button', { name: '이미지 크게 보기' }))
    const lightbox = screen.getByRole('dialog', { name: '이미지 크게 보기' })

    await user.keyboard('{ArrowRight}')
    expect(within(lightbox).getByRole('img')).toHaveAttribute(
      'src',
      'https://cdn.test/second.png',
    )

    await user.keyboard('{Escape}')
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://cdn.test/second.png')
  })

  test('Escape는 크게 보기만 닫고 바깥 단축키(패널 닫기)로 전파되지 않는다', async () => {
    const user = userEvent.setup()
    const outerEscape = vi.fn()
    window.addEventListener('keydown', outerEscape)
    renderPanel(laptop, withImages)
    await user.click(screen.getByRole('button', { name: '이미지 크게 보기' }))

    await user.keyboard('{Escape}')

    expect(
      screen.queryByRole('dialog', { name: '이미지 크게 보기' }),
    ).not.toBeInTheDocument()
    expect(outerEscape).not.toHaveBeenCalled()
    window.removeEventListener('keydown', outerEscape)
  })
})

describe('InformationPanel — 화이트보드/책장 (FR-016)', () => {
  test('화이트보드는 예정 프로젝트를 표시한다', () => {
    const content = buildRoomContent({
      plannedProjects: [buildProject({ title: '미래 계획', status: 'planned' })],
    })
    renderPanel(whiteboard, content)
    expect(screen.getByText('미래 계획')).toBeInTheDocument()
  })

  test('예정 프로젝트가 0건이면 준비 중 안내를 표시한다', () => {
    renderPanel(whiteboard, buildRoomContent({ plannedProjects: [] }))
    expect(screen.getByText(/준비 중/)).toBeInTheDocument()
  })

  test('책장은 기술 스택을 표시하고 분류 없는 책은 미분류 선반에 놓인다', () => {
    const content = buildRoomContent({
      techStack: [
        buildTech({ name: 'Java', category: 'Language' }),
        buildTech({ name: 'MyTool', category: null }),
      ],
    })
    const { container } = renderPanel(bookshelf, content)
    expect(screen.getByText('Java')).toBeInTheDocument()
    expect(screen.getByText('MyTool')).toBeInTheDocument()
    const labels = [...container.querySelectorAll('.shelf-label b')].map((el) => el.textContent)
    expect(labels).toEqual(['language', '미분류'])
  })

  test('선반은 techCategories의 순서를 따른다', () => {
    const content = buildRoomContent({
      techCategories: [
        buildCategory({ name: 'Tool', displayOrder: 1 }),
        buildCategory({ name: 'Language', displayOrder: 2 }),
      ],
      techStack: [
        buildTech({ name: 'Java', category: 'Language' }),
        buildTech({ name: 'Git', category: 'Tool' }),
      ],
    })
    const { container } = renderPanel(bookshelf, content)
    const labels = [...container.querySelectorAll('.shelf-label b')].map((el) => el.textContent)
    expect(labels).toEqual(['tool', 'language'])
  })

  test('삭제된 선반을 가리키는 책은 미분류 선반으로 흘러내린다', () => {
    const content = buildRoomContent({
      techCategories: [buildCategory({ name: 'Language', displayOrder: 1 })],
      techStack: [buildTech({ name: 'Ghost', category: '없어진선반' })],
    })
    const { container } = renderPanel(bookshelf, content)
    expect(screen.getByText('Ghost')).toBeInTheDocument()
    const labels = [...container.querySelectorAll('.shelf-label b')].map((el) => el.textContent)
    expect(labels).toEqual(['미분류'])
  })

  test('기술 스택이 0건이면 준비 중 안내를 표시한다', () => {
    renderPanel(bookshelf, buildRoomContent({ techStack: [] }))
    expect(screen.getByText(/준비 중/)).toBeInTheDocument()
  })
})
