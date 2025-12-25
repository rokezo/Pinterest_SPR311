import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSearchParams } from 'react-router-dom'
import { pinsService } from '../api/pins'
import PinCard from './PinCard'
import './PinGrid.css'

const PinGrid = () => {
  const [pins, setPins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { isAuthenticated } = useAuth()
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('q') || ''

  useEffect(() => {
    console.log('PinGrid: searchQuery changed to:', searchQuery)
    loadPins(1)
  }, [isAuthenticated, searchQuery])

  const loadPins = async (pageNum = 1) => {
    try {
      setLoading(true)
      let response
      if (searchQuery.trim()) {
        response = await pinsService.searchPins(searchQuery, pageNum, 20)
      } else {
        response = await pinsService.getPins(pageNum, 20, true)
      }
      if (pageNum === 1) {
        setPins(response.pins || [])
      } else {
        setPins((prev) => [...prev, ...(response.pins || [])])
      }
      setHasMore(pageNum < (response.totalPages || 1))
      setPage(pageNum)
    } catch (err) {
      setError('Failed to load pins')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      loadPins(page + 1)
    }
  }

  if (error) {
    return <div className="pin-grid-error">{error}</div>
  }

  if (loading && pins.length === 0) {
    return (
      <div className="pin-grid-loading">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (pins.length === 0 && !loading && !searchQuery) {
    const demoPins = [
      {
        id: 1,
        title: 'Beautiful Landscape',
        description: 'Amazing nature view',
        imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
        ownerUsername: 'Demo',
        likesCount: 0,
        imageWidth: 400,
        imageHeight: 600,
      },
      {
        id: 2,
        title: 'City Lights',
        description: 'Urban photography',
        imageUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400',
        ownerUsername: 'Demo',
        likesCount: 0,
        imageWidth: 400,
        imageHeight: 500,
      },
      {
        id: 3,
        title: 'Ocean Sunset',
        description: 'Beautiful sunset by the ocean',
        imageUrl: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400',
        ownerUsername: 'Demo',
        likesCount: 0,
        imageWidth: 400,
        imageHeight: 550,
      },
      {
        id: 4,
        title: 'Forest Path',
        description: 'Peaceful forest walk',
        imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
        ownerUsername: 'Demo',
        likesCount: 0,
        imageWidth: 400,
        imageHeight: 650,
      },
      {
        id: 5,
        title: 'Desert Dunes',
        description: 'Golden sand dunes',
        imageUrl: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400',
        ownerUsername: 'Demo',
        likesCount: 0,
        imageWidth: 400,
        imageHeight: 600,
      },
      {
        id: 6,
        title: 'Tropical Beach',
        description: 'Paradise island view',
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400',
        ownerUsername: 'Demo',
        likesCount: 0,
        imageWidth: 400,
        imageHeight: 580,
      },
      {
        id: 7,
        title: 'Modern Architecture',
        description: 'Contemporary building design',
        imageUrl: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=400',
        ownerUsername: 'Demo',
        likesCount: 0,
        imageWidth: 400,
        imageHeight: 620,
      },
      {
        id: 8,
        title: 'Coffee Art',
        description: 'Beautiful latte art',
        imageUrl: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400',
        ownerUsername: 'Demo',
        likesCount: 0,
        imageWidth: 400,
        imageHeight: 540,
      },
      {
        id: 9,
        title: 'Flower Garden',
        description: 'Colorful spring flowers',
        imageUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400',
        ownerUsername: 'Demo',
        likesCount: 0,
        imageWidth: 400,
        imageHeight: 600,
      },
      {
        id: 10,
        title: 'Night Sky',
        description: 'Starry night photography',
        imageUrl: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400',
        ownerUsername: 'Demo',
        likesCount: 0,
        imageWidth: 400,
        imageHeight: 560,
      },
      {
        id: 11,
        title: 'Vintage Car',
        description: 'Classic automobile',
        imageUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400',
        ownerUsername: 'Demo',
        likesCount: 0,
        imageWidth: 400,
        imageHeight: 500,
      },
      {
        id: 12,
        title: 'Abstract Art',
        description: 'Modern abstract painting',
        imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400',
        ownerUsername: 'Demo',
        likesCount: 0,
        imageWidth: 400,
        imageHeight: 640,
      },
      {
        id: 13,
        title: 'Food Photography',
        description: 'Delicious gourmet dish',
        imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
        ownerUsername: 'Demo',
        likesCount: 0,
        imageWidth: 400,
        imageHeight: 520,
      },
      {
        id: 14,
        title: 'Minimalist Design',
        description: 'Clean and simple',
        imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400',
        ownerUsername: 'Demo',
        likesCount: 0,
        imageWidth: 400,
        imageHeight: 600,
      },
    ]

    return (
      <div className="pin-grid">
        {demoPins.map((pin) => (
          <PinCard key={pin.id} pin={pin} />
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="pin-grid">
        {pins.map((pin) => (
          <PinCard key={pin.id} pin={pin} />
        ))}
      </div>
      {hasMore && (
        <div className="load-more-container">
          <button
            className="load-more-btn"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </>
  )
}

export default PinGrid

