import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL ?? '/api'
const POSTS_PER_PAGE = 9
/** Resolve cover_image path (e.g. /uploads/blog/x.jpg) to full API URL */
function coverUrl(path: string | null): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${API_BASE}${path}`
}

interface BlogPostListItem {
  id: string
  slug: string
  title: string
  excerpt: string | null
  cover_image: string | null
  author_name: string
  tags: string | null
  created_at: string
}

interface BlogPost extends BlogPostListItem {
  content: string
  updated_at: string
}

// Simple markdown → HTML (headings, bold, italic, links, code, lists, paragraphs)
function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-6 mb-2 text-gray-900 dark:text-white">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-8 mb-3 text-gray-900 dark:text-white">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener">$1</a>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-gray-700 dark:text-gray-300">$1</li>')
    .replace(/\n\n/g, '</p><p class="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">')
    .replace(/^(.+)$/gm, (line) => {
      if (line.startsWith('<h') || line.startsWith('<li') || line.startsWith('</p>')) return line
      return line
    })
}

function BlogList() {
  const [posts, setPosts] = useState<BlogPostListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), per_page: String(POSTS_PER_PAGE) })
    fetch(`${API_BASE}/blog/posts?${params}`)
      .then(r => r.json())
      .then((data: BlogPostListItem[]) => {
        setPosts(data)
        setHasMore(data.length === POSTS_PER_PAGE)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <svg width="90" height="30" viewBox="0 0 220 72" fill="none">
              <defs>
                <linearGradient id="blg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#34d399"/>
                  <stop offset="100%" stopColor="#818cf8"/>
                </linearGradient>
              </defs>
              <path d="M32 36 Q32 10 8 10 Q-16 10 -16 36 Q-16 62 32 62 Q80 62 80 36 Q80 10 32 10"
                    fill="none" stroke="url(#blg)" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="32" cy="36" r="4" fill="url(#blg)"/>
              <text x="68" y="40" fontFamily="'SF Pro Display',-apple-system,sans-serif" fontWeight="700" fontSize="30" fill="currentColor" letterSpacing="-0.5">cforj</text>
            </svg>
          </Link>
          <span className="text-sm font-medium text-gray-400 dark:text-gray-500">Blog</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Blog</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-10">Updates, tutorials, and insights about interactive learning</p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <p className="text-gray-400 text-center py-20">No posts yet. Stay tuned!</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map(post => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="block group"
                >
                  <article className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden hover:border-gray-200 dark:hover:border-gray-700 transition-colors h-full flex flex-col">
                    {post.cover_image && (
                      <img
                        src={coverUrl(post.cover_image)}
                        alt=""
                        className="w-full aspect-[2/1] object-cover"
                      />
                    )}
                    <div className="p-5 flex-1 flex flex-col">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{post.excerpt}</p>
                      )}
                      <div className="flex items-center gap-3 mt-auto pt-3 text-xs text-gray-400 dark:text-gray-500 flex-wrap">
                        <span>{post.author_name}</span>
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        {post.tags && (
                          <div className="flex gap-1">
                            {post.tags.split(',').map(t => (
                              <span key={t} className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{t.trim()}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {(page > 1 || hasMore) && (
              <div className="flex items-center justify-center gap-4 mt-12">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={page <= 1}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400">Page {page}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!hasMore}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function BlogPostView() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/blog/posts/${slug}`)
      .then(r => {
        if (!r.ok) throw new Error('Not found')
        return r.json()
      })
      .then(setPost)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Post not found</h1>
          <Link to="/blog" className="text-primary hover:underline text-sm">Back to blog</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <header className="border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link to="/blog" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            &larr; Back to blog
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {post.cover_image && (
          <img src={coverUrl(post.cover_image)} alt="" className="w-full aspect-[2/1] object-cover rounded-2xl mb-8" />
        )}

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{post.title}</h1>

        <div className="flex items-center gap-3 text-sm text-gray-400 dark:text-gray-500 mb-8">
          <span>{post.author_name}</span>
          <span>{new Date(post.created_at).toLocaleDateString()}</span>
          {post.tags && (
            <div className="flex gap-1">
              {post.tags.split(',').map(t => (
                <span key={t} className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-xs">{t.trim()}</span>
              ))}
            </div>
          )}
        </div>

        <div
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
        />
      </main>

      <footer className="border-t border-gray-100 dark:border-gray-800 py-8 text-center text-xs text-gray-400">
        <Link to="/" className="hover:text-primary">cforj.studio</Link>
      </footer>
    </div>
  )
}

export function BlogPage() {
  const { slug } = useParams<{ slug: string }>()
  return slug ? <BlogPostView /> : <BlogList />
}
