const crypto  = require("crypto");

class Blockchain {
    constructor() {
        this.chain = [];
        this.pendingTransactions = [];
        this.createNewBlock(0, "0x0", "0x0");
    }
    createNewBlock(nonce, previousBlockHash, hash) {
        const newBlock = {
            index: this.chain.length + 1,
            timestamp: Date.now(),
            transactions: this.pendingTransactions,
            nonce,
            hash,
            previousBlockHash,
        };

        this.pendingTransactions = [];
        this.chain.push(newBlock);
        return newBlock;
    }
    getLastBlock() {
        return this.chain.length > 0 ? this.chain[this.chain.length - 1] : null;
    }
    createNewTransaction(amount, sender, recipient) {
        const newTransaction = {
            amount,
            sender,
            recipient,
        }
        this.pendingTransactions.push(newTransaction);
        return  this.getLastBlock() ? this.getLastBlock()['index'] + 1 : null;
    }
    hashBlock(previousBlockhash, currentBlockData, nonce) {
        const dataAsString = previousBlockhash + nonce + JSON.stringify(currentBlockData);
        return crypto.createHash("sha256").update(dataAsString).digest('hex');
    }
    proofOfWork(previousBlockHash, currentBlockData) {
        let nonce = 0;
        let hash = "";
        do {
            hash = this.hashBlock(previousBlockHash, currentBlockData, ++nonce);
        } while (hash.substring(0, 4) !== "0000");
        return { nonce, hash };
    }
}


module.exports = Blockchain;