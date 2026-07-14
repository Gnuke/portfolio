import { render, screen, waitFor } from '@testing-library/react'
import { ContentProvider, useRoomContent } from './ContentContext'
import { buildProject, buildRoomContent } from '../test/fakes'

function Probe() {
  const content = useRoomContent()
  return (
    <div>
      <span data-testid="source">{content.source}</span>
      <span data-testid="title">{content.laptopProjects[0]?.title ?? '(없음)'}</span>
    </div>
  )
}

const remote = buildRoomContent({
  laptopProjects: [buildProject({ title: '원격 프로젝트' })],
  source: 'remote',
})
const cached = buildRoomContent({
  laptopProjects: [buildProject({ title: '캐시 프로젝트' })],
  source: 'cache',
})
const fallback = buildRoomContent({
  laptopProjects: [buildProject({ title: '정적 프로젝트' })],
  source: 'static',
})

describe('ContentProvider — 폴백 체인 (FR-018)', () => {
  test('원격 로드 성공 시 원격 콘텐츠를 표시하고 캐시에 저장한다', async () => {
    const saveCache = vi.fn()
    render(
      <ContentProvider
        sources={{
          fetchRemote: async () => remote,
          loadCache: () => null,
          saveCache,
          loadStatic: () => fallback,
        }}
      >
        <Probe />
      </ContentProvider>,
    )

    expect(await screen.findByText('원격 프로젝트')).toBeInTheDocument()
    expect(screen.getByTestId('source')).toHaveTextContent('remote')
    expect(saveCache).toHaveBeenCalledWith(remote)
  })

  test('원격 실패 시 캐시 콘텐츠를 조용히 표시한다', async () => {
    const fetchRemote = vi.fn(async (): Promise<never> => {
      throw new Error('network down')
    })
    render(
      <ContentProvider
        sources={{
          fetchRemote,
          loadCache: () => cached,
          saveCache: () => {},
          loadStatic: () => fallback,
        }}
      >
        <Probe />
      </ContentProvider>,
    )

    expect(await screen.findByText('캐시 프로젝트')).toBeInTheDocument()
    await waitFor(() => expect(fetchRemote).toHaveBeenCalled())
    // 실패 후에도 캐시가 그대로 표시되고 장애 안내는 없다
    expect(screen.getByTestId('source')).toHaveTextContent('cache')
    expect(screen.queryByText(/오류|실패|장애/)).not.toBeInTheDocument()
  })

  test('원격 실패 + 캐시 없음이면 정적 데이터를 표시한다', async () => {
    render(
      <ContentProvider
        sources={{
          fetchRemote: async () => {
            throw new Error('network down')
          },
          loadCache: () => null,
          saveCache: () => {},
          loadStatic: () => fallback,
        }}
      >
        <Probe />
      </ContentProvider>,
    )

    expect(await screen.findByText('정적 프로젝트')).toBeInTheDocument()
    expect(screen.getByTestId('source')).toHaveTextContent('static')
  })

  test('원격 응답 전에도 빈 화면 없이 직전 데이터(캐시)를 먼저 보여준다', () => {
    let resolveRemote: (v: typeof remote) => void = () => {}
    render(
      <ContentProvider
        sources={{
          fetchRemote: () =>
            new Promise((resolve) => {
              resolveRemote = resolve
            }),
          loadCache: () => cached,
          saveCache: () => {},
          loadStatic: () => fallback,
        }}
      >
        <Probe />
      </ContentProvider>,
    )

    expect(screen.getByText('캐시 프로젝트')).toBeInTheDocument()
    resolveRemote(remote)
  })
})
