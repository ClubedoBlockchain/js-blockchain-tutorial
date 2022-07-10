const axios = require("axios");

const getService = (url) => {
    return axios.create({ baseURL: url })
}

module.exports = getService;