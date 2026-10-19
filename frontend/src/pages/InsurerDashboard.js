import React, { useState } from 'react'
import axios from 'axios'

const API = ''

function InsurerDashboard({ token }) {
  const [policyForm, setPolicyForm] = useState({ policyType: '', customerID: '', coverageAmount: '' })
  const [claimForm, setClaimForm] = useState({ customerID: '', policyId: '', reason: '', claimAmount: '' })
  const [message, setMessage] = useState('')
  const [generatedPolicyId, setGeneratedPolicyId] = useState(null)
  const [generatedClaimId, setGeneratedClaimId] = useState(null)
  const [searchPolicyID, setSearchPolicyID] = useState('')
  const [policy, setPolicy] = useState(null)
  const headers = { Authorization: `Bearer ${token}` }

  const handleIssuePolicy = async () => {
    try {
      const res = await axios.post(`${API}/policy/issue`, policyForm, { headers })
      setGeneratedPolicyId(res.data.policyId)
      setMessage('')
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error issuing policy')
    }
  }

  const handleFileClaim = async () => {
    try {
      const res = await axios.post(`${API}/claim/file`, claimForm, { headers })
      setGeneratedClaimId(res.data.claimID)
      setMessage('')
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error filing claim')
    }
  }

  const handleSearchPolicy = async () => {
    try {
      const res = await axios.get(`${API}/policy/${searchPolicyID}`, { headers })
      setPolicy(res.data)
      setMessage('')
    } catch (err) {
      setMessage(err.response?.data?.error || 'Policy not found')
      setPolicy(null)
    }
  }

  return (
    <div style={{ padding: '30px', maxWidth: '700px', margin: '0 auto' }}>
      <h2>Insurer Dashboard</h2>

      {message && <p style={{ color: 'red', fontWeight: 'bold' }}>{message}</p>}

      {/* Issue Policy */}
      <div style={sectionStyle}>
        <h3>Issue Policy</h3>
        {['policyType', 'customerID', 'coverageAmount'].map(field => (
          <input key={field} placeholder={field} value={policyForm[field]}
            onChange={e => setPolicyForm({ ...policyForm, [field]: e.target.value })}
            style={inputStyle} />
        ))}
        <button onClick={handleIssuePolicy} style={btnStyle('#FF9800')}>Issue Policy</button>

        {/* Show generated policyId */}
        {generatedPolicyId && (
          <div style={successBox}>
            <p>✅ Policy Issued Successfully!</p>
            <p><b>Policy ID: </b><span style={{ color: '#FF9800', fontSize: '18px' }}>{generatedPolicyId}</span></p>
            <p style={{ fontSize: '13px', color: '#666' }}>Save this Policy ID to file a claim</p>
          </div>
        )}
      </div>

      {/* Search Policy */}
      <div style={sectionStyle}>
        <h3>Search Policy</h3>
        <input placeholder="Policy ID" value={searchPolicyID}
          onChange={e => setSearchPolicyID(e.target.value)} style={inputStyle} />
        <button onClick={handleSearchPolicy} style={btnStyle('#FF9800')}>Search</button>
        {policy && (
          <div style={{ background: '#fff8f0', padding: '15px', borderRadius: '8px', marginTop: '15px' }}>
            <p><b>Policy ID:</b> {policy.policyId}</p>
            <p><b>Customer ID:</b> {policy.customerID}</p>
            <p><b>Type:</b> {policy.policyType}</p>
            <p><b>Coverage:</b> ₹{policy.coverageAmount}</p>
            <p><b>Status:</b> {policy.status}</p>
            <p><b>Issued At:</b> {policy.issueAt}</p>
          </div>
        )}
      </div>

      {/* File Claim */}
      <div style={sectionStyle}>
        <h3>File Claim</h3>
        {['customerID', 'policyId', 'reason', 'claimAmount'].map(field => (
          <input key={field} placeholder={field} value={claimForm[field]}
            onChange={e => setClaimForm({ ...claimForm, [field]: e.target.value })}
            style={inputStyle} />
        ))}
        <button onClick={handleFileClaim} style={btnStyle('#FF9800')}>File Claim</button>

        {/* Show generated claimId */}
        {generatedClaimId && (
          <div style={successBox}>
            <p>✅ Claim Filed Successfully!</p>
            <p><b>Claim ID: </b><span style={{ color: '#FF9800', fontSize: '18px' }}>{generatedClaimId}</span></p>
            <p style={{ fontSize: '13px', color: '#666' }}>Claim is now pending assessor review</p>
          </div>
        )}
      </div>
    </div>
  )
}

const inputStyle = { display: 'block', width: '100%', padding: '10px', margin: '8px 0', borderRadius: '6px', border: '1px solid #ccc', fontSize: '16px', boxSizing: 'border-box' }
const btnStyle = (color) => ({ background: color, color: '#fff', border: 'none', padding: '10px 30px', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', marginTop: '10px' })
const sectionStyle = { background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #eee' }
const successBox = { background: '#fff8f0', border: '1px solid #FF9800', borderRadius: '8px', padding: '15px', marginTop: '15px' }

export default InsurerDashboard