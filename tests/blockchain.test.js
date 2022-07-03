const Blockchain = require("../src/blockchain");


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
    const blockNumber = blockchain.createNewTransaction(123, "0xALEX032313", "0xJOAN893728");
    expect(blockNumber).toBe(2);

    console.log('blockchain.getLastBlock() :>> ', blockchain.proofOfWork("NEW_HASH", blockchain.getLastBlock()));
})