const moment = require('moment');
const _ = require('underscore');
const util = require('util');
const rp = require('request-promise');
const CryptoJS = require('crypto-js');
const dcsdk = require('dragonchain-sdk')

module.exports  = {    
    createClient: async function (credentials, salt) {
        let credentialsObj = null;

        try {
            const credentials_string = CryptoJS.AES.decrypt(credentials, salt).toString(CryptoJS.enc.Utf8);

            credentialsObj = JSON.parse(credentials_string);

        } catch (e)
        {
            throw e;
        }

        let client = await dcsdk.createClient({authKeyId: credentialsObj.access_id, authKey: credentialsObj.access_key, dragonchainId: credentialsObj.public_id, endpoint: credentialsObj.endpoint_url});

        return client;
    },

    getBlockById: async function (client, block_id)
    { 
        const block_response = this.validateResponse(await client.getBlock({blockId: block_id}));

        return block_response.response;
    },    

    getBlocks: async function (client, start_timestamp)
    {
        const earliest_timestamp = moment.utc().subtract(5, "months").startOf("month").format("X");

        if (start_timestamp < earliest_timestamp)
            start_timestamp = earliest_timestamp;
        
        const blocks_response = this.validateResponse(await client.queryBlocks({ redisearchQuery: `@timestamp:[(${start_timestamp} +inf]`, limit: 500, sortBy: "timestamp", sortAscending: true}));

        let blocks = [];
        let last_timestamp = start_timestamp;

        if (blocks_response.response.results.length > 0)
        {               
            for (let i = 0; i < blocks_response.response.results.length; i++)
            {
                element = blocks_response.response.results[i];
                last_timestamp = element.header.timestamp;
                blocks.push(element);
            }
        }

        return {
            blocks: blocks, 
            last_timestamp: last_timestamp,
            blocks_remaining: (blocks_response.response.total - blocks.length)
        }
    },

    getTransaction: async function (client, txn_id)
    {        
        const blocks_response = this.validateResponse(await client.getTransaction({transactionId: txn_id}));

        return blocks_response.response;
    },
    getStatus: async function (client)
    {
        const status_response = this.validateResponse(await client.getStatus());

        return {status: status_response.response};
    },
    getTakaraPrice: async function () {
            let takara_price = "Not Available";

            try {
                price = await rp({uri: "https://billing.api.dragonchain.com/v1/prices/dragonPrice", json: true})
                                .then(function (res) {
                                    return res.price;
                                })    

                takara_price = `\$${price}`;
            } catch (e)
            {
                
            }            

            return takara_price;
    },    
    validateResponse: function (response) {

        if (typeof response == "undefined")
        {
            console.log(response);
            throw {errno: "Undefined Object", type: "Invalid Response", message: "The response object passed was undefined."};
        }

        if (typeof response.response.error != "undefined")
        {
            console.log(response);
            throw {errno: response.status, type: `API Error: ${response.response.error.type}`, message: `API Error Details: ${response.response.error.details}`}
        }

        return response;

    }

}
