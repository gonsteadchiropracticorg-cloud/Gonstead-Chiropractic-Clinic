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
    <>
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .install-button-container {
          position: fixed;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          z-index: 60;
          animation: slideIn 0.5s ease-out 1s both;
        }

        .install-button {
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
          right: -140px;
          padding: 12px 20px 12px 16px;
          background: linear-gradient(135deg, #0d5c75 0%, #2a9d8f 100%);
          color: white;
          border: none;
          border-radius: 12px 0 0 12px;
          box-shadow: -4px 4px 16px rgba(0, 0, 0, 0.3);
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          overflow: hidden;
        }

        .install-button:hover {
          right: 0;
          padding-right: 24px;
          box-shadow: -6px 6px 24px rgba(0, 0, 0, 0.4);
          background: linear-gradient(135deg, #0a4a5c 0%, #238276 100%);
        }

        .install-button:active {
          transform: scale(0.98);
        }

        .install-icon {
          font-size: 20px;
          transition: transform 0.3s ease;
        }

        .install-button:hover .install-icon {
          transform: scale(1.2) rotate(5deg);
        }

        .install-text {
          opacity: 0;
          max-width: 0;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .install-button:hover .install-text {
          opacity: 1;
          max-width: 150px;
          margin-left: 4px;
        }

        .install-tab {
          position: absolute;
          left: -2px;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 40px;
          background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
          border-radius: 4px 0 0 4px;
          transition: height 0.3s ease;
        }

        .install-button:hover .install-tab {
          height: 60px;
        }

        @media (max-width: 768px) {
          .install-button {
            right: -120px;
            font-size: 14px;
            padding: 10px 16px 10px 12px;
          }
        }
      `}</style>

      <div className="install-button-container">
        <button
          className="install-button"
          onClick={async () => {
            deferredPrompt.prompt()
            try {
              await deferredPrompt.userChoice
            } finally {
              setDeferredPrompt(null)
            }
          }}
          aria-label="Install Admin App"
        >
          <div className="install-tab"></div>
          <span className="install-icon">📱</span>
          <span className="install-text">Install Admin App</span>
        </button>
      </div>
    </>
  )
}

