const mockProposal = {
    endorse: jest.fn().mockResolvedValue({
        submit: jest.fn().mockResolvedValue(Buffer.from(''))
    })
}

const mockContract = {
    submitTransaction: jest.fn().mockResolvedValue(Buffer.from('')),
    evaluateTransaction: jest.fn().mockResolvedValue(Buffer.from('{}')),
    newProposal: jest.fn().mockReturnValue(mockProposal)
}

const getContract = jest.fn().mockResolvedValue({
    contract: mockContract,
    gateway: { close: jest.fn() },
    client: { close: jest.fn() }
})

module.exports = { getContract, __mockContract: mockContract, __mockProposal: mockProposal }