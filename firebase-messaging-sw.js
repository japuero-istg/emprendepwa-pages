// public/firebase-messaging-sw.js
// Service Worker para Firebase Cloud Messaging (FCM)
// Equivalente a MyFirebaseMessagingService.kt en Android

import { initializeApp } from 'firebase/app'
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw'

// Inicializar Firebase dentro del SW (necesita su propia instancia)
const firebaseConfig = {
  apiKey: "AIzaSyBhZVP3GRDLI7fPXUE9TWtkap0KZUcKTuU",
  authDomain: "appemprendeistgdev.firebaseapp.com",
  databaseURL: "https://appemprendeistgdev-default-rtdb.firebaseio.com",
  projectId: "appemprendeistgdev",
  storageBucket: "appemprendeistgdev.firebasestorage.app",
  messagingSenderId: "241500955505",
  appId: "1:241500955505:web:55d7d6bdbd7a6cce7dccd0"
}

const app = initializeApp(firebaseConfig)
const messaging = getMessaging(app)

// Ruta base: '/' en la raíz o '/emprendepwa-pages/' bajo GitHub Pages
const BASE = self.registration.scope || '/'

// Manejar mensajes en background (pestaña cerrada o en segundo plano)
// Equivalente a: onMessageReceived() en MyFirebaseMessagingService.kt
onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw] Mensaje en background:', payload)

  const title = payload.notification?.title || 'EmprendeISTG'
  const body = payload.notification?.body || 'Tienes una nueva notificación'
  const url = payload.data?.url || BASE

  // Mostrar notificación nativa del SO
  self.registration.showNotification(title, {
    body,
    icon: BASE + 'favicon.svg',
    badge: BASE + 'favicon.svg',
    tag: 'emprende-ofertas',
    renotify: true,
    data: { url }
  })
})

// Manejar click en notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || BASE

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si ya hay una pestaña abierta, enfocarla
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      // Si no, abrir nueva pestaña
      return clients.openWindow(url)
    })
  )
})

// ── SHARE TARGET ──────────────────────────────
// Maneja contenido recibido vía Web Share Target API
// Cuando otro app comparte a esta PWA, el navegador envía GET /?url=...&text=...&title=...
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Solo interceptar GET al root de la base con parámetros de share_target
  if (event.request.method === 'GET' && url.pathname === BASE && url.searchParams.has('url') && url.searchParams.has('text')) {
    const sharedUrl = url.searchParams.get('url') || ''
    const sharedText = url.searchParams.get('text') || ''
    const sharedTitle = url.searchParams.get('title') || ''

    // Determinar a dónde redirigir
    let targetUrl = BASE

    if (sharedUrl) {
      // Si la URL compartida es de nuestro dominio, usarla directamente
      try {
        const parsed = new URL(sharedUrl)
        if (parsed.origin === self.location.origin) {
          targetUrl = parsed.pathname + parsed.search
        }
      } catch {
        // No es una URL válida, ignorar
      }
    }

    // Redirigir al cliente al contenido
    event.respondWith(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        // Si ya hay una pestaña abierta, enfocar y navegar
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus()
            client.navigate(targetUrl)
            return new Response(null, { status: 204 })
          }
        }
        // Si no, abrir nueva pestaña
        return clients.openWindow(targetUrl)
      })
    )
  }
})
