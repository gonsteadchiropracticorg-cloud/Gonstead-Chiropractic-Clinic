"use client"

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { syncManager } from '@/lib/sync-manager'

export default function AdminServiceWorkerClient() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const pathname = usePathname()

  // Only show install prompt on admin routes
  const isAdminRoute = pathname?.startsWith('/admin')

  useEffect(() => {
    // Only initialize for admin routes
    if (!isAdminRoute) return

    // Register service worker + initialize sync
    syncManager.initialize().catch(() => {})

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        // Try to precache admin routes lazily
        reg.active?.postMessage({
          type: 'CACHE_URLS',
          urls: ['/admin', '/admin/dashboard', '/admin/patient-tracking', '/admin/calendar', '/admin/money-management', '/offline']
        })
      })
    }

    // Handle PWA install prompt capture - only for admin routes
    const handler = (e: any) => {
      // Only capture the install prompt if we're on an admin route
      if (pathname?.startsWith('/admin')) {
        e.preventDefault()
        setDeferredPrompt(e)
      }
    }
    window.addEventListener('beforeinstallprompt', handler as any)

    return () => window.removeEventListener('beforeinstallprompt', handler as any)
  }, [isAdminRoute, pathname])

  // Don't show if not on admin route or if no install prompt available
  if (!isAdminRoute || !deferredPrompt) return null

  return (
    <button
      onClick={async () => {
        deferredPrompt.prompt()
        try {
          await deferredPrompt.userChoice
        } finally {
          setDeferredPrompt(null)
        }
      }}
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 60,
        padding: '10px 16px',
        background: '#0d5c75',
        color: 'white',
        borderRadius: 9999,
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        fontSize: '14px',
        fontWeight: 600,
        border: 'none',
        cursor: 'pointer'
      }}
      aria-label="Install Admin App"
    >
      📱 Install Admin App
    </button>
  )
}

