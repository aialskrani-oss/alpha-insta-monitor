// مكتبة جلب بيانات Instagram - تجرب طرقاً متعددة
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
  // الطريقة 1: Instagram Internal API مع x-ig-app-id
  try {
    const res = await fetch(
      `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          'x-ig-app-id': '936619743392459',
          'Accept': '*/*',
          'Accept-Language': 'ar,en;q=0.9',
          'Origin': 'https://www.instagram.com',
          'Referer': 'https://www.instagram.com/',
        },
        signal: AbortSignal.timeout(8000),
      }
    )

    if (res.ok) {
      const json = await res.json()
      const user = json?.data?.user
      if (user) {
        return {
          fullName: user.full_name || username,
          avatar: user.profile_pic_url_hd || user.profile_pic_url || null,
          bio: user.biography || null,
          followers: user.edge_followed_by?.count ?? 0,
          following: user.edge_follow?.count ?? 0,
          posts: user.edge_owner_to_timeline_media?.count ?? 0,
          isPrivate: user.is_private ?? false,
        }
      }
    }
  } catch {
    // الانتقال للطريقة التالية
  }

  // الطريقة 2: Instagram Web API القديم
  try {
    const res = await fetch(
      `https://www.instagram.com/${username}/?__a=1&__d=dis`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'ar,en-US;q=0.9',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': 'https://www.instagram.com/',
        },
        signal: AbortSignal.timeout(6000),
      }
    )

    if (res.ok) {
      const json = await res.json()
      const user = json?.graphql?.user
      if (user) {
        return {
          fullName: user.full_name || username,
          avatar: user.profile_pic_url_hd || user.profile_pic_url || null,
          bio: user.biography || null,
          followers: user.edge_followed_by?.count ?? 0,
          following: user.edge_follow?.count ?? 0,
          posts: user.edge_owner_to_timeline_media?.count ?? 0,
          isPrivate: user.is_private ?? false,
        }
      }
    }
  } catch {
    // الانتقال للطريقة التالية
  }

  // الطريقة 3: proxy مجاني عبر allorigins لتجاوز CORS
  try {
    const encoded = encodeURIComponent(`https://www.instagram.com/${username}/`)
    const res = await fetch(
      `https://api.allorigins.win/get?url=${encoded}`,
      { signal: AbortSignal.timeout(12000) }
    )
    if (res.ok) {
      const data = await res.json()
      const html: string = data?.contents || ''

      const followersMatch = html.match(/"edge_followed_by":\{"count":(\d+)\}/)
      const followingMatch = html.match(/"edge_follow":\{"count":(\d+)\}/)
      const postsMatch = html.match(/"edge_owner_to_timeline_media":\{"count":(\d+)\}/)
      const nameMatch = html.match(/"full_name":"([^"]+)"/)
      const bioMatch = html.match(/"biography":"([^"]*)"/)
      const picMatch = html.match(/"profile_pic_url_hd":"([^"]+)"/) ||
                       html.match(/"profile_pic_url":"([^"]+)"/)

      if (followersMatch) {
        return {
          fullName: nameMatch ? JSON.parse(`"${nameMatch[1]}"`) : username,
          avatar: picMatch ? picMatch[1].replace(/\\/g, '') : null,
          bio: bioMatch ? JSON.parse(`"${bioMatch[1]}"`) : null,
          followers: parseInt(followersMatch[1]),
          following: followingMatch ? parseInt(followingMatch[1]) : 0,
          posts: postsMatch ? parseInt(postsMatch[1]) : 0,
          isPrivate: false,
        }
      }
    }
  } catch {
    // كل الطرق فشلت
  }

  return null
}
