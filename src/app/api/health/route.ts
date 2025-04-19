import { NextResponse } from 'next/server'

/**
 * Simple health check endpoint
 * Returns basic server health status
 */
export async function GET(): Promise<Response> {
  try {
    // Return a simple health status
    // In a real app, you might want to check database connectivity etc.
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    })
  } catch (_err) {
    return NextResponse.json(
      { status: 'error', error: 'Health check failed' },
      { status: 500 }
    )
  }
} 