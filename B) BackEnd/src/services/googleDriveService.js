const { google } = require('googleapis');
const path = require('path');

const serviceAccount = {
  project_id: process.env.GOOGLE_PROJECT_ID,
  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
};

const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/drive']
});

const drive = google.drive({
    version: 'v3',
    auth
});

// RAM CACHE
const cache = {};

async function findFile(fileName) {

    const response = await drive.files.list({
        pageSize: 20,
        fields: 'files(id, name)'
    });

    return response.data.files.find(
        file => file.name.trim() === fileName.trim()
    );
}

async function getCollection(collectionName) {

    // CACHE HIT
    if (cache[collectionName]) {
        console.log('Serving from cache');

        return cache[collectionName];
    }

    const fileName = `${collectionName}.json`;

    const file = await findFile(fileName);

    if (!file) {
        throw new Error(`File not found: ${fileName}`);
    }

    // READ FILE DIRECTLY
    const response = await drive.files.get(
        {
            fileId: file.id,
            alt: 'media'
        },
        {
            responseType: 'text'
        }
    );

    const parsedData = JSON.parse(response.data);

    // STORE IN CACHE
    cache[collectionName] = parsedData;

    return parsedData;
}

module.exports = {
    getCollection
};