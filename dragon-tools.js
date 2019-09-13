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
    poll: async function (client) {

        const status_response = this.validateResponse(await client.getStatus());
        const last_block_response = this.validateResponse(await client.queryBlocks({ limit: 1, sort: "block_id:desc"}));

        if (last_block_response.response.total == 0)
        {
            return {empty: true}
        } else {

            let blocks_day = [];
            let done = false;
            let page = 0;
            let start_time = moment.utc().subtract(23,'hours').startOf('hour').unix();
            let end_time = moment.utc().unix();

            while (!done) {
                const blocks_response = this.validateResponse(await client.queryBlocks({ luceneQuery: `header.timestamp[${start_time.toString()} TO ${end_time.toString()}]`, limit: 50, offset: page, sort: "block_id:desc"}));

                if (blocks_response.response.results.length > 0)
                {
                    for (let i = 0; i < blocks_response.response.results.length; i++)
                    {
                        element = blocks_response.response.results[i];
                        blocks_day.push(element);
                    }

                    page += 50;

                } else
                    done = true;
            }

            let blocks_week = [];
            for (let i = 0; i < 7; i++)
            {
                let current_day_start = moment.utc().subtract(i, "days").startOf("day").format("X");
                let current_day_end = moment.utc().subtract(i, "days").endOf("day").format("X");

                // queryBlocks with luceneQuery (TODO: replace with redisearch on next DC release)
                const blocks_response_week = await client.queryBlocks({ limit: 1, luceneQuery: `header.timestamp[${current_day_start.toString()} TO ${current_day_end.toString()}]`, sort: "block_id:desc"});

                blocks_week.push({"day" : moment.unix(current_day_start).utc().format("MMM Do"), "blocks": blocks_response_week.response.total});

            }

            let takara_price = await this.getTakaraPrice();           
            
            return {status: status_response.response, last_block: last_block_response.response.results[0], blocks_day: blocks_day, blocks_week: blocks_week, takara_price: takara_price};
        }
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

    },
    parseBlocksByHour: function (blocks) {
        const occurences = [];

        blocks.forEach(function (element) {
            occurences.push(element.header.timestamp * 1000);
        });

        return _.map(
            _.groupBy(occurences, function (timestamp) {
                return moment.utc(timestamp).startOf('hour').format("HH:mm");
            }),
            function (group, hour) {
                return {hour: hour, times: group}
            }
        );
    }

}
