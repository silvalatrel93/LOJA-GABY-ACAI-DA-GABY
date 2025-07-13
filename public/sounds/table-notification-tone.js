// Script para gerar um tom de notificação específico para mesas
// Este tom é mais agudo e tem um padrão diferente do delivery

function generateTableNotificationTone() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const duration = 0.5; // 500ms por beep
  const pauseDuration = 0.2; // 200ms de pausa
  const frequency1 = 800; // Frequência mais aguda para mesas
  const frequency2 = 1000; // Segunda frequência para criar um padrão
  
  let currentTime = audioContext.currentTime;
  
  // Primeiro beep (800Hz)
  const oscillator1 = audioContext.createOscillator();
  const gainNode1 = audioContext.createGain();
  
  oscillator1.connect(gainNode1);
  gainNode1.connect(audioContext.destination);
  
  oscillator1.frequency.setValueAtTime(frequency1, currentTime);
  oscillator1.type = 'sine';
  
  gainNode1.gain.setValueAtTime(0, currentTime);
  gainNode1.gain.linearRampToValueAtTime(0.3, currentTime + 0.01);
  gainNode1.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
  
  oscillator1.start(currentTime);
  oscillator1.stop(currentTime + duration);
  
  currentTime += duration + pauseDuration;
  
  // Segundo beep (1000Hz)
  const oscillator2 = audioContext.createOscillator();
  const gainNode2 = audioContext.createGain();
  
  oscillator2.connect(gainNode2);
  gainNode2.connect(audioContext.destination);
  
  oscillator2.frequency.setValueAtTime(frequency2, currentTime);
  oscillator2.type = 'sine';
  
  gainNode2.gain.setValueAtTime(0, currentTime);
  gainNode2.gain.linearRampToValueAtTime(0.3, currentTime + 0.01);
  gainNode2.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
  
  oscillator2.start(currentTime);
  oscillator2.stop(currentTime + duration);
}

// Exportar função se estiver sendo usado como módulo
if (typeof module !== 'undefined' && module.exports) {
  module.exports = generateTableNotificationTone;
} 