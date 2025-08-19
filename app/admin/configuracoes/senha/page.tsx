"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ArrowLeft, AlertTriangle, Info, Shield, Eye, EyeOff, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { testSupabaseConnection, reconnectSupabase } from "@/lib/services/supabase-client"

export default function AdminPasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [initialSetup, setInitialSetup] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [connectionError, setConnectionError] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const checkDatabaseConnection = async () => {
    try {
      const isConnected = await testSupabaseConnection();
      setConnectionError(!isConnected);
      return isConnected;
    } catch (error) {
      console.error("Erro ao verificar conexão com o banco de dados:", error);
      setConnectionError(true);
      return false;
    }
  };

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      const success = await reconnectSupabase();
      if (success) {
        toast.success("Conexão restabelecida com sucesso!");
        setConnectionError(false);
        checkPasswordSetup();
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

  const checkPasswordSetup = async () => {
    setIsCheckingAuth(true);
    try {
      const isConnected = await checkDatabaseConnection();
      if (!isConnected) {
        setIsCheckingAuth(false);
        return;
      }
      
      const response = await fetch('/api/admin/password');
      const data = await response.json();

      if (response.ok) {
        setInitialSetup(!data.hasPassword);
      } else {
        throw new Error(data.error || "Erro ao verificar a configuração da senha");
      }
    } catch (error) {
      console.error("Erro ao verificar configuração de senha:", error);
      toast.error("Erro ao verificar a configuração da senha.");
      setConnectionError(true);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    const authStatus = localStorage.getItem("admin_authenticated");
    setIsAuthenticated(authStatus === "true");
    checkPasswordSetup();
  }, [])

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    toast.loading(initialSetup ? "Salvando senha..." : "Alterando senha...");

    try {
      if (newPassword !== confirmPassword) {
        toast.error("As senhas não coincidem!");
        return;
      }

      if (newPassword.length < 6) {
        toast.error("A senha deve ter pelo menos 6 caracteres!");
        return;
      }

      const body: any = { password: newPassword };
      if (!initialSetup) {
        body.currentPassword = currentPassword;
      }

      const response = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      toast.dismiss();

      if (response.ok && result.success) {
        toast.success(initialSetup ? "Senha definida com sucesso!" : "Senha alterada com sucesso!");
        if (initialSetup) {
            localStorage.setItem("admin_authenticated", "true");
            setIsAuthenticated(true);
            setInitialSetup(false);
        }
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        throw new Error(result.error || "Ocorreu um erro desconhecido.");
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Erro: ${error.message}`);
      console.error(error);
      if (error.message.includes('conexão') || error.message.includes('Failed to fetch')) {
          setConnectionError(true);
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-purple-800 to-purple-900 text-white p-3 sm:p-4 sticky top-0 z-10 shadow-lg">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link 
                href="/admin" 
                className="p-1.5 rounded-full hover:bg-purple-700 transition-colors duration-200 flex-shrink-0"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>
              <h1 className="text-lg sm:text-xl font-bold whitespace-nowrap">
                Configuração de Senha
              </h1>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto py-8 px-4 flex-1">
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
              {isCheckingAuth ? (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-700"></div>
                  <span className="ml-2 text-sm text-gray-500">Verificando configuração...</span>
                </div>
              ) : (
                <>
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
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full bg-purple-700 hover:bg-purple-800"
                disabled={isLoading || isCheckingAuth || connectionError}
              >
                {isLoading ? "Salvando..." : "Salvar Senha"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
