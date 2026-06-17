import { Sparkles, ListMusic, TrendingUp, Languages, BookText, Drum, Landmark, PartyPopper, CloudMoon, Heart, Dumbbell } from 'lucide-react'

export default function CategoryRibbon({
  currentUser,
  themed = {},
  discovery = {},
  activeCategory,
  handleCategoryClick,
  style = {}
}) {
  const items = [
    { id: 'section-for-you', label: 'For You', icon: Sparkles },
    { id: 'section-playlists', label: 'My Playlists', icon: ListMusic, condition: currentUser !== null },
    { id: 'section-trending', label: 'Trending', icon: TrendingUp, condition: themed.trending?.songs && themed.trending.songs.length > 0 },
    { id: 'section-hindi', label: 'Hindi', icon: Languages },
    { id: 'section-english', label: 'English', icon: BookText },
    { id: 'section-punjabi', label: 'Punjabi', icon: Drum },
    { id: 'section-marathi', label: 'Marathi', icon: Landmark, condition: discovery.marathi?.songs && discovery.marathi.songs.length > 0 },
    { id: 'section-party', label: 'Party', icon: PartyPopper, condition: themed.party?.songs && themed.party.songs.length > 0 },
    { id: 'section-chill', label: 'Chill', icon: CloudMoon, condition: themed.chill?.songs && themed.chill.songs.length > 0 },
    { id: 'section-romantic', label: 'Romantic', icon: Heart, condition: themed.romantic?.songs && themed.romantic.songs.length > 0 },
    { id: 'section-workout', label: 'Workout', icon: Dumbbell, condition: themed.workout?.songs && themed.workout.songs.length > 0 },
  ]

  return (
    <nav className="category-nav-ribbon" style={style} aria-label="Music category list">
      {items.map((item) => {
        if (item.condition === false) return null
        const Icon = item.icon
        return (
          <button
            key={item.id}
            className={`mobile-nav-tab ${activeCategory === item.id ? 'active' : ''}`}
            onClick={() => handleCategoryClick(item.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Icon size={16} strokeWidth={1.75} style={{ flexShrink: 0 }} />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
