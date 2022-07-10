// Unit Testing

const Blockchain = require("../src/blockchain");
const blockchainData = require("./mocks/blockchain_data");

// Challenges: 
// functional and integration

let blockchain = null;
beforeEach(() => {
    blockchain = new Blockchain();
});


test('Create New Block', () => {
    const newBlock = blockchain.createNewBlock(231, "PREV_HASH", "NEW_HASH");
    expect(newBlock).not.toBeNull();
    const lastBlock = blockchain.getLastBlock();
    expect(lastBlock).toEqual(newBlock);
})

test('Create New Transaction', () => {
    const newBlock = blockchain.createNewBlock(233, "PREV_HASH", "NEW_HASH");
    expect(newBlock).not.toBeNull();
    const transaction = blockchain.createNewTransaction(123, "0xALEX032313", "0xJOAN893728");
    expect(transaction).not.toBeNull();
})

test('Valid Consensus', () => {
    expect(blockchain.chainIsValid(blockchainData.chain)).toBe(true);
})