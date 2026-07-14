import { MAX_FILE_BYTES, MAX_IMAGES_PER_PROJECT, validateImageFile } from './imageValidation'

describe('validateImageFile — 형식/용량/개수 (FR-013)', () => {
  const MB = 1024 * 1024

  test.each(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])(
    '허용 형식 %s 은 통과한다',
    (type) => {
      expect(validateImageFile({ type, size: 1 * MB }, 0)).toEqual({ ok: true })
    },
  )

  test('이미지가 아닌 파일은 type 사유로 거부한다', () => {
    expect(validateImageFile({ type: 'application/pdf', size: 1 * MB }, 0)).toEqual({
      ok: false,
      reason: 'type',
    })
  })

  test('5MB를 초과하면 size 사유로 거부한다', () => {
    expect(validateImageFile({ type: 'image/png', size: MAX_FILE_BYTES + 1 }, 0)).toEqual({
      ok: false,
      reason: 'size',
    })
  })

  test('정확히 5MB는 허용한다 (경계값)', () => {
    expect(validateImageFile({ type: 'image/png', size: MAX_FILE_BYTES }, 0)).toEqual({
      ok: true,
    })
  })

  test('이미 10장이면 count 사유로 거부한다', () => {
    expect(
      validateImageFile({ type: 'image/png', size: 1 * MB }, MAX_IMAGES_PER_PROJECT),
    ).toEqual({ ok: false, reason: 'count' })
  })

  test('9장까지는 추가할 수 있다 (경계값)', () => {
    expect(
      validateImageFile({ type: 'image/png', size: 1 * MB }, MAX_IMAGES_PER_PROJECT - 1),
    ).toEqual({ ok: true })
  })
})
