import React, { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'http://localhost:3000'

function CustomerPortal({ token, customerID }) {
  const [customer, setCustomer] = useState(null)
  const [policies, setPolicies] = useState([])
  const [claims, setClaims] = useState([])
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    if (customerID) {
      fetchCustomer()
      fetchPolicies()
      fetchClaims()
    }
  }, [customerID])

  const fetchCustomer = async () => {
    try {
      const res = await axios.get(`${API}/customer/${customerID}`, { headers })
      setCustomer(res.data)
    } catch (err) {
      console.error('Could not load customer data')
    }
  }

  const fetchPolicies = async () => {
    try {
      const res = await axios.get(`${API}/policy/customer/${customerID}`, { headers })
      setPolicies(res.data)
    } catch (err) {
      console.error('Could not load policies')
    }
  }

  const fetchClaims = async () => {
    try {
      const res = await axios.get(`${API}/claim/customer/${customerID}`, { headers })
      setClaims(res.data)
    } catch (err) {
      console.error('Could not load claims')
    }
  }

  const kycColor = (status) => {
    if (status === 'APPROVED') return '#4CAF50'
    if (status === 'REJECTED') return '#f44336'
    return '#FF9800'
  }

  const statusColor = (status) => {
    if (status === 'ACTIVE' || status === 'PAID' || status === 'ASSESSED') return '#4CAF50'
    if (status === 'REJECTED') return '#f44336'
    return '#FF9800'
  }

  if (!customer) return null

  return (
    <div style={{ padding: '30px', maxWidth: '700px', margin: '0 auto' }}>
      <h2>Welcome, {customer?.fullName} 👋</h2>

      {/* KYC Status Card */}
      <div style={{ ...cardStyle, borderLeft: `5px solid ${kycColor(customer?.kycStatus)}` }}>
        <h3 style={{ margin: '0 0 10px 0' }}>KYC Status</h3>
        <p style={{ fontSize: '24px', fontWeight: 'bold', color: kycColor(customer?.kycStatus), margin: 0 }}>
          {customer?.kycStatus}
        </p>
        {customer?.kycStatus === 'PENDING' && (
          <p style={{ color: '#888', marginTop: '8px', fontSize: '14px' }}>
            Your KYC is under review. You will be notified once approved.
          </p>
        )}
        {customer?.kycStatus === 'APPROVED' && (
          <p style={{ color: '#888', marginTop: '8px', fontSize: '14px' }}>
            Your KYC is verified. You can now get insurance policies.
          </p>
        )}
      </div>

      {/* Customer Details Card */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 15px 0' }}>My Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div><b>Customer ID</b><p style={detailStyle}>{customer?.customerID}</p></div>
          <div><b>Full Name</b><p style={detailStyle}>{customer?.fullName}</p></div>
          <div><b>Contact</b><p style={detailStyle}>{customer?.contact}</p></div>
          <div><b>Address</b><p style={detailStyle}>{customer?.address}</p></div>
          <div><b>Income</b><p style={detailStyle}>₹{customer?.income}</p></div>
          <div><b>Identity Proof</b><p style={detailStyle}>{customer?.identityProof}</p></div>
          <div><b>Registered At</b><p style={detailStyle}>{customer?.registeredAt}</p></div>
        </div>
      </div>

      {/* KYC warning */}
      {customer?.kycStatus !== 'APPROVED' && (
        <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
          Your KYC must be approved before you can get a policy.
        </div>
      )}

      {/* My Policies */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 15px 0' }}>My Policies</h3>
        {policies.length === 0 ? (
          <p style={{ color: '#888' }}>No policies yet.</p>
        ) : (
          policies.map(p => (
            <div key={p.policyId} style={itemStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <b>{p.policyId}</b> — {p.policyType}
                  <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>Coverage: ₹{p.coverageAmount}</p>
                </div>
                <span style={{ color: statusColor(p.status), fontWeight: 'bold' }}>{p.status}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* My Claims */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 15px 0' }}>My Claims</h3>
        {claims.length === 0 ? (
          <p style={{ color: '#888' }}>No claims yet.</p>
        ) : (
          claims.map(c => (
            <div key={c.claimID} style={itemStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <b>{c.claimID}</b>
                  <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>
                    Reason: {c.reason} | Amount: ₹{c.claimAmount}
                  </p>
                  {c.payoutAmount && <p style={{ margin: '4px 0 0 0', color: '#4CAF50', fontSize: '14px' }}>Payout: ₹{c.payoutAmount}</p>}
                </div>
                <span style={{ color: statusColor(c.status), fontWeight: 'bold' }}>{c.status}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const cardStyle = {
  background: '#f9f9f9', padding: '20px', borderRadius: '8px',
  marginBottom: '20px', border: '1px solid #eee', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
}
const detailStyle = { margin: '4px 0 0 0', color: '#444', fontSize: '15px' }
const itemStyle = {
  background: '#fff', padding: '12px', borderRadius: '6px',
  marginBottom: '10px', border: '1px solid #eee'
}

export default CustomerPortal