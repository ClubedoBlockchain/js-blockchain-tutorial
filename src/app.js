const express = require('express')
const bodyParser = require("body-parser");
const Blockchain = require('./blockchain');
const { v4: uuidv4 } = require('uuid')

const getService = require("./helper/service");

const runServer = (port) => {

    const blockchain = new Blockchain(port);
    const address = uuidv4().split('-').join("");
    const app = express()
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    app.get('/blockchain', (req, res) => {
        res.json(blockchain)
    })

    app.post('/transaction', (req, res) => {
        const { sender, amount, recipient, transactionId } = req.body;
        const blockNumber = blockchain.addToPendingTransactions({amount, sender, recipient, transactionId });
        res.json({ message: `Transaction will be add in block ${blockNumber}` });
    })

    app.post('/transaction/broadcast', (req, res) => {
        const { sender, amount, recipient } = req.body;
        const transaction = blockchain.createNewTransaction(amount, sender, recipient);
        blockchain.addToPendingTransactions(transaction);

        const regNodes = [];
        blockchain.networkNodes.forEach((networkUrl) => {
            
            try {

                regNodes.push(getService(networkUrl).post("/transaction", transaction ))
            } catch (error) {
                console.error('Error: ', error.message);
            }
            
        })

        Promise.all(regNodes).then( () => {
            res.json({ message: `Transaction registered and broadcasted` });
            
        }).catch(e => console.error)       
    })

    app.post("/receive-new-block", (req, res) => {
        const { newBlock } = req.body;
        const lastBlock = blockchain.getLastBlock();
        const correctHash = lastBlock.hash === newBlock.previousBlockHash;
        const correctIndex = lastBlock.index + 1 === newBlock.index;

        if (correctHash && correctIndex) {
            blockchain.chain.push(newBlock);
            blockchain.pendingTransactions = [];
            res.json({
                message: "New block received and accepted",
                newBlock
            })
        } else {
            res.json({
                message: "New Block rejected",
                newBlock
            })
        }
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

        const regNodes = [];
        blockchain.networkNodes.forEach((networkUrl) => {
            try {

                regNodes.push(getService(networkUrl).post("/receive-new-block", {newBlock}))
            } catch (error) {
                console.error('Error: ', error.message);
            }
            
        })

        Promise.all(regNodes).then( () => {
            getService(blockchain.currentNodeUrl).post("/transaction/broadcast",
                { amount: 12.5, sender: "0x0", recipient: address  })
        }).catch(e => console.error)
        
        res.json({ message: "New block mined and broadcast with successfull.", block: newBlock });            

    })

    app.post("/register-and-broadcast-node", async (req, res) => {
        const { newNodeUrl } = req.body;

        blockchain.addNode(newNodeUrl);

        const regNodes = [];
        blockchain.networkNodes.forEach((networkUrl) => {
            if (newNodeUrl !== networkUrl ) {
                try {

                    regNodes.push(getService(networkUrl).post("/register-node", { newNodeUrl }))   
                } catch (error) {
                    console.error('Error: ', error.message);
                }
            }
        })

        Promise.all(regNodes).then(data => {
            
                getService(newNodeUrl).post("/register-nodes-bulk",
                    { allNetworkNodes: blockchain.getAllNodes() })    
        }).catch(e => console.error)

        res.json({ message: `Found and register`, nodes: blockchain.getAllNodes() })
    })

    app.post("/register-node", (req, res) => {
        const { newNodeUrl } = req.body;

        blockchain.addNode(newNodeUrl);

        res.json({ message: `Registered nodes`, nodes: blockchain.getAllNodes() })
    })

    app.post("/register-nodes-bulk", (req, res) => {
        const { allNetworkNodes } = req.body;

        blockchain.networkNodes = allNetworkNodes.filter(node => node !== blockchain.currentNodeUrl);
        
        res.json({ message: `Registered nodes`, nodes: blockchain.getAllNodes() })
    })

    app.get("/consensus", (req, res) => {
        const reqNodes = [];
        blockchain.networkNodes.forEach(networkUrl => {
            reqNodes.push(getService(networkUrl).get("/blockchain"))   
        })

        Promise.all(reqNodes)
            .then(responses => {
                const blockchainNodes = responses.map(response => response.data );
                let maxChainLength = blockchain.chain.length;
                let newLongestChain = null;
                let newPendingTransactions = null;

                blockchainNodes.forEach(blockchainNode => {
                    if (blockchainNode.chain.length > maxChainLength) {
                        maxChainLength = blockchainNode.chain.length;
                        newLongestChain = blockchainNode.chain;
                        newPendingTransactions = blockchainNode.pendingTransactions;
                    }
                });

                if (!newLongestChain || (newLongestChain && !blockchain.chainIsValid(newLongestChain))) {
                    res.json({
                        message: "Current chain will not be replaced.",
                        chain: blockchain.chain
                    })
                }

                if (newLongestChain && blockchain.chainIsValid(newLongestChain)) {
                    
                    blockchain.chain = newLongestChain;
                    blockchain.pendingTransactions = newPendingTransactions;

                    res.json({
                        message: "Current chain has been replaced.",
                        chain: newLongestChain
                    })
                }
                
            }).catch(e => {
                console.error('Error:', e.message);
            })
    })

    app.get('/block/:blockHash', (req, res) => {
        const blockHash = req.params.blockHash;
        const block = blockchain.getBlock(blockHash);
        res.json({
            block
        })
    })

    app.get('/transaction/:transactionId', (req, res) => {
        const transactionId = req.params.transactionId;
        const { transaction, block } = blockchain.getTransaction(transactionId);
        res.json({
            transaction,
            block: block ? block.index : null
        })
    })


    app.get('/address/:address', (req, res) => {
        const address = req.params.address;
        const addressData = blockchain.getAddressData(address);
        res.json({
            addressData,
        })
    })

    app.get("/block-explorer", (req, res) => {
        res.sendFile("./block-explorer/index.html", { root: __dirname })
    })

    app.listen(port, () => {
        console.log(`Listening on port ${port}`)
    })

}

module.exports = runServer