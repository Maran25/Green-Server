const {createClient} = require("@sanity/client");
const imageUrlBuilder = require('@sanity/image-url');
require("dotenv").config();

const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: 'production',
    apiVersion: '2023-04-23',
    useCdn: true,
    token: process.env.SANITY_KEY || '',
});
const builder = imageUrlBuilder(client);

module.exports = {client, builder};