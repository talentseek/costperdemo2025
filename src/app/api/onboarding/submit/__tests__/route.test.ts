import { POST } from '../route'
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

// Mock dependencies
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

describe('Onboarding API', () => {
  let mockSupabase: any
  let mockRequest: NextRequest

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Mock Supabase client
    mockSupabase = {
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: {
            session: {
              user: {
                id: 'test-user-id',
              },
            },
          },
        }),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
    };
    
    (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase)

    // Mock request
    mockRequest = {
      json: jest.fn().mockResolvedValue({
        workspace_id: 'test-workspace-id',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        company_name: 'Test Company',
        status: 'submitted',
      }),
    } as unknown as NextRequest
  })

  it('should return 401 when user is not authenticated', async () => {
    // Setup
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
    })

    // Execute
    const response = await POST(mockRequest)

    // Assert
    expect(response).toBeInstanceOf(NextResponse)
    expect(response.status).toBe(401)
    
    const responseData = await response.json()
    expect(responseData.message).toBe('Unauthorized')
  })

  it('should return 403 when user does not have permission for the workspace', async () => {
    // Setup
    mockSupabase.single.mockResolvedValue({
      data: {
        workspace_id: 'different-workspace-id',
        role: 'client',
      },
    })

    // Execute
    const response = await POST(mockRequest)

    // Assert
    expect(response).toBeInstanceOf(NextResponse)
    expect(response.status).toBe(403)
    
    const responseData = await response.json()
    expect(responseData.message).toBe('You do not have permission to submit for this workspace')
  })

  it('should update existing record when it exists', async () => {
    // Setup
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        workspace_id: 'test-workspace-id',
        role: 'client',
      },
    }).mockResolvedValueOnce({
      data: { id: 'existing-record-id' },
    })
    
    mockSupabase.update.mockResolvedValue({
      error: null,
      data: { success: true },
    })

    // Execute
    const response = await POST(mockRequest)

    // Assert
    expect(mockSupabase.update).toHaveBeenCalled()
    expect(mockSupabase.insert).not.toHaveBeenCalled()
    
    expect(response).toBeInstanceOf(NextResponse)
    expect(response.status).toBe(200)
    
    const responseData = await response.json()
    expect(responseData.success).toBe(true)
  })

  it('should insert new record when it does not exist', async () => {
    // Setup
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        workspace_id: 'test-workspace-id',
        role: 'client',
      },
    }).mockResolvedValueOnce({
      data: null,
    })
    
    mockSupabase.insert.mockResolvedValue({
      error: null,
      data: { success: true },
    })

    // Execute
    const response = await POST(mockRequest)

    // Assert
    expect(mockSupabase.insert).toHaveBeenCalled()
    expect(mockSupabase.update).not.toHaveBeenCalled()
    
    expect(response).toBeInstanceOf(NextResponse)
    expect(response.status).toBe(200)
    
    const responseData = await response.json()
    expect(responseData.success).toBe(true)
  })

  it('should handle database errors', async () => {
    // Setup
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        workspace_id: 'test-workspace-id',
        role: 'client',
      },
    }).mockResolvedValueOnce({
      data: null,
    })
    
    mockSupabase.insert.mockResolvedValue({
      error: {
        message: 'Database error',
      },
      data: null,
    })

    // Execute
    const response = await POST(mockRequest)

    // Assert
    expect(response).toBeInstanceOf(NextResponse)
    expect(response.status).toBe(500)
    
    const responseData = await response.json()
    expect(responseData.message).toBe('Database error')
  })
}) 