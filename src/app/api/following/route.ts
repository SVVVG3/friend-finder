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

    console.log(`📤 Fetching following for FID: ${fid}`)

    // Fetch all following (up to API limits)
    const followingResponse = await getFollowing(fid, 1000)
    
    const following = followingResponse.data
    
    console.log(`📤 Fetched ${following.length} following for FID ${fid}`)

    return NextResponse.json({
      success: true,
      following: following,
      count: following.length
    })

  } catch (error) {
    console.error('❌ Following API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch following'
    }, { status: 500 })
  }
} 