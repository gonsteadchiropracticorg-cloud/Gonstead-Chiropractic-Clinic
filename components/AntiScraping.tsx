"use client"

import { useEffect } from 'react'

export default function AntiScraping() {
  useEffect(() => {
    // 1. Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    // 2. Disable common keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12 (Developer Tools)
      if (e.key === 'F12') {
        e.preventDefault()
        return false
      }
      
      // Disable Ctrl+Shift+I (Developer Tools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault()
        return false
      }
      
      // Disable Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault()
        return false
      }
      
      // Disable Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault()
        return false
      }
      
      // Disable Ctrl+S (Save Page)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        return false
      }
      
      // Disable Ctrl+A (Select All)
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault()
        return false
      }
      
      // Disable Ctrl+C (Copy)
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault()
        return false
      }
      
      // Disable Ctrl+P (Print)
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault()
        return false
      }
    }

    // 3. Disable text selection
    const handleSelectStart = (e: Event) => {
      e.preventDefault()
      return false
    }

    // 4. Disable drag and drop
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault()
      return false
    }

    // 5. Detect developer tools
    let devtools = false
    const checkDevTools = () => {
      const start = performance.now()
      debugger // This will pause execution if dev tools are open
      const end = performance.now()
      
      if (end - start > 100) {
        if (!devtools) {
          devtools = true
          // Redirect or show warning
          document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#f0f0f0;font-family:Arial,sans-serif;"><div style="text-align:center;"><h1 style="color:#e74c3c;">Access Restricted</h1><p>Developer tools are not allowed on this website.</p></div></div>'
        }
      }
    }

    // 6. Detect automation tools
    const detectAutomation = () => {
      // Check for webdriver
      if ((window as any).webdriver || (navigator as any).webdriver) {
        document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#f0f0f0;font-family:Arial,sans-serif;"><div style="text-align:center;"><h1 style="color:#e74c3c;">Automation Detected</h1><p>Automated access is not permitted.</p></div></div>'
        return
      }
      
      // Check for Selenium
      if ((window as any)._selenium || (document as any).$cdc_asdjflasutopfhvcZLmcfl_) {
        document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#f0f0f0;font-family:Arial,sans-serif;"><div style="text-align:center;"><h1 style="color:#e74c3c;">Automation Detected</h1><p>Selenium automation is not permitted.</p></div></div>'
        return
      }
      
      // Check for PhantomJS
      if ((window as any).callPhantom || (window as any)._phantom) {
        document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#f0f0f0;font-family:Arial,sans-serif;"><div style="text-align:center;"><h1 style="color:#e74c3c;">Automation Detected</h1><p>PhantomJS automation is not permitted.</p></div></div>'
        return
      }
    }

    // 7. Monitor console access
    let consoleWarningShown = false
    const showConsoleWarning = () => {
      if (!consoleWarningShown) {
        consoleWarningShown = true
        console.clear()
        console.log('%cSTOP!', 'color: red; font-size: 50px; font-weight: bold;')
        console.log('%cThis is a browser feature intended for developers. If someone told you to copy and paste something here to enable a feature or "hack" someone\'s account, it is a scam and will give them access to your information.', 'color: red; font-size: 14px;')
      }
    }

    // 8. Obfuscate content periodically (DISABLED - too disruptive)
    const obfuscateContent = () => {
      // Disabled to prevent interfering with normal website use
      // This was causing content flashing and poor user experience
      return
    }

    // 9. Detect rapid page access patterns
    const pageAccess = {
      count: 0,
      lastAccess: Date.now()
    }
    
    const trackPageAccess = () => {
      const now = Date.now()
      if (now - pageAccess.lastAccess < 1000) { // Less than 1 second
        pageAccess.count++
        if (pageAccess.count > 5) {
          document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#f0f0f0;font-family:Arial,sans-serif;"><div style="text-align:center;"><h1 style="color:#e74c3c;">Suspicious Activity</h1><p>Rapid access detected. Please reload the page normally.</p></div></div>'
          return
        }
      } else {
        pageAccess.count = 0
      }
      pageAccess.lastAccess = now
    }

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('selectstart', handleSelectStart)
    document.addEventListener('dragstart', handleDragStart)

    // Initial checks
    detectAutomation()
    trackPageAccess()
    showConsoleWarning()

    // Periodic checks
    const devToolsInterval = setInterval(checkDevTools, 1000)
    const obfuscateInterval = setInterval(obfuscateContent, 30000) // Every 30 seconds
    const automationInterval = setInterval(detectAutomation, 5000)

    // 10. Monitor for suspicious DOM access patterns (with higher threshold)
    let domAccessCount = 0
    const originalQuerySelector = document.querySelector
    const originalQuerySelectorAll = document.querySelectorAll
    
    // Reset DOM access count every minute to prevent false positives
    setInterval(() => {
      domAccessCount = 0
    }, 60000)
    
    document.querySelector = function(...args) {
      domAccessCount++
      if (domAccessCount > 200) { // Increased threshold for legitimate use
        console.warn('Excessive DOM queries detected:', domAccessCount)
        // Log but don't block - just warn
      }
      return originalQuerySelector.apply(this, args)
    }
    
    document.querySelectorAll = function(...args) {
      domAccessCount++
      if (domAccessCount > 200) {
        console.warn('Excessive DOM queries detected:', domAccessCount)
        // Log but don't block - just warn  
      }
      return originalQuerySelectorAll.apply(this, args)
    }

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('selectstart', handleSelectStart)
      document.removeEventListener('dragstart', handleDragStart)
      clearInterval(devToolsInterval)
      clearInterval(obfuscateInterval)
      clearInterval(automationInterval)
    }
  }, [])

  return null // This component doesn't render anything
}