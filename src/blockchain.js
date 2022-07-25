const crypto = require("crypto");
const { v4: uuidv4 } = require('uuid');

class Blockchain {
    constructor(port) {
        this.chain = [];
        this.currentNodeUrl = `${process.env.BASE_URL}:${port}`;
        this.networkNodes = [];
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
    isChainValid(chain) {
        
        for (let i = 1; i < chain.length; i++) {
            const currentBlock = chain[i];
            const previousBlock = chain[i - 1];
            const { transactions, index, nonce } = currentBlock;
            const blockHash = this.hashBlock(previousBlock.hash, { transactions, index }, nonce);

            if (blockHash.substring(0, 4) !== "0000") return false
            if (blockHash !== currentBlock.hash
                || previousBlock.hash !== currentBlock.previousBlockHash) return false;
        }

        if (!this.isGenesisBlock(chain[0])) return false;

        return true;
    }

    isGenesisBlock(block) {
        const genesis = this.chain[0];
        return genesis.previousBlockHash === block.previousBlockHash && genesis.hash === block.hash && genesis.index === block.index;
    }

    getLastBlock() {
        return this.chain.length > 0 ? this.chain[this.chain.length - 1] : null;
    }
    createNewTransaction(amount, sender, recipient) {
        const newTransaction = {
            amount,
            sender,
            recipient,
            transactionId: uuidv4().split("-").join("")
        }
        return newTransaction;
    }
    addToPendingTransactions(transaction) {
        this.pendingTransactions.push(transaction);
        return this.getLastBlock()['index'] + 1;
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
    addNode(nodeUrl) {
        if (this.networkNodes.indexOf(nodeUrl) == -1
            && nodeUrl !== this.currentNodeUrl) this.networkNodes.push(nodeUrl);
    }
    getAllNodes() {
        return [...this.networkNodes, this.currentNodeUrl];
    }

    getBlock(blockHash) {
        
        for (const block of this.chain) {
            if (block.hash === blockHash) return block;
        }
    
        return null
    }

    getTransaction(transactionId) {
        for (const block of this.chain) {
            for (const transaction of block.transactions) {
                if (transaction.transactionId === transactionId) return {transaction, block};
            }

        }
        return { block: null, transaction: null };
    }

    getAddressData(address) {
        const transactions = [];
        let balance = 0;
        for (const block of this.chain) {
            for (const transaction of block.transactions) {
                if (transaction.sender === address || transaction.recipient === address)
                    transactions.push(transaction);
            }
        }

        if (transactions.length > 0) {
            transactions.forEach(transaction => {
                if (transaction.recipient === address) balance += transaction.amount;
                else balance -= transaction.amount;
            })
        }
        
        return { addressTransactions: transactions, addressBalance: balance };
    }

}


module.exports = Blockchain;