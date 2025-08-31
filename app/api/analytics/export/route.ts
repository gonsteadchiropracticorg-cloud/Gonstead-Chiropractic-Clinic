import { NextRequest, NextResponse } from 'next/server'

// Import analytics data
let analyticsData: any[] = []
let activeSessions = new Map<string, any>()

try {
  const trackModule = require('../track/route')
  analyticsData = trackModule.analyticsData || []
  activeSessions = trackModule.activeSessions || new Map()
} catch (error) {
  console.log('Using fallback analytics data for export')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const timeframe = searchParams.get('timeframe') || '24h'
    
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

    if (format === 'csv') {
      return exportToCSV(filteredEvents, Array.from(activeSessions.values()), timeframe)
    } else if (format === 'pdf') {
      return exportToPDF(filteredEvents, Array.from(activeSessions.values()), timeframe)
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export analytics data' },
      { status: 500 }
    )
  }
}

function exportToCSV(events: any[], sessions: any[], timeframe: string) {
  const pageViews = events.filter(event => event.type === 'pageview')
  
  // Create CSV content
  let csvContent = 'Website Visitor Analytics Report\\n'
  csvContent += `Generated on: ${new Date().toLocaleString()}\\n`
  csvContent += `Timeframe: ${timeframe}\\n\\n`
  
  // Summary Statistics
  csvContent += 'SUMMARY STATISTICS\\n'
  csvContent += 'Metric,Value\\n'
  csvContent += `Total Page Views,${pageViews.length}\\n`
  csvContent += `Unique Visitors,${new Set(pageViews.map(event => event.data.visitorId)).size}\\n`
  csvContent += `Total Sessions,${sessions.length}\\n`
  csvContent += `Active Visitors,${sessions.filter(s => new Date(s.lastActivity) > new Date(Date.now() - 5 * 60 * 1000)).length}\\n`
  
  const avgDuration = sessions.length > 0 
    ? sessions.reduce((total, session) => {
        const duration = new Date(session.lastActivity).getTime() - new Date(session.startTime).getTime()
        return total + duration
      }, 0) / sessions.length / 1000
    : 0
  
  csvContent += `Average Session Duration (seconds),${Math.round(avgDuration)}\\n`
  
  const bounceRate = sessions.length > 0 
    ? (sessions.filter(session => session.pageViews === 1).length / sessions.length) * 100
    : 0
  
  csvContent += `Bounce Rate (%),${bounceRate.toFixed(1)}\\n\\n`
  
  // Top Pages
  csvContent += 'TOP PAGES\\n'
  csvContent += 'Page,Views,Percentage\\n'
  
  const pageCounts = pageViews.reduce((acc: any, event) => {
    const page = event.data.page || 'Unknown'
    acc[page] = (acc[page] || 0) + 1
    return acc
  }, {})
  
  const topPages = Object.entries(pageCounts)
    .map(([page, views]) => ({ page, views }))
    .sort((a: any, b: any) => b.views - a.views)
    .slice(0, 10)
  
  topPages.forEach((page: any) => {
    const percentage = pageViews.length > 0 ? ((page.views / pageViews.length) * 100).toFixed(1) : 0
    csvContent += `"${page.page}",${page.views},${percentage}%\\n`
  })
  
  csvContent += '\\n'
  
  // Traffic Sources
  csvContent += 'TRAFFIC SOURCES\\n'
  csvContent += 'Source,Visitors,Percentage\\n'
  
  const sourceCounts = sessions.reduce((acc: any, session) => {
    const source = getSourceFromReferrer(session.referrer)
    acc[source] = (acc[source] || 0) + 1
    return acc
  }, {})
  
  const trafficSources = Object.entries(sourceCounts)
    .map(([source, visitors]) => ({ source, visitors }))
    .sort((a: any, b: any) => b.visitors - a.visitors)
  
  trafficSources.forEach((source: any) => {
    const percentage = sessions.length > 0 ? ((source.visitors / sessions.length) * 100).toFixed(1) : 0
    csvContent += `"${source.source}",${source.visitors},${percentage}%\\n`
  })
  
  csvContent += '\\n'
  
  // Device Statistics
  csvContent += 'DEVICE STATISTICS\\n'
  csvContent += 'Device Type,Count,Percentage\\n'
  
  const deviceCounts = sessions.reduce((acc: any, session) => {
    const deviceType = session.device?.type || 'Unknown'
    acc[deviceType] = (acc[deviceType] || 0) + 1
    return acc
  }, {})
  
  Object.entries(deviceCounts).forEach(([type, count]: [string, any]) => {
    const percentage = sessions.length > 0 ? ((count / sessions.length) * 100).toFixed(1) : 0
    csvContent += `${type},${count},${percentage}%\\n`
  })
  
  csvContent += '\\n'
  
  // Recent Activity
  csvContent += 'RECENT ACTIVITY\\n'
  csvContent += 'Timestamp,Page,Device Type,Browser,Referrer\\n'
  
  pageViews
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 100)
    .forEach(activity => {
      csvContent += `"${new Date(activity.timestamp).toLocaleString()}","${activity.data.page}","${activity.data.device?.type || 'Unknown'}","${activity.data.device?.browser || 'Unknown'}","${activity.data.referrer || 'Direct'}"\\n`
    })

  const response = new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="website-analytics-${timeframe}.csv"`
    }
  })

  return response
}

function exportToPDF(events: any[], sessions: any[], timeframe: string) {
  // For PDF export, we'll create a simple HTML-based PDF
  const pageViews = events.filter(event => event.type === 'pageview')
  
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Website Analytics Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .metric { display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .metric h3 { margin: 0; color: #0d5c75; }
        .metric p { margin: 5px 0; font-size: 24px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Website Visitor Analytics Report</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <p>Timeframe: ${timeframe}</p>
      </div>
      
      <div style="text-align: center; margin-bottom: 30px;">
        <div class="metric">
          <h3>Total Page Views</h3>
          <p>${pageViews.length}</p>
        </div>
        <div class="metric">
          <h3>Unique Visitors</h3>
          <p>${new Set(pageViews.map(event => event.data.visitorId)).size}</p>
        </div>
        <div class="metric">
          <h3>Total Sessions</h3>
          <p>${sessions.length}</p>
        </div>
      </div>
      
      <h2>Top Pages</h2>
      <table>
        <thead>
          <tr><th>Page</th><th>Views</th><th>Percentage</th></tr>
        </thead>
        <tbody>
  `
  
  // Add top pages data
  const pageCounts = pageViews.reduce((acc: any, event) => {
    const page = event.data.page || 'Unknown'
    acc[page] = (acc[page] || 0) + 1
    return acc
  }, {})
  
  const topPages = Object.entries(pageCounts)
    .map(([page, views]) => ({ page, views }))
    .sort((a: any, b: any) => b.views - a.views)
    .slice(0, 10)
  
  topPages.forEach((page: any) => {
    const percentage = pageViews.length > 0 ? ((page.views / pageViews.length) * 100).toFixed(1) : 0
    htmlContent += `<tr><td>${page.page}</td><td>${page.views}</td><td>${percentage}%</td></tr>`
  })
  
  htmlContent += `
        </tbody>
      </table>
      
      <h2>Traffic Sources</h2>
      <table>
        <thead>
          <tr><th>Source</th><th>Visitors</th><th>Percentage</th></tr>
        </thead>
        <tbody>
  `
  
  // Add traffic sources
  const sourceCounts = sessions.reduce((acc: any, session) => {
    const source = getSourceFromReferrer(session.referrer)
    acc[source] = (acc[source] || 0) + 1
    return acc
  }, {})
  
  const trafficSources = Object.entries(sourceCounts)
    .map(([source, visitors]) => ({ source, visitors }))
    .sort((a: any, b: any) => b.visitors - a.visitors)
  
  trafficSources.forEach((source: any) => {
    const percentage = sessions.length > 0 ? ((source.visitors / sessions.length) * 100).toFixed(1) : 0
    htmlContent += `<tr><td>${source.source}</td><td>${source.visitors}</td><td>${percentage}%</td></tr>`
  })
  
  htmlContent += `
        </tbody>
      </table>
    </body>
    </html>
  `

  const response = new NextResponse(htmlContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="website-analytics-${timeframe}.html"`
    }
  })

  return response
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
