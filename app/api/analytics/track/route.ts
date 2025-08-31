import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

// In-memory storage for demo (in production, use a database)
interface AnalyticsEvent {
  id: string
  type: string
  data: any
  timestamp: Date
  ipAddress?: string
}

// Global storage for analytics data
const analyticsData: AnalyticsEvent[] = []
const activeSessions = new Map<string, any>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body
    
    // Get client IP address
    const headersList = await headers()
    const clientIP = headersList.get('x-forwarded-for') || 
                    headersList.get('x-real-ip') || 
                    request.ip || 
                    'unknown'

    // Create analytics event
    const event: AnalyticsEvent = {
      id: crypto.randomUUID(),
      type,
      data: {
        ...data,
        ipAddress: clientIP
      },
      timestamp: new Date(),
      ipAddress: clientIP
    }

    // Store the event
    analyticsData.push(event)

    // Handle different event types
    switch (type) {
      case 'pageview':
        handlePageView(event)
        break
      case 'page_exit':
        handlePageExit(event)
        break
      case 'heartbeat':
        handleHeartbeat(event)
        break
      case 'event':
        handleCustomEvent(event)
        break
    }

    // Clean old data (keep only last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const currentLength = analyticsData.length
    for (let i = analyticsData.length - 1; i >= 0; i--) {
      if (analyticsData[i].timestamp < oneDayAgo) {
        analyticsData.splice(i, 1)
      }
    }

    return NextResponse.json({ 
      success: true, 
      eventId: event.id,
      totalEvents: analyticsData.length 
    })

  } catch (error) {
    console.error('Analytics tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to track analytics event' },
      { status: 500 }
    )
  }
}

function handlePageView(event: AnalyticsEvent) {
  const { sessionId, visitorId, page, title } = event.data
  
  // Update or create session
  if (!activeSessions.has(sessionId)) {
    activeSessions.set(sessionId, {
      id: sessionId,
      visitorId,
      startTime: event.timestamp,
      lastActivity: event.timestamp,
      pageViews: 0,
      pages: [],
      referrer: event.data.referrer || '',
      userAgent: event.data.userAgent || '',
      device: event.data.device || {},
      isActive: true
    })
  }

  const session = activeSessions.get(sessionId)
  session.lastActivity = event.timestamp
  session.pageViews += 1
  if (!session.pages.includes(page)) {
    session.pages.push(page)
  }
}

function handlePageExit(event: AnalyticsEvent) {
  const { sessionId, timeOnPage } = event.data
  
  if (activeSessions.has(sessionId)) {
    const session = activeSessions.get(sessionId)
    session.lastActivity = event.timestamp
  }
}

function handleHeartbeat(event: AnalyticsEvent) {
  const { sessionId } = event.data
  
  if (activeSessions.has(sessionId)) {
    const session = activeSessions.get(sessionId)
    session.lastActivity = event.timestamp
    session.isActive = true
  }
}

function handleCustomEvent(event: AnalyticsEvent) {
  // Store custom events for analysis
  console.log('Custom event tracked:', event.data.eventType, event.data.data)
}

// Export analytics data for use by other API endpoints
export { analyticsData, activeSessions }
