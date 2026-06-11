// مكتبة جلب بيانات Instagram - تجرب proxies متعددة
export interface InstagramProfile {
  fullName: string
  avatar: string | null
  bio: string | null
  followers: number
  following: number
  posts: number
  isPrivate: boolean
}

export async function fetchInstagramProfile(username: string): Promise<InstagramProfile | null> {
  const proxies = [
    `https://corsproxy.io/?url=${encodeURIComponent(`https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`)}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(`https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`)}`,
    `https://api.codetabs.com/v1/proxy?quest=https://www.instagram.com/${username}/?__a=1%26__d=dis`,
  ]

  // الطريقة 1: Instagram Internal API مباشرة
  try {
    const res = await fetch(
      `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
      {
        headers: {
          'User-Agent': 'Instagram 275.0.0.27.98 Android',
          'x-ig-app-id': '936619743392459',
          'Accept': '*/*',
          'Accept-Language': 'ar,en;q=0.9',
          'Origin': 'https://www.instagram.com',
          'Referer': `https://www.instagram.com/${username}/`,
        },
        signal: AbortSignal.timeout(7000),
      }
    )
    if (res.ok) {
      const json = await res.json()
      const user = json?.data?.user
      if (user?.edge_followed_by) {
        return buildProfile(user, username)
      }
    }
  } catch { /* continue */ }

  // الطريقة 2: corsproxy.io
  try {
    const res = await fetch(proxies[0], {
      headers: { 'x-ig-app-id': '936619743392459' },
      signal: AbortSignal.timeout(10000),
    })
    if (res.ok) {
      const text = await res.text()
      const json = JSON.parse(text)
      const user = json?.data?.user || json?.graphql?.user
      if (user?.edge_followed_by || user?.follower_count) {
        return buildProfile(user, username)
      }
    }
  } catch { /* continue */ }

  // الطريقة 3: allorigins + HTML parsing
  try {
    const res = await fetch(
      `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.instagram.com/${username}/`)}`,
      { signal: AbortSignal.timeout(15000) }
    )
    if (res.ok) {
      const data = await res.json()
      const html: string = data?.contents || ''
      const parsed = parseInstagramHTML(html, username)
      if (parsed) return parsed
    }
  } catch { /* continue */ }

  // الطريقة 4: jsonp.afeld.me proxy
  try {
    const res = await fetch(
      `https://jsonp.afeld.me/?url=${encodeURIComponent(`https://www.instagram.com/${username}/?__a=1&__d=dis`)}`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (res.ok) {
      const json = await res.json()
      const user = json?.graphql?.user
      if (user) return buildProfile(user, username)
    }
  } catch { /* continue */ }

  return null
}

function buildProfile(user: Record<string, unknown>, username: string): InstagramProfile {
  return {
    fullName: (user.full_name as string) || username,
    avatar: (user.profile_pic_url_hd as string) || (user.profile_pic_url as string) || null,
    bio: (user.biography as string) || null,
    followers: (user.edge_followed_by as { count: number })?.count ??
               (user.follower_count as number) ?? 0,
    following: (user.edge_follow as { count: number })?.count ??
               (user.following_count as number) ?? 0,
    posts: (user.edge_owner_to_timeline_media as { count: number })?.count ??
           (user.media_count as number) ?? 0,
    isPrivate: (user.is_private as boolean) ?? false,
  }
}

function parseInstagramHTML(html: string, username: string): InstagramProfile | null {
  const followersMatch = html.match(/"edge_followed_by":\{"count":(\d+)\}/)
  if (!followersMatch) return null

  const followingMatch = html.match(/"edge_follow":\{"count":(\d+)\}/)
  const postsMatch = html.match(/"edge_owner_to_timeline_media":\{"count":(\d+)\}/)
  const nameMatch = html.match(/"full_name":"([^"]+)"/)
  const bioMatch = html.match(/"biography":"([^"]*)"/)
  const picMatch = html.match(/"profile_pic_url_hd":"([^"]+)"/) ||
                   html.match(/"profile_pic_url":"([^"]+)"/)

  return {
    fullName: nameMatch ? safeJsonParse(nameMatch[1]) || username : username,
    avatar: picMatch ? picMatch[1].replace(/\\/g, '') : null,
    bio: bioMatch ? safeJsonParse(bioMatch[1]) : null,
    followers: parseInt(followersMatch[1]),
    following: followingMatch ? parseInt(followingMatch[1]) : 0,
    posts: postsMatch ? parseInt(postsMatch[1]) : 0,
    isPrivate: false,
  }
}

function safeJsonParse(str: string): string {
  try { return JSON.parse(`"${str}"`) } catch { return str }
}
