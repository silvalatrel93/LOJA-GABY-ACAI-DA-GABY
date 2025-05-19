"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { AuthService } from "@/lib/services/auth-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Eye, EyeOff, RefreshCw } from "lucide-react"
import { testSupabaseConnection, reconnectSupabase } from "@/lib/services/supabase-client"

export default function AdminLoginPage() {
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [initialSetup, setInitialSetup] = useState(false)
  const [isCheckingSetup, setIsCheckingSetup] = useState(true)
  const [connectionError, setConnectionError] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)

  // Verificar a conexão com o banco de dados e se existe uma senha configurada
  const checkDatabaseAndSetup = async () => {
    setIsCheckingSetup(true);
    try {
      // Verificar conexão com o banco de dados
      const isConnected = await testSupabaseConnection();
      setConnectionError(!isConnected);
      
      if (!isConnected) {
        setIsCheckingSetup(false);
        return;
      }
      
      // Verificar se já existe uma senha configurada
      const hasPassword = await AuthService.hasAdminPassword();
      setInitialSetup(!hasPassword);
    } catch (error) {
      console.error("Erro ao verificar configuração:", error);
      setConnectionError(true);
    } finally {
      setIsCheckingSetup(false);
    }
  };
  
  // Carregar a verificação inicial
  useEffect(() => {
    checkDatabaseAndSetup();
  }, []);
  
  // Função para tentar reconectar ao banco de dados
  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      const success = await reconnectSupabase();
      if (success) {
        toast.success("Conexão restabelecida com sucesso!");
        setConnectionError(false);
        // Recarregar a configuração após reconectar
        checkDatabaseAndSetup();
      } else {
        toast.error("Não foi possível restabelecer a conexão.");
      }
    } catch (error) {
      console.error("Erro ao tentar reconectar:", error);
      toast.error("Erro ao tentar reconectar ao banco de dados.");
    } finally {
      setIsReconnecting(false);
    }
  };

  // Função para fazer login usando o AuthService
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Verificar conexão com o banco de dados
      const isConnected = await testSupabaseConnection();
      if (!isConnected) {
        toast.error("Não foi possível conectar ao banco de dados. Tente reconectar.");
        setConnectionError(true);
        setIsLoading(false);
        return;
      }
      
      // Se estiver em configuração inicial, redirecionar para a página de configuração de senha
      if (initialSetup) {
        toast.info("Você precisa configurar uma senha primeiro.");
        window.location.href = "/admin/configuracoes/senha";
        return;
      }
      
      // Verificar a senha usando o AuthService
      toast.loading("Verificando senha...");
      const isValid = await AuthService.verifyAdminPassword(password);
      toast.dismiss();
      
      if (isValid) {
        // Salvar status de autenticação
        localStorage.setItem("admin_authenticated", "true");
        toast.success("Login realizado com sucesso!");
        
        // Redirecionar para o painel administrativo
        setTimeout(() => {
          window.location.href = "/admin";
        }, 1000);
      } else {
        toast.error("Senha incorreta!");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      toast.error("Erro ao processar o login. Tente novamente.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md">
        {/* Alerta de erro de conexão */}
        {connectionError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro de conexão</AlertTitle>
            <AlertDescription>
              Não foi possível conectar ao banco de dados. Verifique sua conexão com a internet e as configurações do Supabase.
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleReconnect}
                  disabled={isReconnecting}
                  className="flex items-center gap-2"
                >
                  {isReconnecting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Reconectando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Tentar reconectar
                    </>
                  )}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Alerta de configuração inicial */}
        {initialSetup && !connectionError && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Configuração inicial</AlertTitle>
            <AlertDescription className="text-yellow-700">
              Você precisa configurar uma senha de administrador primeiro.
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = "/admin/configuracoes/senha"}
                  className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300"
                >
                  Configurar senha
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Painel Administrativo</CardTitle>
            <CardDescription className="text-center">
              Digite a senha para acessar o painel administrativo
            </CardDescription>
          </CardHeader>
          {isCheckingSetup ? (
            <CardContent className="py-8">
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
                <span className="ml-2 text-sm text-gray-500">Verificando configuração...</span>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite a senha de administrador"
                      required
                      className="pr-10"
                      disabled={initialSetup || connectionError}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      disabled={initialSetup || connectionError}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full bg-purple-700 hover:bg-purple-800"
                  disabled={isLoading || initialSetup || connectionError}
                >
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
