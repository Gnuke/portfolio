import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ImageUploader from './ImageUploader'
import { buildImage, buildProject, createFakeAdminRepository } from '../test/fakes'

function pngFile(name = 'shot.png') {
  return new File(['png-bytes'], name, { type: 'image/png' })
}

describe('ImageUploader', () => {
  test('유효한 이미지를 선택하면 uploadImage가 호출되고 미리보기가 나타난다', async () => {
    const user = userEvent.setup()
    const project = buildProject()
    const repo = createFakeAdminRepository({ projects: [project] })
    const uploadImage = vi.spyOn(repo, 'uploadImage')

    render(<ImageUploader repo={repo} project={project} />)
    await user.upload(screen.getByLabelText('이미지 추가'), pngFile())

    expect(uploadImage).toHaveBeenCalledWith(project.id, expect.any(File))
    expect(await screen.findByRole('img')).toBeInTheDocument()
  })

  test('이미지가 아닌 파일은 거부하고 허용 형식을 안내한다', async () => {
    const user = userEvent.setup()
    const project = buildProject()
    const repo = createFakeAdminRepository({ projects: [project] })
    const uploadImage = vi.spyOn(repo, 'uploadImage')

    render(<ImageUploader repo={repo} project={project} />)
    const bad = new File(['pdf'], 'doc.pdf', { type: 'application/pdf' })
    await user.upload(screen.getByLabelText('이미지 추가'), bad)

    expect(uploadImage).not.toHaveBeenCalled()
    expect(
      screen.getByText('이미지 파일만 업로드할 수 있습니다 (PNG, JPEG, WebP, GIF).'),
    ).toBeInTheDocument()
  })

  test('용량 초과 파일은 거부하고 최대 용량을 안내한다', async () => {
    const user = userEvent.setup()
    const project = buildProject()
    const repo = createFakeAdminRepository({ projects: [project] })
    const uploadImage = vi.spyOn(repo, 'uploadImage')

    render(<ImageUploader repo={repo} project={project} />)
    const big = pngFile('big.png')
    Object.defineProperty(big, 'size', { value: 6 * 1024 * 1024 })
    await user.upload(screen.getByLabelText('이미지 추가'), big)

    expect(uploadImage).not.toHaveBeenCalled()
    expect(screen.getByText('파일당 최대 5MB까지 업로드할 수 있습니다.')).toBeInTheDocument()
  })

  test('이미지를 개별 삭제할 수 있다', async () => {
    const user = userEvent.setup()
    const image = buildImage()
    const project = buildProject({ images: [image] })
    const repo = createFakeAdminRepository({ projects: [project] })
    const deleteImage = vi.spyOn(repo, 'deleteImage')

    render(<ImageUploader repo={repo} project={project} />)
    await user.click(screen.getByRole('button', { name: '삭제' }))

    expect(deleteImage).toHaveBeenCalledWith(image.id)
  })

  test('대표 지정 시 setCoverImage가 호출되고 대표 표시가 갱신된다', async () => {
    const user = userEvent.setup()
    const a = buildImage()
    const b = buildImage()
    const project = buildProject({ images: [a, b] })
    const repo = createFakeAdminRepository({ projects: [project] })
    const setCoverImage = vi.spyOn(repo, 'setCoverImage')

    render(<ImageUploader repo={repo} project={project} />)
    await user.click(screen.getAllByRole('button', { name: '대표 지정' })[1])

    expect(setCoverImage).toHaveBeenCalledWith(project.id, b.id)
    expect(await screen.findByText('대표')).toBeInTheDocument()
  })

  test('업로드 실패 시 안내를 표시하고 재시도할 수 있다', async () => {
    const user = userEvent.setup()
    const project = buildProject()
    const repo = createFakeAdminRepository({ projects: [project] })
    vi.spyOn(repo, 'uploadImage').mockRejectedValueOnce(new Error('network'))

    render(<ImageUploader repo={repo} project={project} />)
    await user.upload(screen.getByLabelText('이미지 추가'), pngFile())

    expect(
      await screen.findByText('업로드에 실패했습니다. 다시 시도해 주세요.'),
    ).toBeInTheDocument()

    // 재시도 — 두 번째는 성공
    await user.upload(screen.getByLabelText('이미지 추가'), pngFile('retry.png'))
    expect(await screen.findByRole('img')).toBeInTheDocument()
  })
})
