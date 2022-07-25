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
    expect(lastBlock.index).toEqual(2);
    expect(lastBlock.hash).toEqual("NEW_HASH");
    expect(lastBlock.nonce).toEqual(231);
    expect(lastBlock.previousBlockHash).toEqual("PREV_HASH");
})

test('Create New Transaction', () => {
    const newBlock = blockchain.createNewBlock(233, "PREV_HASH", "NEW_HASH");
    expect(newBlock).not.toBeNull();

    const lastBlock = blockchain.getLastBlock();

    expect(lastBlock).toEqual(newBlock);
    expect(lastBlock.nonce).toEqual(233);

    const transaction = blockchain.createNewTransaction(123, "0xALEX032313", "0xJOAN893728");
    expect(transaction).not.toBeNull();
})

test('Add Transaction to Pending Transaction', () => {

    const newBlock = blockchain.createNewBlock(2, "PREV_HASH", "NEW_HASH");
    expect(newBlock).not.toBeNull();
    const transaction = blockchain.createNewTransaction(123, "0xALEX032313", "0xJOAN893728");
    const blockToBeMined = blockchain.addToPendingTransactions(transaction);
    expect(blockToBeMined).toEqual(3);
    expect(transaction).toEqual(blockchain.pendingTransactions[0]);
})


test('Run Proof of Work and Generate Reward', () => {
    // Create transaction
    const transaction = blockchain.createNewTransaction(123, "0xALEX032313", "0xJOAN893728");
    // Add transaction
    blockchain.addToPendingTransactions(transaction);

    // Adjust current Block data and transactions to be mined
    const lastBlock = blockchain.getLastBlock();
    const previousBlockHash = lastBlock['hash'];
    const currentBlockData = {
        transactions: blockchain.pendingTransactions,
        index: lastBlock['index'] + 1,
    }

    // Run algorithm
    const { nonce, hash } = blockchain.proofOfWork(previousBlockHash, currentBlockData);

    // After run and before submit our reward transaction
    // We need add a new block to chain
    const blockAdded = blockchain.createNewBlock(nonce, previousBlockHash, hash);

    // Check if the new block data is correct
    expect(currentBlockData.transactions).toEqual(blockAdded.transactions);
    expect(currentBlockData.index).toEqual(blockAdded.index)

    // Add you reward to be mined in the next block
    // For definition 0x0 as a sender means that the transaction is a reward
    // so you can supose that transaction was sent by the own network
    const rewardTransaction = blockchain.createNewTransaction(12.5, "0x0", "NODEWALLET");

    blockchain.addToPendingTransactions(rewardTransaction);

    expect(rewardTransaction).toEqual(blockchain.pendingTransactions[0]);
    // console.log('Blockchain Pending Transactions: ', blockchain.pendingTransactions[0]);

    console.log("Blockchain: ", blockchain);
})

test('Valid Consensus', () => {
    expect(blockchain.isChainValid(blockchainData.chain)).toBe(true);
})