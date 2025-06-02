import { FarcasterUser, getUserProfile } from '../lib/farcaster'

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds
const MAX_CACHE_SIZE = 1000 // Maximum number of profiles to cache

// Cache entry structure
interface CacheEntry {
  profile: FarcasterUser
  timestamp: number
  accessCount: number
  lastAccessed: number
}

// In-memory cache storage
class ProfileCache {
  private cache = new Map<number, CacheEntry>()

  /**
   * Get profile from cache or fetch if not cached/expired
   */
  async getProfile(fid: number): Promise<FarcasterUser> {
    const entry = this.cache.get(fid)
    const now = Date.now()

    // Check if cache entry exists and is still valid
    if (entry && (now - entry.timestamp) < CACHE_TTL) {
      // Update access statistics
      entry.accessCount++
      entry.lastAccessed = now
      
      console.log(`✅ Cache HIT for FID ${fid} (age: ${Math.round((now - entry.timestamp) / 1000)}s)`)
      return entry.profile
    }

    // Cache miss or expired - fetch fresh data
    console.log(`❌ Cache MISS for FID ${fid} - fetching fresh data`)
    
    try {
      const profile = await getUserProfile(fid)
      
      // Store in cache
      this.setProfile(fid, profile)
      
      return profile
    } catch (error) {
      console.error(`Failed to fetch profile for FID ${fid}:`, error)
      
      // If we have expired data, return it as fallback
      if (entry) {
        console.log(`⚠️ Using expired cache data for FID ${fid} as fallback`)
        entry.lastAccessed = now
        return entry.profile
      }
      
      throw error
    }
  }

  /**
   * Manually set a profile in cache
   */
  setProfile(fid: number, profile: FarcasterUser): void {
    const now = Date.now()
    
    // Check cache size and evict if necessary
    if (this.cache.size >= MAX_CACHE_SIZE && !this.cache.has(fid)) {
      this.evictLeastRecentlyUsed()
    }

    this.cache.set(fid, {
      profile,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now
    })

    console.log(`📝 Cached profile for FID ${fid} (${profile.username})`)
  }

  /**
   * Get multiple profiles efficiently (batch fetch uncached ones)
   */
  async getProfiles(fids: number[]): Promise<Record<number, FarcasterUser>> {
    const result: Record<number, FarcasterUser> = {}
    const uncachedFids: number[] = []

    // Check cache for each FID
    for (const fid of fids) {
      const entry = this.cache.get(fid)
      const now = Date.now()

      if (entry && (now - entry.timestamp) < CACHE_TTL) {
        entry.accessCount++
        entry.lastAccessed = now
        result[fid] = entry.profile
      } else {
        uncachedFids.push(fid)
      }
    }

    // Fetch uncached profiles individually (could be optimized with batch API)
    for (const fid of uncachedFids) {
      try {
        const profile = await this.getProfile(fid)
        result[fid] = profile
      } catch (error) {
        console.error(`Failed to fetch profile for FID ${fid}:`, error)
        // Continue with other profiles
      }
    }

    return result
  }

  /**
   * Invalidate a specific profile cache entry
   */
  invalidate(fid: number): void {
    if (this.cache.delete(fid)) {
      console.log(`🗑️ Invalidated cache for FID ${fid}`)
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size
    this.cache.clear()
    console.log(`🗑️ Cleared entire cache (${size} entries)`)
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.cache.values())
    const now = Date.now()
    
    return {
      size: this.cache.size,
      totalAccesses: entries.reduce((sum, entry) => sum + entry.accessCount, 0),
      avgAge: entries.length > 0 
        ? Math.round(entries.reduce((sum, entry) => sum + (now - entry.timestamp), 0) / entries.length / 1000)
        : 0,
      oldestEntry: entries.length > 0 
        ? Math.round(Math.max(...entries.map(entry => now - entry.timestamp)) / 1000)
        : 0
    }
  }

  /**
   * Evict least recently used entries
   */
  private evictLeastRecentlyUsed(): void {
    const entries = Array.from(this.cache.entries())
    
    // Sort by last accessed time (oldest first)
    entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)
    
    // Remove oldest 10% or at least 1 entry
    const toRemove = Math.max(1, Math.floor(entries.length * 0.1))
    
    for (let i = 0; i < toRemove; i++) {
      const [fid] = entries[i]
      this.cache.delete(fid)
      console.log(`🗑️ Evicted LRU cache entry for FID ${fid}`)
    }
  }
}

// Export singleton instance
export const profileCache = new ProfileCache()

// Export cache utilities
export default profileCache 