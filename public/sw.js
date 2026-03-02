// Service Worker for Goal Notifications
console.log('🔧 Service Worker loaded');

self.addEventListener('install', (event) => {
    console.log('✅ Service Worker installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker activated');
    event.waitUntil(clients.claim());
});

// Listen for notification trigger from main app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const { title, body, tag } = event.data;
        
        console.log('🔔 Service Worker showing notification:', title);
        
        self.registration.showNotification(title, {
            body: body,
            icon: '/assets/logo/logo.png',
            badge: '/assets/logo/logo.png',
            tag: tag,
            requireInteraction: true,
            vibrate: [200, 100, 200],
            data: { url: '/dashboard.html' }
        });
    }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Notification clicked');
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow(event.notification.data.url || '/dashboard.html')
    );
});
