import React, { useState, useEffect } from 'react'
import axios from 'axios'

const API = ''

function PayoutDashboard({ token }) {
  const [claims, setClaims] = useState([])
  const [payoutAmount, setPayoutAmount] = useState({})
  const [message, setMessage] = useState('')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    fetchAssessedClaims()
  }, [])

  const fetchAssessedClaims = async () => {
    try {
      const res = await axios.get(`${API}/claim/assessed`, { headers })
      setClaims(res.data)
    } catch (err) {
      console.error('Could not load assessed claims')
    }
  }

  const handlePayout = async (claimID) => {
    try {
      const res = await axios.post(`${API}/claim/payout`, {
        claimID,
        payoutAmount: payoutAmount[claimID]
      }, { headers })
      setMessage(res.data.message)
      fetchAssessedClaims()
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error processing payout')
    }
  }

  return (
    <div style={{ padding: '30px', maxWidth: '700px', margin: '0 auto' }}>
      <h2>Payout Officer Dashboard</h2>

      {message && <p style={{ color: 'green', fontWeight: 'bold' }}>{message}</p>}

      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 15px 0' }}>Claims Ready for Payout</h3>
        {claims.length === 0 ? (
          <p style={{ color: '#888' }}>No assessed claims ready for payout.</p>
        ) : (
          claims.map(c => (
            <div key={c.claimID} style={itemStyle}>
              <div>
                <b>{c.claimID}</b>
                <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                  Customer: {c.customerID} | Policy: {c.policyId}
                </p>
                <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                  Reason: {c.reason} | Claimed: ₹{c.claimAmount}
                </p>
                <p style={{ margin: '4px 0', color: '#4CAF50', fontSize: '14px', fontWeight: 'bold' }}>
                  Status: {c.status}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center' }}>
                <input
                  placeholder="Payout amount"
                  value={payoutAmount[c.claimID] || ''}
                  onChange={e => setPayoutAmount({ ...payoutAmount, [c.claimID]: e.target.value })}
                  style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', width: '150px' }}
                />
                <button onClick={() => handlePayout(c.claimID)} style={btnStyle('#2196F3')}>
                  💰 Process Payout
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const cardStyle = { background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #eee' }
const itemStyle = { background: '#fff', padding: '15px', borderRadius: '6px', marginBottom: '10px', border: '1px solid #eee' }
const btnStyle = (color) => ({ background: color, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' })

export default PayoutDashboard