const runServer = require("./app");
require("dotenv").config();

const instances = process.env.NUMBER_OF_NODES || 1;
const PORT = process.env.PORT || 3000;

for (let index = 0; index < instances; index++) {
    const port = parseInt(PORT) + parseInt(index);
    runServer(port);
}