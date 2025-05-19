"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ArrowLeft, AlertTriangle, Info, Shield, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AuthService } from "@/lib/services/auth-service"

export default function AdminPasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [initialSetup, setInitialSetup] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  
  // Estados para controlar a visibilidade das senhas
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    // Verificar se está autenticado
    const authStatus = localStorage.getItem("admin_authenticated")
    setIsAuthenticated(authStatus === "true")

    // Verificar se já existe uma senha definida no banco de dados
    async function checkPasswordSetup() {
      try {
        const hasPassword = await AuthService.hasAdminPassword()
        setInitialSetup(!hasPassword)
        setIsCheckingAuth(false)
      } catch (error) {
        console.error("Erro ao verificar configuração de senha:", error)
        setIsCheckingAuth(false)
      }
    }
    
    checkPasswordSetup()
  }, [])

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Verificação para configuração inicial
      if (initialSetup) {
        if (newPassword !== confirmPassword) {
          toast.error("As senhas não coincidem!")
          setIsLoading(false)
          return
        }

        if (newPassword.length < 6) {
          toast.error("A senha deve ter pelo menos 6 caracteres!")
          setIsLoading(false)
          return
        }

        try {
          console.log('Iniciando processo de configuração inicial de senha...');
          
          // Salvar a nova senha no banco de dados com hash seguro
          const result = await AuthService.saveAdminPassword(newPassword);
          
          if (result.success) {
            console.log('Senha inicial definida com sucesso!');
            toast.success("Senha definida com sucesso!");
            toast.info("Sua senha foi armazenada de forma segura no banco de dados.");
            
            // Autenticar o usuário após definir a senha inicial
            localStorage.setItem("admin_authenticated", "true");
            setInitialSetup(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
          } else {
            console.error('Erro ao salvar a senha inicial:', result.error);
            toast.error("Erro ao salvar a senha no banco de dados!");
            
            if (result.error) {
              if (typeof result.error === 'object') {
                toast.error(`Detalhes: ${JSON.stringify(result.error)}`);
              } else {
                toast.error(`Detalhes: ${result.error}`);
              }
            }
          }
        } catch (saveError) {
          console.error('Exceção ao salvar senha inicial:', saveError);
          toast.error("Erro inesperado ao salvar a senha!");
        }
      } else {
        // Verificação para alteração de senha
        // Primeiro verificar se a senha atual está correta
        const isCurrentPasswordValid = await AuthService.verifyAdminPassword(currentPassword)
        
        if (!isCurrentPasswordValid) {
          toast.error("Senha atual incorreta!")
          setIsLoading(false)
          return
        }

        if (newPassword !== confirmPassword) {
          toast.error("As senhas não coincidem!")
          setIsLoading(false)
          return
        }

        if (newPassword.length < 6) {
          toast.error("A senha deve ter pelo menos 6 caracteres!")
          setIsLoading(false)
          return
        }

        try {
          console.log('Iniciando processo de alteração de senha...');
          
          // Salvar a nova senha no banco de dados com hash seguro
          const result = await AuthService.saveAdminPassword(newPassword);
          
          if (result.success) {
            console.log('Senha alterada com sucesso!');
            toast.success("Senha alterada com sucesso!");
            toast.info("Sua senha foi armazenada de forma segura no banco de dados.");
            
            // Limpar os campos do formulário
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
          } else {
            console.error('Erro ao salvar a senha:', result.error);
            toast.error("Erro ao salvar a senha no banco de dados!");
            
            if (result.error) {
              if (typeof result.error === 'object') {
                toast.error(`Detalhes: ${JSON.stringify(result.error)}`);
              } else {
                toast.error(`Detalhes: ${result.error}`);
              }
            }
          }
        } catch (saveError) {
          console.error('Exceção ao salvar senha:', saveError);
          toast.error("Erro inesperado ao salvar a senha!");
        }
      }
    } catch (error) {
      toast.error("Erro ao processar a senha!")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Link href="/admin" className="mr-4">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Configuração de Senha</h1>
      </div>

      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-bold">
            {initialSetup ? "Definir Senha de Administrador" : "Alterar Senha de Administrador"}
          </CardTitle>
          <CardDescription>
            {initialSetup 
              ? "Defina uma senha para proteger o acesso ao painel administrativo" 
              : "Altere sua senha de acesso ao painel administrativo"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSavePassword}>
          <CardContent className="space-y-4">
            {!initialSetup && (
              <div className="space-y-2">
                <Label htmlFor="current-password">Senha Atual</Label>
                <div className="relative">
                  <Input 
                    id="current-password" 
                    type={showCurrentPassword ? "text" : "password"} 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Digite sua senha atual"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    aria-label={showCurrentPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <div className="relative">
                <Input 
                  id="new-password" 
                  type={showNewPassword ? "text" : "password"} 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite a nova senha"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-500">A senha deve ter pelo menos 6 caracteres</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input 
                  id="confirm-password" 
                  type={showConfirmPassword ? "text" : "password"} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme a nova senha"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full bg-purple-700 hover:bg-purple-800"
              disabled={isLoading}
            >
              {isLoading ? "Salvando..." : "Salvar Senha"}
            </Button>
          </CardFooter>
        </form>
      </Card>


    </div>
  )
}
