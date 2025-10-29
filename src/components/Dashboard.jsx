import { useEffect, useMemo, useState } from 'react'
import marvelApi from '../marvelApi'
import './Dashboard.css'

export default function Dashboard() {
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await marvelApi.getCharacters({ limit: 50 })
        if (mounted) setItems(data.results || [])
      } catch (e) {
        console.error(e)
        if (mounted) setError(e.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  // derived filtered list
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((it) => {
      if (q && !it.name.toLowerCase().includes(q)) return false
      if (filter === 'hasComics') return (it.comics?.available || 0) > 0
      if (filter === 'noComics') return (it.comics?.available || 0) === 0
      return true
    })
  }, [items, query, filter])

  const stats = useMemo(() => {
    const total = items.length
    const avgComics = total ? Math.round((items.reduce((s, i) => s + (i.comics?.available || 0), 0) / total) * 10) / 10 : 0
    const withStories = items.filter((i) => (i.stories?.available || 0) > 0).length
    return { total, avgComics, withStories }
  }, [items])

  return (
    <div className="dashboard">
      <h1>Marvel Characters  </h1>

      <div className="controls">
        <input
          aria-label="search"
          placeholder="Search by name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="hasComics">Has comics</option>
          <option value="noComics">No comics</option>
        </select>
      </div>

      <div className="stats">
        <div className="stat">Fetched: <strong>{stats.total}</strong></div>
        <div className="stat">Avg comics: <strong>{stats.avgComics}</strong></div>
        <div className="stat">With stories: <strong>{stats.withStories}</strong></div>
      </div>

      {loading && <p>Loading characters...</p>}
      {error && <p className="error">{error}</p>}

      <table className="list">
        <thead>
          <tr>
            <th>Thumbnail</th>
            <th>Name</th>
            <th>Comics</th>
            <th>Series</th>
          </tr>
        </thead>
        <tbody>
          {filtered.slice(0, 100).map((ch) => (
            <tr key={ch.id}>
              <td>
                {ch.thumbnail ? (
                  <img src={`${ch.thumbnail.path}/standard_small.${ch.thumbnail.extension}`} alt="thumb" />
                ) : ('—')}
              </td>
              <td>{ch.name}</td>
              <td>{ch.comics?.available ?? 0}</td>
              <td>{ch.series?.available ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {filtered.length === 0 && !loading && <p>No results</p>}
    </div>
  )
}
