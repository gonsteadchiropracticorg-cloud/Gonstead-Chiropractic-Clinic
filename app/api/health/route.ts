import { NextRequest, NextResponse } from 'next/server'
import { testConnection } from '@/lib/supabase'

/**
 * Health Check Endpoint
 * 
 * Used by:
 * - Docker health checks
 * - Load balancers
 * - Monitoring systems (Uptime Robot, Pingdom, etc.)
 * - CI/CD pipelines
 * 
 * Returns:
 * - 200 OK: System healthy
 * - 503 Service Unavailable: System unhealthy
 */

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  uptime: number
  version: string
  checks: {
    database: 'connected' | 'disconnected' | 'error'
    memory: 'ok' | 'high' | 'critical'
    environment: 'ok' | 'missing_vars'
  }
  details?: {
    databaseLatency?: number
    memoryUsage?: {
      used: number
      total: number
      percentage: number
    }
  }
}

// Track when the server started
const serverStartTime = Date.now()

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Initialize health status
    const health: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - serverStartTime) / 1000), // in seconds
      version: process.env.npm_package_version || '3.0.0',
      checks: {
        database: 'disconnected',
        memory: 'ok',
        environment: 'ok',
      },
      details: {},
    }

    // Check 1: Database Connection
    try {
      const dbConnected = await testConnection()
      const dbLatency = Date.now() - startTime
      
      health.checks.database = dbConnected ? 'connected' : 'disconnected'
      health.details!.databaseLatency = dbLatency

      if (!dbConnected) {
        health.status = 'degraded'
      }
    } catch (dbError) {
      health.checks.database = 'error'
      health.status = 'unhealthy'
    }

    // Check 2: Memory Usage
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage()
      const totalMemory = memUsage.heapTotal
      const usedMemory = memUsage.heapUsed
      const percentage = (usedMemory / totalMemory) * 100

      health.details!.memoryUsage = {
        used: Math.round(usedMemory / 1024 / 1024), // MB
        total: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: Math.round(percentage),
      }

      if (percentage > 90) {
        health.checks.memory = 'critical'
        health.status = 'unhealthy'
      } else if (percentage > 75) {
        health.checks.memory = 'high'
        health.status = 'degraded'
      }
    }

    // Check 3: Environment Variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ]

    const missingVars = requiredEnvVars.filter(
      varName => !process.env[varName]
    )

    if (missingVars.length > 0) {
      health.checks.environment = 'missing_vars'
      health.status = 'unhealthy'
    }

    // Determine HTTP status code
    const statusCode = health.status === 'healthy' ? 200 : 
                       health.status === 'degraded' ? 200 : 503

    return NextResponse.json(health, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })

  } catch (error: any) {
    // Critical error in health check itself
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal error',
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      }
    )
  }
}

// HEAD request for simple alive check (used by some monitoring tools)
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 })
}

