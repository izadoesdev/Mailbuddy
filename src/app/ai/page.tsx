"use client";

import type { FormEvent } from "react";
import { useState, useEffect } from "react";
import { searchSimilarEmails } from "./actions/searchSimilarEmails";
import { storeEmailEmbedding } from "./actions/storeEmailEmbedding";
import type { Email, InboxResponse } from "../inbox/types";
import { Row } from "@/once-ui/components";

type SimilarEmailResult = {
  id: string;
  score: number;
  metadata?: {
    subject?: string;
    userId?: string;
  };
}

export default function AIPage() {
  const [emails, setEmails] = useState<Email[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [similarEmails, setSimilarEmails] = useState<SimilarEmailResult[]>([])
  const [loading, setLoading] = useState(false)
  const [storeLoading, setStoreLoading] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  // Fetch inbox data
  useEffect(() => {
    async function fetchEmails() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/inbox?page=${page}&pageSize=10&threadView=true`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch emails')
        }
        
        const data: InboxResponse = await response.json()
        
        setEmails(data.emails)
        setHasMore(data.hasMore)
        setTotalCount(data.totalCount)
      } catch (error) {
        console.error('Error fetching emails:', error)
        setError('Failed to load emails. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchEmails()
  }, [page])

  // Handle search for similar emails
  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    
    if (!searchQuery.trim()) return
    
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const results = await searchSimilarEmails(searchQuery)
      
      if (results && Array.isArray(results)) {
        setSimilarEmails(results as SimilarEmailResult[])
      } else {
        // Handle error case
        const errorMessage = (results as any).error || 'Error searching for similar emails'
        console.error('Error searching similar emails:', errorMessage)
        setError(`Search failed: ${errorMessage}`)
        setSimilarEmails([])
      }
    } catch (error) {
      console.error('Error searching similar emails:', error)
      setError('Failed to search emails. Please try again later.')
      setSimilarEmails([])
    } finally {
      setLoading(false)
    }
  }

  // Handle storing an email for AI search
  async function handleStoreEmail(email: Email) {
    // Set loading state for this specific email
    setStoreLoading(prev => ({ ...prev, [email.id]: true }))
    setError(null)
    setSuccessMessage(null)
    
    try {
      const result = await storeEmailEmbedding({
        id: email.id,
        subject: email.subject,
        body: email.body || email.snippet,
        userId: 'current-user', // This would normally come from auth
      })
      
      if (result.success) {
        setSuccessMessage(`Email "${email.subject}" stored successfully`)
      } else {
        setError(`Failed to store email: ${(result as any).error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error storing email:', error)
      setError('Failed to store email. Please try again.')
    } finally {
      // Clear loading state for this email
      setStoreLoading(prev => ({ ...prev, [email.id]: false }))
      
      // Auto-clear success message after 3 seconds
      if (successMessage) {
        setTimeout(() => {
          setSuccessMessage(null)
        }, 3000)
      }
    }
  }

  return (
    <div className="container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', color: 'black' }}>
      <h1 style={{ marginBottom: '20px', color: 'black' }}>AI Email Assistant</h1>
      
      {/* Search Form */}
      <form onSubmit={handleSearch} style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for similar emails..."
            style={{ 
              flex: 1, 
              padding: '10px', 
              border: '1px solid #ccc', 
              borderRadius: '4px',
              color: 'black'
            }}
          />
          <button 
            type="submit" 
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        {error && (
          <div style={{ 
            marginTop: '10px', 
            padding: '10px', 
            backgroundColor: '#ffebee', 
            color: '#c62828', 
            borderRadius: '4px',
            border: '1px solid #ef9a9a' 
          }}>
            {error}
          </div>
        )}
        
        {successMessage && (
          <div style={{ 
            marginTop: '10px', 
            padding: '10px', 
            backgroundColor: '#e8f5e9', 
            color: '#2e7d32', 
            borderRadius: '4px',
            border: '1px solid #a5d6a7' 
          }}>
            {successMessage}
          </div>
        )}
      </form>
      
      {/* Similar Email Results */}
      {similarEmails.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: 'black' }}>Similar Emails</h2>
          <div style={{ border: '1px solid #eaeaea', borderRadius: '5px' }}>
            {similarEmails.map((result) => (
              <div 
                key={result.id}
                style={{ 
                  padding: '15px', 
                  borderBottom: result !== similarEmails[similarEmails.length - 1] ? '1px solid #eaeaea' : 'none',
                  color: 'black'
                }}
              >
                <h3 style={{ margin: '0 0 10px 0', color: 'black' }}>{result.metadata?.subject || 'No Subject'}</h3>
                <p style={{ margin: '0', fontSize: '14px', color: 'black' }}>
                  Score: {result.score.toFixed(4)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Email List */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2 style={{ margin: 0, color: 'black' }}>Inbox ({totalCount})</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button"
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page <= 1 || loading}
              style={{
                padding: '5px 10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: 'white',
                color: 'black',
                cursor: page <= 1 || loading ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>
            <span style={{ padding: '5px 10px', color: 'black' }}>Page {page}</span>
            <button 
              type="button"
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore || loading}
              style={{
                padding: '5px 10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: 'white',
                color: 'black',
                cursor: !hasMore || loading ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
          </div>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'black' }}>Loading...</div>
        ) : emails.length > 0 ? (
          <div style={{ border: '1px solid #eaeaea', borderRadius: '5px' }}>
            {emails.map((email, index) => (
              <div 
                key={email.id}
                style={{ 
                  padding: '15px', 
                  borderBottom: index < emails.length - 1 ? '1px solid #eaeaea' : 'none',
                  backgroundColor: !email.isRead ? '#f0f8ff' : 'white',
                  color: 'black'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <h3 style={{ margin: '0 0 5px 0', color: 'black' }}>{email.subject || 'No Subject'}</h3>
                  <span style={{ fontSize: '12px', color: 'black' }}>
                    {new Date(email.createdAt).toLocaleString()}
                  </span>
                </div>
                <p style={{ margin: '5px 0', fontSize: '14px', color: 'black' }}>
                  <strong>From:</strong> {email.from}
                </p>
                {email.to && (
                  <p style={{ margin: '5px 0', fontSize: '14px', color: 'black' }}>
                    <strong>To:</strong> {email.to}
                  </p>
                )}
                <p style={{ margin: '10px 0 0 0', color: 'black' }}>{email.snippet}</p>
                
                <div style={{ marginTop: '15px' }}>
                  <button
                    type="button"
                    onClick={() => handleStoreEmail(email)}
                    disabled={storeLoading[email.id]}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#4caf50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: storeLoading[email.id] ? 'not-allowed' : 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    {storeLoading[email.id] ? 'Storing...' : 'Store for AI Search'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Row style={{ textAlign: 'center', padding: '30px', border: '1px solid #eaeaea', borderRadius: '5px', color: 'black' }}>
            No emails found
          </Row>
        )}
      </div>
    </div>
  )
}
