'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWARegister() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Verificar se estamos no painel administrativo - verificação mais rigorosa
    const isAdmin = pathname ? pathname.startsWith('/admin') : false;
    setShouldRender(isAdmin);
    
    // Se não estamos no admin, não continuar com o restante da lógica
    if (!isAdmin) return;

    if ('serviceWorker' in navigator) {
      if (isAdmin) {
        // Registrar o Service Worker apenas se estivermos no painel admin
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
            .then(registration => {
              console.log('Service Worker registrado com sucesso:', registration);
            })
            .catch(error => {
              console.error('Erro ao registrar o Service Worker:', error);
            });
        });
      } else {
        // Se não estiver no admin, desregistrar qualquer Service Worker existente
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => {
            registration.unregister().then(() => {
              console.log('Service Worker desregistrado com sucesso');
            });
          });
        });
      }
    }

    // Capturar o evento beforeinstallprompt apenas se estivermos no admin
    const handleBeforeInstallPrompt = (e: Event) => {
      if (isAdmin) {
        // Prevenir o comportamento padrão do navegador
        e.preventDefault();
        // Armazenar o evento para uso posterior
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        // Atualizar a UI para mostrar o botão de instalação
        setIsInstallable(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Limpar evento quando o componente for desmontado
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [pathname]);

  // Se não estamos no painel administrativo, não renderizar o componente
  if (!shouldRender) return null;

  const handleInstallClick = () => {
    if (!deferredPrompt) return;

    // Mostrar o prompt de instalação
    deferredPrompt.prompt();

    // Aguardar a escolha do usuário
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('Usuário aceitou a instalação do PWA');
      } else {
        console.log('Usuário recusou a instalação do PWA');
      }
      // Limpar o prompt salvo, pois ele só pode ser usado uma vez
      setDeferredPrompt(null);
      setIsInstallable(false);
    });
  };

  // Verificação adicional para garantir que o botão só apareça no painel administrativo
  // Verificação tripla para garantir que o botão nunca apareça fora do admin
  const isAdminPath = pathname ? pathname.startsWith('/admin') : false;
  
  // Se não estamos em uma rota de admin, não renderizar nada
  if (!isAdminPath) return null;
  
  return (
    <>
      {isInstallable && shouldRender && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={handleInstallClick}
            className="bg-gradient-to-r from-purple-500 to-purple-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 hover:from-purple-600 hover:to-purple-900 transition-all duration-300"
          >
            <span>Instalar App</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
