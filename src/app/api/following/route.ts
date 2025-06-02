import { NextRequest, NextResponse } from 'next/server'
import { getFollowing } from '../../../../lib/farcaster'

export async function GET(request: NextRequest) {
  try {
    // Extract FID from query parameters
    const { searchParams } = new URL(request.url)
    const fidParam = searchParams.get('fid')
    
    if (!fidParam) {
      return NextResponse.json({
        success: false,
        error: 'FID parameter is required'
      }, { status: 400 })
    }

    const fid = parseInt(fidParam)
    if (isNaN(fid) || fid <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid FID format'
      }, { status: 400 })
    }

    console.log(`📤 Fetching ALL following for FID: ${fid} (paginated)`)

    // Fetch ALL following using pagination with small batches
    const allFollowing: any[] = []
    let cursor: string | undefined = undefined
    let pageCount = 0
    const maxPages = 40 // Safety limit (40 * 25 = 1000 max following)
    const batchSize = 25 // Small batch size to avoid API errors

    do {
      try {
        console.log(`📄 Page ${pageCount + 1}: Fetching ${batchSize} following${cursor ? ` (cursor: ${cursor.substring(0, 10)}...)` : ''}`)
        
        const followingResponse = await getFollowing(fid, batchSize, cursor)
        const pageFollowing = followingResponse.data
        
        allFollowing.push(...pageFollowing)
        cursor = followingResponse.nextCursor
        pageCount++
        
        console.log(`📄 Page ${pageCount}: +${pageFollowing.length} following (total: ${allFollowing.length})`)
        
        // Small delay between requests to be respectful
        if (cursor && pageCount < maxPages) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
      } catch (pageError) {
        console.error(`❌ Failed to fetch following page ${pageCount + 1}:`, pageError)
        // Break on error rather than failing completely
        break
      }
      
    } while (cursor && pageCount < maxPages)
    
    console.log(`📤 Successfully fetched ${allFollowing.length} total following for FID ${fid} across ${pageCount} pages`)

    return NextResponse.json({
      success: true,
      following: allFollowing,
      count: allFollowing.length,
      pagesFetched: pageCount,
      isComplete: !cursor || pageCount >= maxPages
    })

  } catch (error) {
    console.error('❌ Following API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch following'
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
} 