// مكتبة إشعارات تيليجرام الكاملة
  export async function sendTelegramMessage(token: string, chatId: string, text: string): Promise<boolean> {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: false }),
      })
      return res.ok
    } catch { return false }
  }

  export async function sendTelegramPhoto(token: string, chatId: string, photo: string, caption: string): Promise<boolean> {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, photo, caption, parse_mode: 'HTML' }),
      })
      if (res.ok) return true
      return sendTelegramMessage(token, chatId, caption)
    } catch { return false }
  }

  export async function sendTelegramVideo(token: string, chatId: string, video: string, caption: string): Promise<boolean> {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendVideo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, video, caption, parse_mode: 'HTML' }),
      })
      if (res.ok) return true
      return sendTelegramMessage(token, chatId, caption)
    } catch { return false }
  }

  export async function notifyFollowerGain(token: string, chatId: string, username: string, oldCount: number, newCount: number, avatar?: string | null): Promise<boolean> {
    const diff = newCount - oldCount
    const text = `📈 <b>متابعون جدد!</b>\n\n👤 <a href="https://instagram.com/${username}">@${username}</a>\n➕ <b>+${diff.toLocaleString('ar')}</b> متابع جديد\n📊 الإجمالي: <b>${newCount.toLocaleString('ar')}</b> متابع`
    if (avatar) return sendTelegramPhoto(token, chatId, avatar, text)
    return sendTelegramMessage(token, chatId, text)
  }

  export async function notifyFollowerLoss(token: string, chatId: string, username: string, oldCount: number, newCount: number): Promise<boolean> {
    const diff = oldCount - newCount
    const text = `📉 <b>فقدان متابعين</b>\n\n👤 <a href="https://instagram.com/${username}">@${username}</a>\n➖ <b>-${diff.toLocaleString('ar')}</b> متابع\n📊 الإجمالي: <b>${newCount.toLocaleString('ar')}</b> متابع`
    return sendTelegramMessage(token, chatId, text)
  }

  export async function notifyNewPost(token: string, chatId: string, username: string, post: { url: string; imageUrl: string | null; videoUrl: string | null; caption: string | null; likes: number; isVideo: boolean }): Promise<boolean> {
    const shortCaption = post.caption ? post.caption.slice(0, 180) + (post.caption.length > 180 ? '...' : '') : ''
    const text = `${post.isVideo ? '🎬' : '📸'} <b>${post.isVideo ? 'فيديو جديد' : 'منشور جديد'}!</b>\n\n👤 <a href="https://instagram.com/${username}">@${username}</a>${shortCaption ? '\n📝 ' + shortCaption : ''}\n❤️ ${post.likes.toLocaleString('ar')} إعجاب\n🔗 <a href="${post.url}">فتح المنشور ↗️</a>`
    const mediaUrl = post.videoUrl || post.imageUrl
    if (mediaUrl) {
      if (post.isVideo) return sendTelegramVideo(token, chatId, mediaUrl, text)
      return sendTelegramPhoto(token, chatId, mediaUrl, text)
    }
    return sendTelegramMessage(token, chatId, text)
  }

  export async function notifyNewStory(token: string, chatId: string, username: string, story: { imageUrl: string | null; videoUrl: string | null; timestamp: string }): Promise<boolean> {
    const timeStr = new Date(story.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    const text = `🔴 <b>ستوري جديدة!</b>\n\n👤 <a href="https://instagram.com/${username}">@${username}</a>\n🕒 ${timeStr}\n📱 <a href="https://instagram.com/stories/${username}/">عرض الستوري ↗️</a>`
    const mediaUrl = story.videoUrl || story.imageUrl
    if (mediaUrl) {
      if (story.videoUrl) return sendTelegramVideo(token, chatId, mediaUrl, text)
      return sendTelegramPhoto(token, chatId, mediaUrl, text)
    }
    return sendTelegramMessage(token, chatId, text)
  }

  export async function notifyBioChange(token: string, chatId: string, username: string, oldBio: string | null, newBio: string | null): Promise<boolean> {
    const text = `✏️ <b>تغيير في السيرة الذاتية</b>\n\n👤 <a href="https://instagram.com/${username}">@${username}</a>\n${oldBio ? '🔴 السابق: <i>' + oldBio.slice(0, 120) + '</i>\n' : ''}${newBio ? '🟢 الجديد: <i>' + newBio.slice(0, 120) + '</i>' : '🟢 تم حذف السيرة'}`
    return sendTelegramMessage(token, chatId, text)
  }