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

    console.log(`📥 Fetching ALL followers for FID: ${fid}`)

    const maxPages = 200 // Much higher limit (200 * 100 = 20000 max, but will stop when no more data)
    const batchSize = 100 // Reverting to 100 - 150 caused 400 errors
    let cursor: string | undefined
    let page = 1
    let allFollowers: any[] = []

    do {
      try {
        console.log(`📄 Page ${page}: Fetching ${batchSize} followers${cursor ? ` (cursor: ${cursor.substring(0, 10)}...)` : ''}`)
        
        const followersResponse = await getFollowers(fid, batchSize, cursor)
        const pageFollowers = followersResponse.data
        
        allFollowers.push(...pageFollowers)
        cursor = followersResponse.nextCursor
        page++
        
        console.log(`📄 Page ${page}: +${pageFollowers.length} followers (total: ${allFollowers.length})`)
        
        // Small delay between requests to be respectful
        if (cursor && page < maxPages) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
      } catch (pageError) {
        console.error(`❌ Failed to fetch followers page ${page}:`, pageError)
        // Break on error rather than failing completely
        break
      }
      
    } while (cursor && page < maxPages)
    
    console.log(`📥 Successfully fetched ${allFollowers.length} total followers for FID ${fid} across ${page - 1} pages`)

    return NextResponse.json({
      success: true,
      followers: allFollowers,
      count: allFollowers.length,
      pagesFetched: page - 1,
      isComplete: !cursor || page >= maxPages
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