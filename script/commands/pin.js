const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "pin",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Jonell Magallanes",
    description: "Download images from Pinterest",
    usePrefix: false,
    commandCategory: "Media",
    usages: "[title] [count]",
    cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {
    const title = encodeURIComponent(args[0]);
    const count = args[1];

    if (!title || isNaN(count)) return api.sendMessage("Invalid command usage. Example: pin wallpaper 10", event.threadID, event.messageID);

    const apiUrl = `https://jonellccapis-dbe67c18fbcf.herokuapp.com/api/pin?title=${title}&count=${count}`;

    try {
        api.sendMessage("🔍 | Searching Pinterest images. Please wait...", event.threadID, event.messageID);

        const response = await axios.get(apiUrl);
        const { count: imageCount, data: imageUrls } = response.data;

        api.sendMessage(`📷 | Found ${imageCount} images. Downloading...`, event.threadID, event.messageID);

        const imagesDirectory = path.join(__dirname, 'images');
        if (!fs.existsSync(imagesDirectory)) {
            fs.mkdirSync(imagesDirectory);
        }

        const imageAttachments = [];

        // Download and add images to attachments
        for (let i = 0; i < imageUrls.length; i++) {
            const imageUrl = imageUrls[i];
            const imageBuffer = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const imageName = `image${i + 1}.jpg`;

            fs.writeFileSync(path.join(imagesDirectory, imageName), Buffer.from(imageBuffer.data));

            imageAttachments.push(fs.createReadStream(path.join(imagesDirectory, imageName)));
        }

        for (let i = 0; i < imageAttachments.length; i++) {
            api.sendMessage({ body: '', attachment: imageAttachments[i] }, event.threadID);
        }

        for (let i = 0; i < imageUrls.length; i++) {
            const imageName = `image${i + 1}.jpg`;
            fs.unlinkSync(path.join(imagesDirectory, imageName));
        }
    } catch (error) {
        console.error(error);
        api.sendMessage("An error occurred while processing your request.", event.threadID);
    }
};
