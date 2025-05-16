import { useEffect, useRef, useCallback } from 'react';

type SoundType = 'newOrder' | 'alert' | 'success';

// Mapeamento de sons com fallbacks
const sounds: Record<SoundType, string> = {
  newOrder: '/sounds/new-order.mp3',
  alert: '/sounds/alert.mp3',
  success: '/sounds/success.mp3',
};

// Verificar se o navegador suporta o formato de áudio
const canPlayAudio = (type: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  const audio = new Audio();
  const canPlay = audio.canPlayType(type);
  return canPlay === 'probably' || canPlay === 'maybe';
};

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isSupportedRef = useRef<boolean>(false);

  // Inicializar o áudio
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // Verificar suporte a áudio
      isSupportedRef.current = canPlayAudio('audio/mpeg') || 
                              canPlayAudio('audio/ogg') || 
                              canPlayAudio('audio/wav');
      
      if (isSupportedRef.current) {
        audioRef.current = new Audio();
        audioRef.current.volume = 0.5; // Volume padrão para 50%
        
        // Configurar tratamento de erros
        const handleError = () => {
          console.warn('Erro ao carregar o áudio:', audioRef.current?.error);
          isSupportedRef.current = false;
        };
        
        audioRef.current.addEventListener('error', handleError);
        
        return () => {
          if (audioRef.current) {
            audioRef.current.removeEventListener('error', handleError);
            audioRef.current.pause();
            audioRef.current = null;
          }
        };
      }
    } catch (error) {
      console.warn('Erro ao inicializar áudio:', error);
      isSupportedRef.current = false;
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playSound = useCallback((type: SoundType = 'newOrder') => {
    if (!isSupportedRef.current || !audioRef.current) {
      console.warn('Reprodução de áudio não suportada ou desabilitada');
      return;
    }

    try {
      const soundPath = sounds[type];
      
      // Verificar se o caminho do som é válido
      if (!soundPath) {
        console.warn(`Tipo de som não encontrado: ${type}`);
        return;
      }
      
      // Tentar reproduzir o som
      audioRef.current.src = soundPath;
      audioRef.current.play().catch(error => {
        console.warn('Erro ao reproduzir som:', error);
        isSupportedRef.current = false;
      });
    } catch (error) {
      console.warn('Erro ao reproduzir som:', error);
      isSupportedRef.current = false;
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.min(1, Math.max(0, volume));
    }
  }, []);

  return { 
    playSound, 
    setVolume,
    isSoundSupported: isSupportedRef.current 
  };
}
