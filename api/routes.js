const express = require('express');
const apiRouter = express.Router();
const Url = require("./models/urlModel");
const uuidv4 = require('uuid').v4;

apiRouter.use(express.json());

apiRouter.post('/shorten', async (req, res) => {

    const bodyUrl = req.body.url;
    const bodyShortUrl = req.body.shorturl;

    // Check for valid url string with RegeX
    let urlRegex = new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)/);

    if (!bodyUrl.match(urlRegex)) {
        return res.json({ error: "Invalid URL" });
    }


    // check for customURL request or RandomURL request
    if(req.body.randomUrl == 'true') {

        // Generate uuid
        function generateCustomUuid(){

            let genRandomURL = uuidv4();
            genRandomURL = genRandomURL.substring(0,6);
            return genRandomURL; 
        }

         // Do a while loop until we find the unique uuid in db
         
        let genUrl = generateCustomUuid();
        let urlExists = await Url.find({short_url: genUrl});
        while(urlExists.length != 0) {
            // regenerate the uuid and check again.
            let urlExists = await Url.find({short_url: genUrl});
            urlExists = await Url.find({ short_url: genUrl});
        }
        
        // Create new entry in db
        const result = await Url.create({
            original_url: bodyUrl,
            short_url: genUrl,
        });

        res.json({
            info: "Short Url created successfully",
            original_url: result.original_url,
            short_url: `https://zippy.up.railway.app/${result.short_url}`,
        });
    }

    else {

        // check if the url alread exist in the database
        const urlExists = await Url.find({ short_url: bodyShortUrl });
        
        if(urlExists.length == 0) {

            // Create new entry in db
            const result = await Url.create({
                original_url: bodyUrl,
                short_url: bodyShortUrl.toString()
            });

            res.json({
                info: "Short Url created successfully",
                original_url: result.original_url,
                short_url: `https://zippy.up.railway.app/${result.short_url}`
            })
        }

        else {

            // custom shortURL already exist in the database
            res.json({
                info: "the shortened url already exists, try new one",
                original_url: urlExists[0].original_url,
                short_url: `https://zippy.up.railway.app/${urlExists[0].short_url}`,
                });
        }
    }

})

apiRouter.get('/:url', async (req, res) => {

    const reqUrl = req.params.url;

    // Read from the database
    const urlExists = await Url.find({ short_url: reqUrl });
    
    if(urlExists.length == 0) {
        res.json({
            error: 'The requested Url is not found'
        });
    }
    else {
        
        res.redirect(urlExists[0].original_url);
    }

    
})

apiRouter.get('/', (req, res) => {
    res.send('[INFO] Welcome to Zippy - Compact Fast URL Shortner');
})

// Module Exports
module.exports = apiRouter;

