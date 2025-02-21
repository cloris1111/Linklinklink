import { useState, useEffect, FormEvent } from 'react'
import './App.css'

interface Link {
  id: string
  title: string
  url: string
  tags: string[]
  createdAt: number
}

function App() {
  const [links, setLinks] = useState<Link[]>(() => {
    const savedLinks = localStorage.getItem('links')
    return savedLinks ? JSON.parse(savedLinks) : []
  })

  const [formData, setFormData] = useState({
    title: '',
    url: '',
    tags: ''
  })

  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem('links', JSON.stringify(links))
  }, [links])

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    if (name === 'url' && value) {
      try {
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(value)}`)
        const data = await response.json()
        if (data.contents) {
          const doc = new DOMParser().parseFromString(data.contents, 'text/html')
          const pageTitle = doc.title || ''
          if (!formData.title.trim()) {
            setFormData(prev => ({ ...prev, title: pageTitle }))
          }
        }
      } catch (error) {
        console.error('获取标题失败:', error)
      }
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    let pageTitle = formData.title.trim()
    if (!pageTitle) {
      try {
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(formData.url)}`)
        const data = await response.json()
        if (data.contents) {
          const doc = new DOMParser().parseFromString(data.contents, 'text/html')
          pageTitle = doc.title || ''
        }
      } catch (error) {
        console.error('获取标题失败:', error)
        pageTitle = ''
      }
    }

    const newLink: Link = {
      id: Date.now().toString(),
      title: pageTitle,
      url: formData.url.trim(),
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      createdAt: Date.now()
    }

    setLinks(prev => [newLink, ...prev])
    setFormData({ title: '', url: '', tags: '' })
  }

  const groupedLinks = links.reduce((groups: { [key: string]: Link[] }, link) => {
    link.tags.forEach(tag => {
      if (!groups[tag]) {
        groups[tag] = []
      }
      groups[tag].push(link)
    })
    return groups
  }, {})

  const handleDelete = (linkId: string) => {
    setLinks(prev => prev.filter(link => link.id !== linkId))
  }

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag)
  }

  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const filteredLinks = searchQuery
    ? Object.entries(groupedLinks).reduce((acc, [tag, links]) => {
        const filtered = links.filter(
          link =>
            link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            link.url.toLowerCase().includes(searchQuery.toLowerCase())
        )
        if (filtered.length > 0) {
          acc[tag] = filtered
        }
        return acc
      }, {} as { [key: string]: Link[] })
    : groupedLinks

  return (
    <div className="app-container">
      <header className="header">
        <h1>Linklink</h1>
        <p>你的个人链接收藏夹</p>
      </header>

      <main className="main-content">
        <section className="add-link-section">
          <h2>添加新链接</h2>
          <form className="add-link-form" onSubmit={handleSubmit}>
            <input
              type="url"
              name="url"
              value={formData.url}
              onChange={handleInputChange}
              placeholder="输入URL地址"
              className="form-input"
              required
            />
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="输入链接标题（选填，默认使用网页标题）"
              className="form-input"
            />
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="添加标签（用逗号分隔）"
              className="form-input"
            />
            <button type="submit" className="submit-button">
              保存链接
            </button>
          </form>
        </section>

        <section className="links-section">
          <h2>我的链接</h2>
          <div className="links-container">
            {Object.keys(groupedLinks).length === 0 ? (
              <p className="empty-state">还没有保存的链接，开始添加吧！</p>
            ) : selectedTag ? (
              <div className="tag-content">
                <button className="back-button" onClick={() => setSelectedTag(null)}>
                  返回标签列表
                </button>
                <h3 className="tag-title">{selectedTag}</h3>
                <div className="links-list">
                  {groupedLinks[selectedTag].map(link => (
                    <div key={link.id} className="link-item">
                      <div className="link-content">
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="link-title">
                          {link.title}
                        </a>
                        <span className="link-url">{link.url}</span>
                      </div>
                      <button
                        className="delete-button"
                        onClick={() => handleDelete(link.id)}
                        aria-label="删除链接"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="search-container">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="搜索链接标题或URL"
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                </div>
                <div className="tags-grid">
                  {Object.entries(filteredLinks).map(([tag, links]) => (
                    <div
                      key={tag}
                      className="tag-card"
                      onClick={() => handleTagClick(tag)}
                    >
                      <div className="tag-icon">{tag[0].toUpperCase()}</div>
                      <h3 className="tag-name">{tag}</h3>
                      <span className="link-count">{links.length} 个链接</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
