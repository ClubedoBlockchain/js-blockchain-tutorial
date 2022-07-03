const express = require('express')
const bodyParser = require("body-parser");
const Blockchain = require('./blockchain');
const { v4: uuidv4 } = require('uuid')
const app = express()
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const blockchain = new Blockchain();
const address = uuidv4().split('-').join("");

const port = process.env.PORT || 3000

app.get('/blockchain', (req, res) => {
    res.json(blockchain)
})

app.post('/transaction', (req, res) => {
    const { sender, amount, recipient } = req.body;
    const blockNumber = blockchain.createNewTransaction(amount, sender, recipient);
    res.json({ note: `Transaction will be add in block ${ blockNumber }` });
})


app.get('/mine', (req, res) => {
    const lastBlock = blockchain.getLastBlock();
    const previousBlockHash = lastBlock['hash'];
    const currentBlockData = {
        transactions: blockchain.pendingTransactions,
        index: lastBlock['index'] + 1,
    }
    const { nonce, hash } = blockchain.proofOfWork(previousBlockHash, currentBlockData);
    
    const newBlock = blockchain.createNewBlock(nonce, previousBlockHash, hash);
    
    blockchain.createNewTransaction(12.5, "0x0", address);

    res.json({ note: "New block mined with successfull.", block: newBlock });
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})