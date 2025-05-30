// Função para enviar notificação push - apenas para uso no servidor
export async function sendPushNotification(subscription: any, payload: any) {
    const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
    const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        throw new Error('VAPID keys not configured');
    }

    const webpush = (await import('web-push')).default;

    webpush.setVapidDetails(
        'mailto:contato@acaionline.com',
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
    );

    try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
        return { success: true };
    } catch (error) {
        console.error('Error sending push notification:', error);
        return { success: false, error };
    }
} 