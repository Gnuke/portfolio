import { useState, type FormEvent } from 'react'
import type { AdminRepository } from './adminRepository.types'

export default function LoginForm({ repo }: { repo: AdminRepository }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('이메일과 비밀번호를 입력해 주세요.')
      return
    }
    setError(null)
    setBusy(true)
    try {
      await repo.signIn(email, password)
    } catch {
      // 어떤 정보가 틀렸는지 특정하지 않는다 (FR-004)
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="admin-login" onSubmit={onSubmit}>
      <h1 className="admin-login-title">Only-One Room · Admin</h1>
      <label className="admin-field">
        이메일
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
        />
      </label>
      <label className="admin-field">
        비밀번호
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </label>
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy}>
        로그인
      </button>
    </form>
  )
}
