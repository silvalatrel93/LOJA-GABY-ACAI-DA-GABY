'use client';

import { useState } from 'react';
import { Share2, Copy, Check, Instagram, MessageCircle } from 'lucide-react';

interface SocialShareProps {
  title?: string;
  message?: string;
}

export default function SocialShare({ 
  title = "Heai Açaí e Sorvetes - Admin", 
  message = "Acesse o painel administrativo da Heai Açaí e Sorvetes!" 
}: SocialShareProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  
  const shareText = `${message} ${currentUrl}`;
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Falha ao copiar link:', err);
    }
  };
  
  const shareOnWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
  };
  
  const shareOnInstagram = () => {
    // Instagram não tem API direta para compartilhamento
    // Vamos copiar o texto para a área de transferência
    navigator.clipboard.writeText(shareText)
      .then(() => {
        alert('Texto copiado! Abra o Instagram e cole na sua história ou mensagem direta.');
      })
      .catch(err => {
        console.error('Falha ao copiar para compartilhar no Instagram:', err);
      });
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="relative">
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="bg-gradient-to-r from-purple-500 to-purple-800 text-white p-3 rounded-full shadow-lg hover:from-purple-600 hover:to-purple-900 transition-all duration-300"
          aria-label="Compartilhar"
        >
          <Share2 size={20} />
        </button>
        
        {showOptions && (
          <div className="absolute bottom-14 right-0 bg-white rounded-lg shadow-xl p-3 w-48 transition-all duration-300">
            <div className="text-sm font-medium text-gray-700 mb-2">Compartilhar</div>
            
            <button
              onClick={handleCopyLink}
              className="flex items-center w-full p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              {copied ? <Check size={18} className="text-green-500 mr-2" /> : <Copy size={18} className="text-gray-500 mr-2" />}
              <span>{copied ? 'Link copiado!' : 'Copiar link'}</span>
            </button>
            
            <button
              onClick={shareOnWhatsApp}
              className="flex items-center w-full p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <MessageCircle size={18} className="text-green-600 mr-2" />
              <span>WhatsApp</span>
            </button>
            
            <button
              onClick={shareOnInstagram}
              className="flex items-center w-full p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Instagram size={18} className="text-pink-600 mr-2" />
              <span>Instagram</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
