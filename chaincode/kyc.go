package main 

import (
	"fmt"
	"encoding/json" 
	"time"                                                      
    "github.com/hyperledger/fabric-contract-api-go/contractapi" 
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

type Customer struct{
	CustomerID string `json:"customerID"`
	FullName string   `json:"fullName"`
	Contact  string `json:"contact"`
	Address string `json:"address"`
	Income string `json:"income"`
	IdentityProof string `json:"identityProof"`
	KYCStatus string `json:"kycStatus"` 
	RegisteredAt string `json:"registeredAt"`
}
type Claim struct{
    ClaimID string `json:"claimID"`
    PolicyID string `json:"policyId"`
    CustomerID string `json:"customerID"`
    Reason string `json:"reason"`
    ClaimAmount string `json:"claimAmount"`
    Status string `json:"status"`  
    PayoutAmount string `json:"payoutAmount"`
    FiledAt string `json:"filedAt"`
}
func (s *SmartContract) RegisterCustomer(ctx contractapi.TransactionContextInterface, customerID string, fullName string, contact string, address string, income string, identityProof string) error {
existingData, err := ctx.GetStub().GetState(customerID)
if err != nil {
    return fmt.Errorf("failed to read from ledger: %v", err)
}
if existingData != nil {
    return fmt.Errorf("user already exists")
}
//deterministic — same timestamp across all peers
txTimestamp, err := ctx.GetStub().GetTxTimestamp()
if err != nil {
    return fmt.Errorf("failed to get timestamp: %v", err)
}
customer := Customer{
    CustomerID:    customerID,
    FullName:      fullName,
    Contact:       contact,
	Address:       address,
	Income:        income,
	IdentityProof: identityProof,
    KYCStatus:    "PENDING",
    RegisteredAt: time.Unix(txTimestamp.Seconds, int64(txTimestamp.Nanos)).UTC().Format("2006-01-02 15:04:05"),
}

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
    return "", fmt.Errorf("policy not found")  // ✅
}
    return string(policyData),nil
}
func (s *SmartContract) FileClaim(ctx contractapi.TransactionContextInterface,customerID string,policyId string,claimID string,reason string,claimAmount string) error{
    policyData,err := ctx.GetStub().GetState(policyId)
    if err != nil{
        return fmt.Errorf("failed to read from ledger%v",err)
    }
    if policyData == nil {
    return fmt.Errorf("policy not found")
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
    claimData,err := ctx.GetStub().GetState(claimID)
    if err != nil{
        return fmt.Errorf("failed to read from ledger%v",err)
    }
   if claimData == nil {
    return fmt.Errorf("claim not found")       //
}
    
    var claim Claim
   err = json.Unmarshal(claimData, &claim) 
    if err != nil{
        return fmt.Errorf("failed to UnMarshal claim%v",err)
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