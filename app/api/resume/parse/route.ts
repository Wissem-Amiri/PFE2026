import { NextRequest, NextResponse } from 'next/server'
import { processParsedCVData } from '@/app/api/applications'
import type { ParsedCVData } from '@/app/api/aiScoring'

/**
 * POST /api/resume/parse
 * Receives parsed CV data from an external API or frontend,
 * fetches the corresponding job, calculates the match score,
 * and updates the candidate's application record.
 */
export async function POST(req: NextRequest) {
  try {
    const cvData: ParsedCVData = await req.json()
    
    // In the user's example, the application ID is passed as "id" in the root of the object
    const applicationId = cvData.id

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID (id) is required in the parsed data' }, { status: 400 })
    }

    // Process the parsed CV data and update the application score
    const result = await processParsedCVData(applicationId, cvData)

    if (result.error) {
      const isNotFound = result.error.toLowerCase().includes('not found')
      return NextResponse.json({ error: result.error }, { status: isNotFound ? 404 : 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'CV data processed and match score updated',
      matchPercentage: result.data?.score,
      applicationId
    })

  } catch (error: any) {
    console.error('CV Parsing Integration Error:', error)
    return NextResponse.json({ 
      error: error.message || 'An internal error occurred during CV data processing' 
    }, { status: 500 })
  }
}
