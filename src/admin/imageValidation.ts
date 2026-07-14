export const MAX_FILE_BYTES = 5 * 1024 * 1024
export const MAX_IMAGES_PER_PROJECT = 10

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

/** FR-013: 형식·용량·개수 검증 (클라이언트 선검증 — 서버는 버킷 설정으로 강제) */
export function validateImageFile(
  file: { type: string; size: number },
  currentCount: number,
): { ok: true } | { ok: false; reason: 'type' | 'size' | 'count' } {
  if (currentCount >= MAX_IMAGES_PER_PROJECT) return { ok: false, reason: 'count' }
  if (!ALLOWED_TYPES.includes(file.type)) return { ok: false, reason: 'type' }
  if (file.size > MAX_FILE_BYTES) return { ok: false, reason: 'size' }
  return { ok: true }
}
