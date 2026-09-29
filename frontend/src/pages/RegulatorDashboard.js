import React, { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'http://localhost:3000'

function RegulatorDashboard({ token }) {
  const [pendingCustomers, setPendingCustomers] = useState([])
  const [message, setMessage] = useState('')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    fetchPendingCustomers()
  }, [])

  const fetchPendingCustomers = async () => {
    try {
      const res = await axios.get(`${API}/customers/pending`, { headers })
      setPendingCustomers(res.data)
    } catch (err) {
      console.error('Could not load pending customers')
    }
  }

  const handleDecision = async (customerID, decision) => {
    try {
      const res = await axios.post(`${API}/kyc/verify`, { customerID, decision }, { headers })
      setMessage(res.data.message)
      fetchPendingCustomers()
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error updating KYC')
    }
  }

  return (
    <div style={{ padding: '30px', maxWidth: '700px', margin: '0 auto' }}>
      <h2>Regulator — KYC Verification</h2>

      {message && <p style={{ color: 'green', fontWeight: 'bold' }}>{message}</p>}

      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 15px 0' }}>Pending KYC Reviews ({pendingCustomers.length})</h3>
        {pendingCustomers.length === 0 ? (
          <p style={{ color: '#888' }}>No pending KYC reviews. ✅</p>
        ) : (
          pendingCustomers.map(c => (
            <div key={c.customerID} style={itemStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <b>{c.fullName}</b>
                  <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                    ID: {c.customerID}
                  </p>
                  <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                    Contact: {c.contact} | Address: {c.address}
                  </p>
                  <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                    Income: ₹{c.income} | ID Proof: {c.identityProof}
                  </p>
                  <p style={{ margin: '4px 0', color: '#FF9800', fontSize: '14px', fontWeight: 'bold' }}>
                    Status: {c.kycStatus}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button onClick={() => handleDecision(c.customerID, 'APPROVED')} style={btnStyle('#4CAF50')}>✅ Approve</button>
                  <button onClick={() => handleDecision(c.customerID, 'REJECTED')} style={btnStyle('#f44336')}>❌ Reject</button>
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
const itemStyle = { background: '#fff', padding: '15px', borderRadius: '6px', marginBottom: '10px', border: '1px solid #eee' }
const btnStyle = (color) => ({ background: color, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' })

export default RegulatorDashboard