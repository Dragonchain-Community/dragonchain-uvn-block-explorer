const fs = require('fs');
const uuidv4 = require("uuid/v4");

const salt = uuidv4();

const config = {
	"salt": salt 
}

fs.writeFile('config.json', JSON.stringify(config), (err) => {    
    if (err) throw err;
    
    console.log('Config written.');
});
