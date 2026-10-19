import React, { useState, useEffect } from 'react'
import axios from 'axios'

const API = ''

function AssessorDashboard({ token }) {
  const [claims, setClaims] = useState([])
  const [message, setMessage] = useState('')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    fetchPendingClaims()
  }, [])

  const fetchPendingClaims = async () => {
    try {
      const res = await axios.get(`${API}/claim/pending`, { headers })
      setClaims(res.data)
    } catch (err) {
      console.error('Could not load claims')
    }
  }

  const handleDecision = async (claimID, decision) => {
    try {
      const res = await axios.post(`${API}/claim/assess`, { claimID, decision }, { headers })
      setMessage(res.data.message)
      fetchPendingClaims()
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error assessing claim')
    }
  }

  return (
    <div style={{ padding: '30px', maxWidth: '700px', margin: '0 auto' }}>
      <h2>Claims Assessor Dashboard</h2>

      {message && <p style={{ color: 'green', fontWeight: 'bold' }}>{message}</p>}

      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 15px 0' }}>Pending Claims</h3>
        {claims.length === 0 ? (
          <p style={{ color: '#888' }}>No pending claims to review.</p>
        ) : (
          claims.map(c => (
            <div key={c.claimID} style={itemStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <b>{c.claimID}</b>
                  <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>
                    Customer: {c.customerID} | Policy: {c.policyId}
                  </p>
                  <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>
                    Reason: {c.reason} | Amount: ₹{c.claimAmount}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleDecision(c.claimID, 'ASSESSED')} style={btnStyle('#4CAF50')}> Approve</button>
                  <button onClick={() => handleDecision(c.claimID, 'REJECTED')} style={btnStyle('#f44336')}> Reject</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const cardStyle = { background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #eee' }
const itemStyle = { background: '#fff', padding: '12px', borderRadius: '6px', marginBottom: '10px', border: '1px solid #eee' }
const btnStyle = (color) => ({ background: color, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' })

export default AssessorDashboard