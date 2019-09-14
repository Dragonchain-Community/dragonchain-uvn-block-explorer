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
    getBlocks: async function (client, start_block_id)
    {
        const blocks_response = this.validateResponse(await client.queryBlocks({ luceneQuery: `block_id:>${start_block_id}`, limit: 50, sort: "block_id:asc"}));

        let blocks = [];
        let last_block_id = start_block_id;

        if (blocks_response.response.results.length > 0)
        {            
            for (let i = 0; i < blocks_response.response.results.length; i++)
            {
                element = blocks_response.response.results[i];
                last_block_id = element.header.block_id;
                blocks.push(element);
            }
        }

        return {
            blocks: blocks, 
            last_block_id: last_block_id,
            blocks_remaining: (blocks_response.response.total - blocks.length)
        }
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
