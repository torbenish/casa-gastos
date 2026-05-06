'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Home, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin() {
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('Email ou senha incorretos.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="mb-8 text-center">
          <div className="flex justify-center mb-3">
            <div className="bg-violet-600 p-3 rounded-2xl">
              <Home className="text-white w-6 h-6" />
            </div>
          </div>
          <h1 className="text-white text-2xl font-semibold">Casa Gastos</h1>
          <p className="text-zinc-400 text-sm mt-1">Controle financeiro do lar</p>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">Entrar</CardTitle>
            <CardDescription className="text-zinc-400">
              Acesse sua conta para continuar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="space-y-1">
              <Label htmlFor="email" className="text-zinc-400 text-sm">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-violet-600"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-zinc-400 text-sm">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-red-600"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <Button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>

          </CardContent>
        </Card>

      </div>
    </div>
  )
}