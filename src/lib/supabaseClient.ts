import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

/** 지연 생성 싱글턴 — 테스트에서는 이 함수를 호출하지 않고 스텁을 주입한다. */
export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    if (!url || !key) {
      throw new Error(
        'VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY 환경 변수가 필요합니다 (.env.local).',
      )
    }
    client = createClient(url, key)
  }
  return client
}
