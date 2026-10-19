const mockContract = {
    submitTransaction: jest.fn().mockResolvedValue(Buffer.from('')),
    evaluateTransaction: jest.fn().mockResolvedValue(Buffer.from('{}'))
}

const getContract = jest.fn().mockResolvedValue({
    contract: mockContract,
    gateway: { close: jest.fn() },
    client: { close: jest.fn() }
})

module.exports = { getContract, __mockContract: mockContract }