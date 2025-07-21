'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Eye, EyeOff, Info } from 'lucide-react';
import { toast } from 'sonner';

interface MercadoPagoCredentialsFormProps {
  lojaId: string;
  onCredentialsSaved?: () => void;
}

interface Credentials {
  id?: string;
  public_key: string;
  has_pix_key: boolean;
  webhook_url?: string;
  is_sandbox: boolean;
  is_active: boolean;
}

export function MercadoPagoCredentialsForm({ lojaId, onCredentialsSaved }: MercadoPagoCredentialsFormProps) {
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [formData, setFormData] = useState({
    public_key: '',
    access_token: '',
    chave_pix: '',
    webhook_url: '',
    is_sandbox: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [showTokens, setShowTokens] = useState({
    access_token: false,
    public_key: false,
    chave_pix: false,
  });
  const [validationStatus, setValidationStatus] = useState<{
    isValid: boolean | null;
    message: string;
  }>({ isValid: null, message: '' });

  // Carregar credenciais existentes
  useEffect(() => {
    loadCredentials();
  }, [lojaId]);

  const loadCredentials = async () => {
    if (!lojaId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/mercado-pago/credentials?loja_id=${lojaId}`);
      
      if (response.ok) {
        const data = await response.json();
        setCredentials(data);
        setFormData({
          public_key: data.public_key || '',
          access_token: data.id ? '••••••••••••••••' : '', // Mostrar indicador se existe
          chave_pix: data.has_pix_key ? '••••••••••••' : '', // Mostrar indicador se existe
          webhook_url: data.webhook_url || '',
          is_sandbox: data.is_sandbox,
        });
      } else if (response.status !== 404) {
        toast.error('Erro ao carregar credenciais');
      }
    } catch (error) {
      console.error('Erro ao carregar credenciais:', error);
      toast.error('Erro ao carregar credenciais');
    } finally {
      setLoading(false);
    }
  };

  const validateCredentials = async () => {
    if (!formData.public_key || !formData.access_token) {
      setValidationStatus({
        isValid: false,
        message: 'Public Key e Access Token são obrigatórios'
      });
      return;
    }

    setValidating(true);
    setValidationStatus({ isValid: null, message: 'Validando...' });

    try {
      const response = await fetch('/api/mercado-pago/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loja_id: lojaId,
          public_key: formData.public_key,
          access_token: formData.access_token,
          chave_pix: formData.chave_pix,
          webhook_url: formData.webhook_url,
          is_sandbox: formData.is_sandbox,
          validate_only: true, // Flag para apenas validar
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setValidationStatus({
          isValid: true,
          message: 'Credenciais válidas!'
        });
      } else {
        setValidationStatus({
          isValid: false,
          message: result.error || 'Credenciais inválidas'
        });
      }
    } catch (error) {
      setValidationStatus({
        isValid: false,
        message: 'Erro ao validar credenciais'
      });
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    if (!formData.public_key || !formData.access_token) {
      toast.error('Public Key e Access Token são obrigatórios');
      return;
    }

    // Verificar se os campos contêm indicadores visuais
    if (formData.access_token === '••••••••••••••••') {
      toast.error('Por favor, digite um novo Access Token para atualizar as credenciais');
      return;
    }

    console.log('🚀 Iniciando salvamento de credenciais...');
    setSaving(true);
    try {
      const payload = {
        loja_id: lojaId,
        public_key: formData.public_key,
        access_token: formData.access_token,
        chave_pix: formData.chave_pix,
        webhook_url: formData.webhook_url,
        is_sandbox: formData.is_sandbox,
      };
      
      console.log('📦 Payload:', {
        ...payload,
        access_token: payload.access_token ? payload.access_token.substring(0, 10) + '...' : 'vazio',
        public_key: payload.public_key ? payload.public_key.substring(0, 10) + '...' : 'vazio'
      });
      
      const response = await fetch('/api/mercado-pago/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('📝 Resposta da API:', { status: response.status, ok: response.ok });
      const result = await response.json();
      console.log('📝 Resultado:', result);

      if (response.ok) {
        console.log('✅ Credenciais salvas com sucesso!');
        toast.success('Credenciais salvas com sucesso!');
        setValidationStatus({ isValid: true, message: 'Credenciais salvas e validadas!' });
        
        // Atualizar estado credentials para que o botão mude imediatamente
        setCredentials({
          id: result.data?.id || 'temp-id',
          public_key: formData.public_key,
          has_pix_key: !!formData.chave_pix,
          webhook_url: formData.webhook_url,
          is_sandbox: formData.is_sandbox,
          is_active: true
        });
        
        onCredentialsSaved?.();
      } else {
        console.error('❌ Erro ao salvar:', result);
        toast.error(result.error || 'Erro ao salvar credenciais');
        setValidationStatus({
          isValid: false,
          message: result.error || 'Erro ao salvar credenciais'
        });
      }
    } catch (error) {
      console.error('Erro ao salvar credenciais:', error);
      toast.error('Erro ao salvar credenciais');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!credentials?.id) return;

    if (!confirm('Tem certeza que deseja remover as credenciais do Mercado Pago?')) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/mercado-pago/credentials?loja_id=${lojaId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Credenciais removidas com sucesso!');
        setCredentials(null);
        setFormData({
          public_key: '',
          access_token: '',
          chave_pix: '',
          webhook_url: '',
          is_sandbox: true,
        });
        setValidationStatus({ isValid: null, message: '' });
        onCredentialsSaved?.();
      } else {
        const result = await response.json();
        toast.error(result.error || 'Erro ao remover credenciais');
      }
    } catch (error) {
      console.error('Erro ao remover credenciais:', error);
      toast.error('Erro ao remover credenciais');
    } finally {
      setSaving(false);
    }
  };

  const toggleShowToken = (field: keyof typeof showTokens) => {
    setShowTokens(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Handler inteligente para access_token
  const handleAccessTokenChange = (value: string) => {
    // Se o valor atual é o indicador visual, limpar ao começar a digitar
    if (formData.access_token === '••••••••••••••••' && value !== formData.access_token) {
      setFormData(prev => ({ ...prev, access_token: value }));
    } else {
      setFormData(prev => ({ ...prev, access_token: value }));
    }
  };

  // Handler inteligente para chave_pix
  const handleChavePixChange = (value: string) => {
    // Se o valor atual é o indicador visual, limpar ao começar a digitar
    if (formData.chave_pix === '••••••••••••' && value !== formData.chave_pix) {
      setFormData(prev => ({ ...prev, chave_pix: value }));
    } else {
      setFormData(prev => ({ ...prev, chave_pix: value }));
    }
  };

  const maskToken = (token: string, show: boolean) => {
    if (show || !token) return token;
    if (token.length <= 8) return '***';
    return token.substring(0, 4) + '*'.repeat(token.length - 8) + token.substring(token.length - 4);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Carregando credenciais...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração Mercado Pago</CardTitle>
        <CardDescription>
          Configure suas credenciais do Mercado Pago para aceitar pagamentos via PIX e Cartão de Crédito.
          {credentials ? ' Credenciais já configuradas.' : ' Nenhuma credencial configurada.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ambiente */}
        <div className="flex items-center space-x-2">
          <Switch
            id="sandbox"
            checked={formData.is_sandbox}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_sandbox: checked }))}
          />
          <Label htmlFor="sandbox">
            Modo Sandbox (Teste)
          </Label>
        </div>

        {/* Public Key */}
        <div className="space-y-2">
          <Label htmlFor="public_key">
            Public Key *
          </Label>
          <div className="relative">
            <Input
              id="public_key"
              type={showTokens.public_key ? 'text' : 'password'}
              value={maskToken(formData.public_key, showTokens.public_key)}
              onChange={(e) => setFormData(prev => ({ ...prev, public_key: e.target.value }))}
              placeholder={formData.is_sandbox ? 'TEST-...' : 'APP_USR-...'}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => toggleShowToken('public_key')}
            >
              {showTokens.public_key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Access Token */}
        <div className="space-y-2">
          <Label htmlFor="access_token">
            Access Token *
          </Label>
          <div className="relative">
            <Input
              id="access_token"
              type={showTokens.access_token ? 'text' : 'password'}
              value={maskToken(formData.access_token, showTokens.access_token)}
              onChange={(e) => handleAccessTokenChange(e.target.value)}
              placeholder={formData.is_sandbox ? 'TEST-...' : 'APP_USR-...'}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => toggleShowToken('access_token')}
            >
              {showTokens.access_token ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Chave PIX */}
        <div className="space-y-2">
          <Label htmlFor="chave_pix">
            Chave PIX (Opcional)
          </Label>
          <div className="relative">
            <Input
              id="chave_pix"
              type={showTokens.chave_pix ? 'text' : 'password'}
              value={maskToken(formData.chave_pix, showTokens.chave_pix)}
              onChange={(e) => handleChavePixChange(e.target.value)}
              placeholder="CPF, CNPJ, email ou chave aleatória"
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => toggleShowToken('chave_pix')}
            >
              {showTokens.chave_pix ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Webhook URL */}
        <div className="space-y-2">
          <Label htmlFor="webhook_url">
            Webhook URL (Opcional)
          </Label>
          <Input
            id="webhook_url"
            type="url"
            value={formData.webhook_url}
            onChange={(e) => setFormData(prev => ({ ...prev, webhook_url: e.target.value }))}
            placeholder="https://seusite.com/api/mercado-pago/webhook"
          />
        </div>

        {/* Status de Validação */}
        {validationStatus.message && (
          <Alert>
            <div className="flex items-center">
              {validationStatus.isValid === null ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : validationStatus.isValid ? (
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500 mr-2" />
              )}
              <AlertDescription>{validationStatus.message}</AlertDescription>
            </div>
          </Alert>
        )}

        {/* Informações */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Como obter suas credenciais:</strong><br />
            1. Acesse o <a href="https://www.mercadopago.com.br/developers" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Mercado Pago Developers</a><br />
            2. Faça login em sua conta<br />
            3. Vá em "Suas integrações" → "Credenciais"<br />
            4. Copie a Public Key e Access Token<br />
            5. Para PIX, configure uma chave PIX em sua conta Mercado Pago
          </AlertDescription>
        </Alert>

        {/* Botões */}
        <div className="flex space-x-3">
          <Button
            onClick={validateCredentials}
            disabled={validating || !formData.public_key || !formData.access_token}
            variant="outline"
          >
            {validating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Validando...
              </>
            ) : (
              'Validar Credenciais'
            )}
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving || !formData.public_key || !formData.access_token}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              credentials ? 'Credenciais Salvas' : 'Salvar Credenciais'
            )}
          </Button>

          {credentials && (
            <Button
              onClick={handleRemove}
              disabled={saving}
              variant="destructive"
            >
              Remover Credenciais
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
