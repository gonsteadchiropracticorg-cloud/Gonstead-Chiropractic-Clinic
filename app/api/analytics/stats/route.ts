import { NextRequest, NextResponse } from 'next/server'

// Import in-memory storage from tracking endpoint
let analyticsData: any[] = []
let activeSessions = new Map<string, any>()

// Try to import from track route, fallback to empty arrays
try {
  const trackModule = require('../track/route')
  analyticsData = trackModule.analyticsData || []
  activeSessions = trackModule.activeSessions || new Map()
} catch (error) {
  console.log('Using fallback analytics data')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '24h'
    const page = searchParams.get('page')
    
    const now = new Date()
    let startDate: Date
    
    // Calculate time range
    switch (timeframe) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case '6h':
        startDate = new Date(now.getTime() - 6 * 60 * 60 * 1000)
        break
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }

    // Filter data by timeframe
    const filteredEvents = analyticsData.filter(event => 
      new Date(event.timestamp) >= startDate
    )

    // Calculate statistics
    const stats = calculateStats(filteredEvents, Array.from(activeSessions.values()))

    // Add real-time data
    const realTimeStats = {
      ...stats,
      timestamp: now.toISOString(),
      dataPoints: filteredEvents.length,
      timeframe
    }

    return NextResponse.json(realTimeStats)

  } catch (error) {
    console.error('Analytics stats error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve analytics stats' },
      { status: 500 }
    )
  }
}

function calculateStats(events: any[], sessions: any[]) {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // Active visitors (heartbeat in last 5 minutes)
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
  const activeVisitors = sessions.filter(session => 
    new Date(session.lastActivity) >= fiveMinutesAgo
  ).length

  // Page views
  const pageViews = events.filter(event => event.type === 'pageview')
  const totalPageViews = pageViews.length

  // Unique visitors (unique session IDs)
  const uniqueVisitors = new Set(pageViews.map(event => event.data.visitorId)).size

  // Session duration calculation
  const completedSessions = sessions.filter(session => 
    new Date(session.lastActivity) < oneHourAgo
  )
  const avgSessionDuration = completedSessions.length > 0 
    ? completedSessions.reduce((total, session) => {
        const duration = new Date(session.lastActivity).getTime() - new Date(session.startTime).getTime()
        return total + duration
      }, 0) / completedSessions.length / 1000 // Convert to seconds
    : 0

  // Bounce rate (sessions with only 1 page view)
  const bounceRate = sessions.length > 0 
    ? (sessions.filter(session => session.pageViews === 1).length / sessions.length) * 100
    : 0

  // Top pages
  const pageCounts = pageViews.reduce((acc: any, event) => {
    const page = event.data.page || 'Unknown'
    acc[page] = (acc[page] || 0) + 1
    return acc
  }, {})

  const topPages = Object.entries(pageCounts)
    .map(([page, views]) => ({ page, views }))
    .sort((a: any, b: any) => b.views - a.views)
    .slice(0, 10)

  // Traffic sources
  const sourceCounts = sessions.reduce((acc: any, session) => {
    const source = getSourceFromReferrer(session.referrer)
    acc[source] = (acc[source] || 0) + 1
    return acc
  }, {})

  const trafficSources = Object.entries(sourceCounts)
    .map(([source, visitors]) => ({ source, visitors }))
    .sort((a: any, b: any) => b.visitors - a.visitors)

  // Device statistics
  const deviceCounts = sessions.reduce((acc: any, session) => {
    const deviceType = session.device?.type || 'Unknown'
    acc[deviceType] = (acc[deviceType] || 0) + 1
    return acc
  }, {})

  const totalSessions = sessions.length
  const deviceStats = Object.entries(deviceCounts)
    .map(([type, count]) => ({
      type,
      count: count as number,
      percentage: totalSessions > 0 ? Math.round(((count as number) / totalSessions) * 100) : 0
    }))

  // Browser statistics
  const browserCounts = sessions.reduce((acc: any, session) => {
    const browser = session.device?.browser || 'Unknown'
    acc[browser] = (acc[browser] || 0) + 1
    return acc
  }, {})

  const browserStats = Object.entries(browserCounts)
    .map(([browser, count]) => ({
      browser,
      count: count as number,
      percentage: totalSessions > 0 ? Math.round(((count as number) / totalSessions) * 100) : 0
    }))

  // Hourly data for charts
  const hourlyData = generateHourlyData(pageViews)

  // Recent activity
  const recentActivity = events
    .filter(event => event.type === 'pageview')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 50)
    .map(event => ({
      timestamp: event.timestamp,
      page: event.data.page,
      title: event.data.title,
      referrer: event.data.referrer,
      device: event.data.device,
      visitorId: event.data.visitorId
    }))

  return {
    activeVisitors,
    totalPageViews,
    uniqueVisitors,
    avgSessionDuration: Math.round(avgSessionDuration),
    bounceRate: Math.round(bounceRate),
    topPages,
    trafficSources,
    deviceStats,
    browserStats,
    hourlyData,
    recentActivity,
    totalSessions: sessions.length,
    newVisitors: uniqueVisitors, // Simplified - in production, track returning vs new
    returningVisitors: sessions.length - uniqueVisitors
  }
}

function getSourceFromReferrer(referrer: string): string {
  if (!referrer) return 'Direct'
  
  try {
    const url = new URL(referrer)
    const hostname = url.hostname.toLowerCase()
    
    if (hostname.includes('google')) return 'Google'
    if (hostname.includes('facebook')) return 'Facebook'
    if (hostname.includes('twitter') || hostname.includes('t.co')) return 'Twitter'
    if (hostname.includes('linkedin')) return 'LinkedIn'
    if (hostname.includes('youtube')) return 'YouTube'
    if (hostname.includes('instagram')) return 'Instagram'
    
    return hostname
  } catch {
    return 'Unknown'
  }
}

function generateHourlyData(pageViews: any[]) {
  const hours = 24
  const hourlyData = []
  const now = new Date()

  for (let i = hours - 1; i >= 0; i--) {
    const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000)
    const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000)
    
    const viewsInHour = pageViews.filter(view => {
      const viewTime = new Date(view.timestamp)
      return viewTime >= hourStart && viewTime < hourEnd
    }).length

    const uniqueVisitorsInHour = new Set(
      pageViews
        .filter(view => {
          const viewTime = new Date(view.timestamp)
          return viewTime >= hourStart && viewTime < hourEnd
        })
        .map(view => view.data.visitorId)
    ).size

    hourlyData.push({
      hour: hourStart.getHours(),
      time: hourStart.toISOString(),
      pageViews: viewsInHour,
      uniqueVisitors: uniqueVisitorsInHour
    })
  }

  return hourlyData
}
