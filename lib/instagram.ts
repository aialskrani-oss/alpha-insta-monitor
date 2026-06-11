// مكتبة جلب بيانات Instagram عبر Apify
  export interface InstagramProfile {
    fullName: string
    avatar: string | null
    bio: string | null
    followers: number
    following: number
    posts: number
    isPrivate: boolean
    isVerified: boolean
  }

  export interface InstagramPost {
    id: string
    shortCode: string
    url: string
    imageUrl: string | null
    videoUrl: string | null
    caption: string | null
    timestamp: string
    likes: number
    comments: number
    isVideo: boolean
  }

  export interface InstagramStory {
    id: string
    imageUrl: string | null
    videoUrl: string | null
    timestamp: string
  }

  export async function fetchInstagramProfile(
    username: string,
    apifyToken: string
  ): Promise<InstagramProfile | null> {
    try {
      const runRes = await fetch(
        'https://api.apify.com/v2/acts/apify~instagram-profile-scraper/runs',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apifyToken}` },
          body: JSON.stringify({ usernames: [username] }),
          signal: AbortSignal.timeout(10000),
        }
      )
      if (!runRes.ok) return null
      const runData = await runRes.json()
      const runId = runData?.data?.id
      if (!runId) return null
      const items = await pollApifyRun(runId, apifyToken, 90)
      if (!items || items.length === 0) return null
      const u = items[0] as Record<string, unknown>
      return {
        fullName: (u.fullName as string) || (u.full_name as string) || username,
        avatar: (u.profilePicUrl as string) || (u.profile_pic_url as string) || null,
        bio: (u.biography as string) || (u.bio as string) || null,
        followers: (u.followersCount as number) ?? ((u.edge_followed_by as Record<string,number>)?.count ?? 0),
        following: (u.followsCount as number) ?? ((u.edge_follow as Record<string,number>)?.count ?? 0),
        posts: (u.postsCount as number) ?? ((u.edge_owner_to_timeline_media as Record<string,number>)?.count ?? 0),
        isPrivate: (u.isPrivate as boolean) ?? false,
        isVerified: (u.verified as boolean) ?? (u.isVerified as boolean) ?? false,
      }
    } catch { return null }
  }

  export async function fetchInstagramPosts(
    username: string,
    apifyToken: string,
    limit = 5
  ): Promise<InstagramPost[]> {
    try {
      const runRes = await fetch(
        'https://api.apify.com/v2/acts/apify~instagram-scraper/runs',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apifyToken}` },
          body: JSON.stringify({
            directUrls: [`https://www.instagram.com/${username}/`],
            resultsType: 'posts',
            resultsLimit: limit,
          }),
          signal: AbortSignal.timeout(10000),
        }
      )
      if (!runRes.ok) return []
      const runData = await runRes.json()
      const runId = runData?.data?.id
      if (!runId) return []
      const items = await pollApifyRun(runId, apifyToken, 120)
      if (!items) return []
      return items.slice(0, limit).map((item: Record<string, unknown>) => ({
        id: String(item.id || item.shortCode || ''),
        shortCode: String(item.shortCode || ''),
        url: `https://www.instagram.com/p/${item.shortCode}/`,
        imageUrl: (item.displayUrl as string) || (item.thumbnailUrl as string) || null,
        videoUrl: (item.videoUrl as string) || null,
        caption: (item.caption as string) || null,
        timestamp: (item.timestamp as string) || new Date().toISOString(),
        likes: Number(item.likesCount) || 0,
        comments: Number(item.commentsCount) || 0,
        isVideo: Boolean(item.isVideo),
      }))
    } catch { return [] }
  }

  export async function fetchInstagramStories(
    username: string,
    apifyToken: string
  ): Promise<InstagramStory[]> {
    try {
      const runRes = await fetch(
        'https://api.apify.com/v2/acts/apify~instagram-scraper/runs',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apifyToken}` },
          body: JSON.stringify({
            directUrls: [`https://www.instagram.com/stories/${username}/`],
            resultsType: 'stories',
            resultsLimit: 20,
          }),
          signal: AbortSignal.timeout(10000),
        }
      )
      if (!runRes.ok) return []
      const runData = await runRes.json()
      const runId = runData?.data?.id
      if (!runId) return []
      const items = await pollApifyRun(runId, apifyToken, 120)
      if (!items) return []
      return items.map((item: Record<string, unknown>) => ({
        id: String(item.id || ''),
        imageUrl: (item.displayUrl as string) || null,
        videoUrl: (item.videoUrl as string) || null,
        timestamp: (item.timestamp as string) || new Date().toISOString(),
      }))
    } catch { return [] }
  }

  async function pollApifyRun(runId: string, token: string, timeoutSecs: number): Promise<Record<string, unknown>[] | null> {
    const deadline = Date.now() + timeoutSecs * 1000
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 4000))
      const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const { data } = await statusRes.json()
      if (data?.status === 'SUCCEEDED') {
        const dsRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const items = await dsRes.json()
        return Array.isArray(items) ? items : null
      }
      if (data?.status === 'FAILED' || data?.status === 'ABORTED') return null
    }
    return null
  }