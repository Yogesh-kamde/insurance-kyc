package main

import (
	"encoding/json"
	"testing"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-chaincode-go/shimtest"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/hyperledger/fabric-protos-go/peer"
	"github.com/stretchr/testify/require"
)

// dummyChaincode exists only to satisfy shimtest.NewMockStub's type
// requirement (shim.Chaincode). Our tests call SmartContract methods
// directly, never through Init/Invoke, so both are no-ops.
type dummyChaincode struct{}

func (dummyChaincode) Init(stub shim.ChaincodeStubInterface) peer.Response {
	return peer.Response{}
}

func (dummyChaincode) Invoke(stub shim.ChaincodeStubInterface) peer.Response {
	return peer.Response{}
}

// newTestContext creates a fresh in-memory stub + context pair for one test.
func newTestContext() (*shimtest.MockStub, *contractapi.TransactionContext) {
	stub := shimtest.NewMockStub("mockStub", new(dummyChaincode))
	ctx := new(contractapi.TransactionContext)
	ctx.SetStub(stub)
	return stub, ctx
}

// seedCustomer writes a Customer directly into the mock ledger, bypassing
// RegisterCustomer, so each test can start from a known KYCStatus.
func seedCustomer(t *testing.T, stub *shimtest.MockStub, customerID, kycStatus string) {
	c := Customer{
		CustomerID: customerID,
		FullName:   "Test User",
		KYCStatus:  kycStatus,
	}
	bytes, err := json.Marshal(c)
	require.NoError(t, err)

	stub.MockTransactionStart("seed-" + customerID)
	err = stub.PutState(customerID, bytes)
	stub.MockTransactionEnd("seed-" + customerID)
	require.NoError(t, err)
}
func seedPolicy(t *testing.T, stub *shimtest.MockStub, policyID, customerID, status string) {
	p := Policy{
		PolicyID:   policyID,
		CustomerID: customerID,
		PolicyType: "Health",
		Status:     status,
	}
	bytes, err := json.Marshal(p)
	require.NoError(t, err)

	stub.MockTransactionStart("seed-" + policyID)
	err = stub.PutState(policyID, bytes)
	stub.MockTransactionEnd("seed-" + policyID)
	require.NoError(t, err)
}
func seedClaim(t *testing.T, stub *shimtest.MockStub, claimID, policyID, customerID, status string) {
	c := Claim{
		ClaimID:    claimID,
		PolicyID:   policyID,
		CustomerID: customerID,
		Status:     status,
	}
	bytes, err := json.Marshal(c)
	require.NoError(t, err)

	stub.MockTransactionStart("seed-" + claimID)
	err = stub.PutState(claimID, bytes)
	stub.MockTransactionEnd("seed-" + claimID)
	require.NoError(t, err)
}
func TestRegisterCustomer_Success(t *testing.T) {
	stub, ctx := newTestContext()
	contract := new(SmartContract)

	stub.MockTransactionStart("tx1")
	err := contract.RegisterCustomer(ctx, "CUST1", "Jane Doe", "9999999999", "Some Address", "500000", "PAN123")
	stub.MockTransactionEnd("tx1")

	require.NoError(t, err)

	data, err := stub.GetState("CUST1")
	require.NoError(t, err)
	require.NotNil(t, data)

	var c Customer
	require.NoError(t, json.Unmarshal(data, &c))
	require.Equal(t, "PENDING", c.KYCStatus)
	require.Equal(t, "Jane Doe", c.FullName)
}

func TestRegisterCustomer_DuplicateRejected(t *testing.T) {
	stub, ctx := newTestContext()
	contract := new(SmartContract)
	seedCustomer(t, stub, "CUST1", "PENDING")

	stub.MockTransactionStart("tx1")
	err := contract.RegisterCustomer(ctx, "CUST1", "Jane Doe", "9999999999", "Some Address", "500000", "PAN123")
	stub.MockTransactionEnd("tx1")

	require.Error(t, err)
}

func TestIssuePolicy_RejectedWhenKYCPending(t *testing.T) {
	stub, ctx := newTestContext()
	contract := new(SmartContract)
	seedCustomer(t, stub, "CUST1", "PENDING")

	stub.MockTransactionStart("tx1")
	err := contract.IssuePolicy(ctx, "POL1", "Health", "CUST1", "100000")
	stub.MockTransactionEnd("tx1")

	require.Error(t, err)
	require.Contains(t, err.Error(), "Kyc not approved")

	data, _ := stub.GetState("POL1")
	require.Nil(t, data)
}

func TestIssuePolicy_SucceedsWhenKYCApproved(t *testing.T) {
	stub, ctx := newTestContext()
	contract := new(SmartContract)
	seedCustomer(t, stub, "CUST1", "APPROVED")

	stub.MockTransactionStart("tx1")
	err := contract.IssuePolicy(ctx, "POL1", "Health", "CUST1", "100000")
	stub.MockTransactionEnd("tx1")

	require.NoError(t, err)

	data, err := stub.GetState("POL1")
	require.NoError(t, err)
	require.NotNil(t, data)

	var p Policy
	require.NoError(t, json.Unmarshal(data, &p))
	require.Equal(t, "ACTIVE", p.Status)
	require.Equal(t, "CUST1", p.CustomerID)
}

func TestIssuePolicy_RejectedWhenCustomerMissing(t *testing.T) {
	stub, ctx := newTestContext()
	contract := new(SmartContract)

	stub.MockTransactionStart("tx1")
	err := contract.IssuePolicy(ctx, "POL1", "Health", "CUST_DOES_NOT_EXIST", "100000")
	stub.MockTransactionEnd("tx1")

	require.Error(t, err)
	require.Contains(t, err.Error(), "customer not found")
}

func TestIssuePolicy_RejectedWhenPolicyIDAlreadyExists(t *testing.T) {
	stub, ctx := newTestContext()
	contract := new(SmartContract)
	seedCustomer(t, stub, "CUST1", "APPROVED")

	stub.MockTransactionStart("tx1")
	err := contract.IssuePolicy(ctx, "POL1", "Health", "CUST1", "100000")
	stub.MockTransactionEnd("tx1")
	require.NoError(t, err)

	stub.MockTransactionStart("tx2")
	err = contract.IssuePolicy(ctx, "POL1", "Health", "CUST1", "100000")
	stub.MockTransactionEnd("tx2")

	require.Error(t, err)
	require.Contains(t, err.Error(), "already Exist")
}
func TestVerifyKYC_ApprovesSuccessfully(t *testing.T) {
	stub, ctx := newTestContext()
	contract := new(SmartContract)
	seedCustomer(t, stub, "CUST1", "PENDING")

	stub.MockTransactionStart("tx1")
	err := contract.VerifyKYC(ctx, "CUST1", "APPROVED")
	stub.MockTransactionEnd("tx1")

	require.NoError(t, err)

	data, err := stub.GetState("CUST1")
	require.NoError(t, err)

	var c Customer
	require.NoError(t, json.Unmarshal(data, &c))
	require.Equal(t, "APPROVED", c.KYCStatus)
}

func TestVerifyKYC_RejectsSuccessfully(t *testing.T) {
	stub, ctx := newTestContext()
	contract := new(SmartContract)
	seedCustomer(t, stub, "CUST1", "PENDING")

	stub.MockTransactionStart("tx1")
	err := contract.VerifyKYC(ctx, "CUST1", "REJECTED")
	stub.MockTransactionEnd("tx1")

	require.NoError(t, err)

	data, err := stub.GetState("CUST1")
	require.NoError(t, err)

	var c Customer
	require.NoError(t, json.Unmarshal(data, &c))
	require.Equal(t, "REJECTED", c.KYCStatus)
}

func TestVerifyKYC_RejectedWhenCustomerMissing(t *testing.T) {
	stub, ctx := newTestContext()
	contract := new(SmartContract)

	stub.MockTransactionStart("tx1")
	err := contract.VerifyKYC(ctx, "CUST_DOES_NOT_EXIST", "APPROVED")
	stub.MockTransactionEnd("tx1")

	require.Error(t, err)
	require.Contains(t, err.Error(), "customer not found")
}
func TestFileClaim_RejectedWhenPolicyMissing(t *testing.T) {
	stub, ctx := newTestContext()
	contract := new(SmartContract)

	stub.MockTransactionStart("tx1")
	err := contract.FileClaim(ctx, "CUST1", "POL_DOES_NOT_EXIST", "CLAIM1", "Accident", "50000")
	stub.MockTransactionEnd("tx1")

	require.Error(t, err)
	require.Contains(t, err.Error(), "policy not found")
}

func TestFileClaim_Success(t *testing.T) {
	stub, ctx := newTestContext()
	contract := new(SmartContract)
	seedPolicy(t, stub, "POL1", "CUST1", "ACTIVE")

	stub.MockTransactionStart("tx1")
	err := contract.FileClaim(ctx, "CUST1", "POL1", "CLAIM1", "Accident", "50000")
	stub.MockTransactionEnd("tx1")

	require.NoError(t, err)

	data, err := stub.GetState("CLAIM1")
	require.NoError(t, err)
	require.NotNil(t, data)

	var c Claim
	require.NoError(t, json.Unmarshal(data, &c))
	require.Equal(t, "PENDING", c.Status)
	require.Equal(t, "POL1", c.PolicyID)
}

func TestFileClaim_RejectedWhenClaimAlreadyExists(t *testing.T) {
	stub, ctx := newTestContext()
	contract := new(SmartContract)
	seedPolicy(t, stub, "POL1", "CUST1", "ACTIVE")

	stub.MockTransactionStart("tx1")
	err := contract.FileClaim(ctx, "CUST1", "POL1", "CLAIM1", "Accident", "50000")
	stub.MockTransactionEnd("tx1")
	require.NoError(t, err)

	stub.MockTransactionStart("tx2")
	err = contract.FileClaim(ctx, "CUST1", "POL1", "CLAIM1", "Accident", "50000")
	stub.MockTransactionEnd("tx2")

	require.Error(t, err)
	require.Contains(t, err.Error(), "claim already exists")
}
func TestAssessClaim_RejectedWhenClaimMissing(t *testing.T) {
	stub, ctx := newTestContext()
	contract := new(SmartContract)

	stub.MockTransactionStart("tx1")
	err := contract.AssessClaim(ctx, "CLAIM_DOES_NOT_EXIST", "APPROVED")
	stub.MockTransactionEnd("tx1")

	require.Error(t, err)
	require.Contains(t, err.Error(), "claim not found")
}

func TestAssessClaim_RejectedWhenAlreadyAssessed(t *testing.T) {
	stub, ctx := newTestContext()
	contract := new(SmartContract)
	seedClaim(t, stub, "CLAIM1", "POL1", "CUST1", "APPROVED")

	stub.MockTransactionStart("tx1")
	err := contract.AssessClaim(ctx, "CLAIM1", "REJECTED")
	stub.MockTransactionEnd("tx1")

	require.Error(t, err)
	require.Contains(t, err.Error(), "already assessed")
}

func TestAssessClaim_Success(t *testing.T) {
	stub, ctx := newTestContext()
	contract := new(SmartContract)
	seedClaim(t, stub, "CLAIM1", "POL1", "CUST1", "PENDING")

	stub.MockTransactionStart("tx1")
	err := contract.AssessClaim(ctx, "CLAIM1", "APPROVED")
	stub.MockTransactionEnd("tx1")

	require.NoError(t, err)

	data, err := stub.GetState("CLAIM1")
	require.NoError(t, err)

	var c Claim
	require.NoError(t, json.Unmarshal(data, &c))
	require.Equal(t, "APPROVED", c.Status)
	require.NotEmpty(t, c.AssessedAt)
}
func TestProcessPayout_RejectedWhenClaimMissing(t *testing.T) {
	stub, ctx := newTestContext()
	contract := new(SmartContract)

	stub.MockTransactionStart("tx1")
	err := contract.ProcessPayout(ctx, "CLAIM_DOES_NOT_EXIST", "50000")
	stub.MockTransactionEnd("tx1")

	require.Error(t, err)
	require.Contains(t, err.Error(), "claim not found")
}

func TestProcessPayout_Success(t *testing.T) {
	stub, ctx := newTestContext()
	contract := new(SmartContract)
	seedClaim(t, stub, "CLAIM1", "POL1", "CUST1", "ASSESSED")

	stub.MockTransactionStart("tx1")
	err := contract.ProcessPayout(ctx, "CLAIM1", "50000")
	stub.MockTransactionEnd("tx1")

	require.NoError(t, err)

	data, err := stub.GetState("CLAIM1")
	require.NoError(t, err)

	var c Claim
	require.NoError(t, json.Unmarshal(data, &c))
	require.Equal(t, "PAID", c.Status)
	require.Equal(t, "50000", c.PayoutAmount)
}
func TestFileClaim_RejectedWhenPolicyNotActive(t *testing.T) {
	stub, ctx := newTestContext()
	contract := new(SmartContract)
	seedPolicy(t, stub, "POL1", "CUST1", "CANCELLED")

	stub.MockTransactionStart("tx1")
	err := contract.FileClaim(ctx, "CUST1", "POL1", "CLAIM1", "Accident", "50000")
	stub.MockTransactionEnd("tx1")

	require.Error(t, err)
	require.Contains(t, err.Error(), "policy is not active")
}

func TestFileClaim_RejectedWhenCustomerMismatch(t *testing.T) {
	stub, ctx := newTestContext()
	contract := new(SmartContract)
	seedPolicy(t, stub, "POL1", "CUST2", "ACTIVE")

	stub.MockTransactionStart("tx1")
	err := contract.FileClaim(ctx, "CUST1", "POL1", "CLAIM1", "Accident", "50000")
	stub.MockTransactionEnd("tx1")

	require.Error(t, err)
	require.Contains(t, err.Error(), "does not belong to this customer")
}

func TestProcessPayout_RejectedWhenClaimNotApproved(t *testing.T) {
	stub, ctx := newTestContext()
	contract := new(SmartContract)
	seedClaim(t, stub, "CLAIM1", "POL1", "CUST1", "PENDING")

	stub.MockTransactionStart("tx1")
	err := contract.ProcessPayout(ctx, "CLAIM1", "50000")
	stub.MockTransactionEnd("tx1")

	require.Error(t, err)
	require.Contains(t, err.Error(), "claim is not approved")
}