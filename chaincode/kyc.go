package main 

import (
	"fmt"
	"encoding/json" 
	"time"
    "strconv"                                                      
    "github.com/hyperledger/fabric-contract-api-go/contractapi"
    "crypto/sha256"
    "encoding/hex" 
)
type SmartContract struct {
    contractapi.Contract
}
type Policy struct{
    PolicyID string `json:"policyId"`
    CustomerID string `json:"customerID"`
    PolicyType string `json:"policyType"`
    CoverageAmount string `json:"coverageAmount"`
    Status string `json:"status"`
    IssueAt string `json:"issueAt"`
}
// Public — written to the shared ledger, visible to all orgs
type Customer struct {
    CustomerID   string `json:"customerID"`
    KYCStatus    string `json:"kycStatus"`
    RegisteredAt string `json:"registeredAt"`
    PIIHash      string `json:"piiHash"` // SHA-256 of the private record, proves integrity
}

// Private — written only to the customerPII collection, replicated only to Org1/Org2
type CustomerPrivateDetails struct {
    CustomerID    string `json:"customerID"`
    FullName      string `json:"fullName"`
    Contact       string `json:"contact"`
    Address       string `json:"address"`
    Income        string `json:"income"`
    IdentityProof string `json:"identityProof"`
}
type Claim struct{
    ClaimID      string `json:"claimID"`
    PolicyID     string `json:"policyId"`
    CustomerID   string `json:"customerID"`
    Reason       string `json:"reason"`
    ClaimAmount  string `json:"claimAmount"`
    Status       string `json:"status"`
    PayoutAmount string `json:"payoutAmount"`
    FiledAt      string `json:"filedAt"`
    AssessedAt   string `json:"assessedAt"`
}
func (s *SmartContract) RegisterCustomer(ctx contractapi.TransactionContextInterface, customerID string) error {
    transientMap, err := ctx.GetStub().GetTransient()
    if err != nil {
        return fmt.Errorf("failed to get transient data: %v", err)
    }

    piiBytes, ok := transientMap["customer_pii"]
    if !ok {
        return fmt.Errorf("customer_pii not found in transient data")
    }

    var pii CustomerPrivateDetails
    if err := json.Unmarshal(piiBytes, &pii); err != nil {
        return fmt.Errorf("failed to unmarshal private data: %v", err)
    }
    pii.CustomerID = customerID

    existingData, err := ctx.GetStub().GetState(customerID)
    if err != nil {
        return fmt.Errorf("failed to read from ledger: %v", err)
    }
    if existingData != nil {
        return fmt.Errorf("customer already exists")
    }

    // Write the real PII only into the private collection
    piiJSON, err := json.Marshal(pii)
    if err != nil {
        return fmt.Errorf("failed to marshal private data: %v", err)
    }
    if err := ctx.GetStub().PutPrivateData("customerPII", customerID, piiJSON); err != nil {
        return fmt.Errorf("failed to write private data: %v", err)
    }

    // Hash of the private record goes on the public ledger — proves integrity without exposing content
    hash := sha256.Sum256(piiJSON)

    txTimestamp, err := ctx.GetStub().GetTxTimestamp()
    if err != nil {
        return fmt.Errorf("failed to get timestamp: %v", err)
    }

    customer := Customer{
        CustomerID:   customerID,
        KYCStatus:    "PENDING",
        RegisteredAt: time.Unix(txTimestamp.Seconds, 0).String(),
        PIIHash:      hex.EncodeToString(hash[:]),
    }

    customerJSON, err := json.Marshal(customer)
    if err != nil {
        return fmt.Errorf("failed to marshal customer: %v", err)
    }
    return ctx.GetStub().PutState(customerID, customerJSON)
}
func (s *SmartContract) VerifyKYC(ctx contractapi.TransactionContextInterface, customerID string, decision string) error{
existingData, err := ctx.GetStub().GetState(customerID)
if err != nil {
    return fmt.Errorf("failed to read from ledger: %v", err)
}
if existingData == nil {
    return fmt.Errorf("customer not found") 
}
var customer Customer
err = json.Unmarshal(existingData, &customer)
if err != nil{
	return fmt.Errorf("failed to Unmarshal customer:%v",err)
}
customer.KYCStatus = decision 
bytes,err := json.Marshal(customer)
    if err != nil {
    return fmt.Errorf("failed to marshal customer: %v", err)
}
 err = ctx.GetStub().PutState(customerID, bytes)
   if err != nil {           
    return fmt.Errorf("failed to save customer: %v", err)  
}
   return nil 
}
func (s *SmartContract) GetCustomer(ctx contractapi.TransactionContextInterface,customerID string)(string, error){
    existingData,err := ctx.GetStub().GetState(customerID)
    if err != nil {
       return "", fmt.Errorf("failed to read from ledger:%v", err)
    }
    if existingData == nil{
        return "",fmt.Errorf("customer not found")
    }
    return string(existingData),nil
}
func (s *SmartContract) IssuePolicy(ctx contractapi.TransactionContextInterface, policyId string ,policyType string, customerID string,coverageAmount string) error{
    coverage, err := strconv.ParseFloat(coverageAmount, 64)
    if err != nil {
        return fmt.Errorf("invalid coverage amount: %v", err)
    }
    if coverage <= 0 {
        return fmt.Errorf("coverage amount must be greater than zero")
    }
    existingData,err := ctx.GetStub().GetState(customerID)
    if err != nil{
        return fmt.Errorf("failed to read from ledger:%v",err)
    }
    if existingData == nil{
       return fmt.Errorf("customer not found")  
    }
    var customer Customer
    err = json.Unmarshal(existingData,&customer)
    if err!= nil{
        return fmt.Errorf("failed to unmarshal customer%v",err)
    }
    if customer.KYCStatus != "APPROVED"{  //access via the struct{
    return fmt.Errorf("Kyc not approved")
    }
    policyData,err := ctx.GetStub().GetState(policyId)
    if err != nil{
        return fmt.Errorf("failed to read from ledger %v",err)
    }
    if policyData != nil{
        return fmt.Errorf("Policy already Exist")
    }
    txTimestamp, err := ctx.GetStub().GetTxTimestamp()
if err != nil {
    return fmt.Errorf("failed to get timestamp: %v", err)
}
policy := Policy{
    PolicyID:       policyId,
    CustomerID:     customerID,
    PolicyType:     policyType,
    CoverageAmount: coverageAmount,
    Status:         "ACTIVE",      //string in quotes
    IssueAt:        time.Unix(txTimestamp.Seconds, int64(txTimestamp.Nanos)).UTC().Format("2006-01-02 15:04:05"),
}
bytes,err := json.Marshal(policy)
if err != nil {
    return fmt.Errorf("failed to marshal customer:%v",err)
}
err = ctx.GetStub().PutState(policyId,bytes)
if err != nil{
    return fmt.Errorf("failed to save Policy:%v",err)
}
return nil
}
func (s *SmartContract) GetPolicy(ctx contractapi.TransactionContextInterface, customerID string,policyId string)(string,error){
    policyData,err := ctx.GetStub().GetState(policyId)
    if err != nil{
        return "",fmt.Errorf("failed to read from ledger%v",err)
    }
    if policyData == nil {
    return "", fmt.Errorf("policy not found")  // 
}
    return string(policyData),nil
}
func (s *SmartContract) FileClaim(ctx contractapi.TransactionContextInterface,customerID string,policyId string,claimID string,reason string,claimAmount string) error{
    claimAmt, err := strconv.ParseFloat(claimAmount, 64)
    if err != nil {
        return fmt.Errorf("invalid claim amount: %v", err)
    }
    if claimAmt <= 0 {
        return fmt.Errorf("claim amount must be greater than zero")
    }

    policyData,err := ctx.GetStub().GetState(policyId)
    if err != nil{
        return fmt.Errorf("failed to read from ledger%v",err)
    }
    if policyData == nil {
    return fmt.Errorf("policy not found")
}

    var policy Policy
    err = json.Unmarshal(policyData, &policy)
    if err != nil {
        return fmt.Errorf("failed to unmarshal policy:%v", err)
    }
    if policy.Status != "ACTIVE" {
        return fmt.Errorf("policy is not active")
    }
    if policy.CustomerID != customerID {
        return fmt.Errorf("policy does not belong to this customer")
    }

    coverage, err := strconv.ParseFloat(policy.CoverageAmount, 64)
    if err != nil {
        return fmt.Errorf("invalid coverage amount on policy: %v", err)
    }
    if claimAmt > coverage {
        return fmt.Errorf("claim amount exceeds policy coverage")
    }

    //check claim
    claimData,err := ctx.GetStub().GetState(claimID)
    if err != nil{
        return fmt.Errorf("failed to read from ledger%v",err)
    }
    if claimData != nil{
       return fmt.Errorf("claim already exists") 
    }
    txTimestamp, err := ctx.GetStub().GetTxTimestamp()
if err != nil {
    return fmt.Errorf("failed to get timestamp: %v", err)
}
    claim := Claim{
        ClaimID : claimID,
        PolicyID : policyId,
        CustomerID:customerID,
        Reason : reason,
        ClaimAmount:claimAmount,
        Status : "PENDING",
        PayoutAmount:  "", 
        FiledAt: time.Unix(txTimestamp.Seconds, int64(txTimestamp.Nanos)).UTC().Format("2006-01-02 15:04:05"),
    }
    bytes,err := json.Marshal(claim)
    if err != nil{
        return fmt.Errorf("failed to marshal customer:%v",err)
    }
    err = ctx.GetStub().PutState(claimID,bytes)
     if err != nil{
        return fmt.Errorf("failed to save policy:%v",err)
     }
     return nil
}
func (s *SmartContract) ProcessPayout(ctx contractapi.TransactionContextInterface,claimID string,payoutAmount string)error{
    payout, err := strconv.ParseFloat(payoutAmount, 64)
    if err != nil {
        return fmt.Errorf("invalid payout amount: %v", err)
    }
    if payout <= 0 {
        return fmt.Errorf("payout amount must be greater than zero")
    }

    claimData,err := ctx.GetStub().GetState(claimID)
    if err != nil{
        return fmt.Errorf("failed to read from ledger%v",err)
    }
   if claimData == nil {
    return fmt.Errorf("claim not found")
}

    var claim Claim
   err = json.Unmarshal(claimData, &claim) 
    if err != nil{
        return fmt.Errorf("failed to UnMarshal claim%v",err)
    }
    if claim.Status != "ASSESSED" {
        return fmt.Errorf("claim is not approved for payout")
    }

    claimAmt, err := strconv.ParseFloat(claim.ClaimAmount, 64)
    if err != nil {
        return fmt.Errorf("invalid claim amount on claim: %v", err)
    }
    if payout > claimAmt {
        return fmt.Errorf("payout amount exceeds claim amount")
    }

    claim.Status = "PAID" 
    claim.PayoutAmount = payoutAmount
    
    bytes,err := json.Marshal(claim)
    if err != nil{
        return fmt.Errorf("failed to Marshal claim:%v",err)
    }
    err = ctx.GetStub().PutState(claimID,bytes)
    if err != nil{
        return fmt.Errorf("failed to save claim:%v",err)
    }
    return nil
}
func  (s *SmartContract) AssessClaim(ctx contractapi.TransactionContextInterface,claimID string,decision string) error{
    claimData,err := ctx.GetStub().GetState(claimID)
    if err != nil{
        return fmt.Errorf("failed to read from ledger%v",err)
    }
   if claimData == nil {
    return fmt.Errorf("claim not found")       //
}
  var claim Claim
  err = json.Unmarshal(claimData,&claim)
  if err!= nil{
    return fmt.Errorf("failed to Unmarshal claim:%v",err)
  }
  if claim.Status != "PENDING"{
    return fmt.Errorf("claim already assessed")
  }
  claim.Status = decision

  txTimestamp, err := ctx.GetStub().GetTxTimestamp()
if err != nil {
    return fmt.Errorf("failed to get timestamp: %v", err)
}
  claim.AssessedAt = time.Unix(txTimestamp.Seconds, int64(txTimestamp.Nanos)).UTC().Format("2006-01-02 15:04:05")
  
   bytes,err := json.Marshal(claim)
    if err != nil{
        return fmt.Errorf("failed to marshal customer:%v",err)
    }
    err = ctx.GetStub().PutState(claimID,bytes)
     if err != nil{
        return fmt.Errorf("failed to save policy:%v",err)
     }
     return nil
}
func (s *SmartContract) GetCustomerPrivateDetails(ctx contractapi.TransactionContextInterface, customerID string) (string, error) {
    piiBytes, err := ctx.GetStub().GetPrivateData("customerPII", customerID)
    if err != nil {
        return "", fmt.Errorf("failed to read private data: %v", err)
    }
    if piiBytes == nil {
        return "", fmt.Errorf("no private data found for %s", customerID)
    }
    return string(piiBytes), nil
}
func main() {
    chaincode, err := contractapi.NewChaincode(&SmartContract{})
    if err != nil {
        fmt.Printf("Error creating chaincode: %v", err)
        return
    }
    if err := chaincode.Start(); err != nil {
        fmt.Printf("Error starting chaincode: %v", err)
    }
}