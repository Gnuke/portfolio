import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InformationPanel from './InformationPanel'
import { ContentContext } from '../context/ContentContext'
import { ROOM_OBJECTS } from '../data/scene'
import type { RoomContent } from '../data/types'
import { buildImage, buildProject, buildRoomContent, buildTech } from '../test/fakes'

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

  test('책장은 기술 스택을 표시하고 미분류는 Tool 선반에 놓인다', () => {
    const content = buildRoomContent({
      techStack: [
        buildTech({ name: 'Java', category: 'Language' }),
        buildTech({ name: 'MyTool', category: null }),
      ],
    })
    renderPanel(bookshelf, content)
    expect(screen.getByText('Java')).toBeInTheDocument()
    expect(screen.getByText('MyTool')).toBeInTheDocument()
  })

  test('기술 스택이 0건이면 준비 중 안내를 표시한다', () => {
    renderPanel(bookshelf, buildRoomContent({ techStack: [] }))
    expect(screen.getByText(/준비 중/)).toBeInTheDocument()
  })
})
