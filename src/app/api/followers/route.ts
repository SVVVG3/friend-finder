import { NextRequest, NextResponse } from 'next/server'
import { getFollowers } from '../../../../lib/farcaster'

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

    console.log(`📥 Fetching ALL followers for FID: ${fid} (paginated)`)

    // Fetch ALL followers using pagination with small batches
    const allFollowers: any[] = []
    let cursor: string | undefined = undefined
    let pageCount = 0
    const maxPages = 40 // Safety limit (40 * 25 = 1000 max followers)
    const batchSize = 25 // Small batch size to avoid API errors

    do {
      try {
        console.log(`📄 Page ${pageCount + 1}: Fetching ${batchSize} followers${cursor ? ` (cursor: ${cursor.substring(0, 10)}...)` : ''}`)
        
        const followersResponse = await getFollowers(fid, batchSize, cursor)
        const pageFollowers = followersResponse.data
        
        allFollowers.push(...pageFollowers)
        cursor = followersResponse.nextCursor
        pageCount++
        
        console.log(`📄 Page ${pageCount}: +${pageFollowers.length} followers (total: ${allFollowers.length})`)
        
        // Small delay between requests to be respectful
        if (cursor && pageCount < maxPages) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
      } catch (pageError) {
        console.error(`❌ Failed to fetch followers page ${pageCount + 1}:`, pageError)
        // Break on error rather than failing completely
        break
      }
      
    } while (cursor && pageCount < maxPages)
    
    console.log(`📥 Successfully fetched ${allFollowers.length} total followers for FID ${fid} across ${pageCount} pages`)

    return NextResponse.json({
      success: true,
      followers: allFollowers,
      count: allFollowers.length,
      pagesFetched: pageCount,
      isComplete: !cursor || pageCount >= maxPages
    })

  } catch (error) {
    console.error('❌ Followers API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch followers'
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
} 