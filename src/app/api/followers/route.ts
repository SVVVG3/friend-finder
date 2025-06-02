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

    console.log(`📥 Fetching followers for FID: ${fid}`)

    // Fetch followers with reasonable limit to avoid API rate limits
    const followersResponse = await getFollowers(fid, 200)
    
    const followers = followersResponse.data
    
    console.log(`📥 Successfully fetched ${followers.length} followers for FID ${fid}`)

    return NextResponse.json({
      success: true,
      followers: followers,
      count: followers.length,
      hasMore: followersResponse.hasMore,
      nextCursor: followersResponse.nextCursor
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