//const SshClient = require('ssh2-sftp-client');
const { MongoClient, ObjectID } = require('mongodb');
const debug = require('debug')('app:albumController');
const path = require('path');
const fs = require('fs');

// photo directory paths - fulls and thumbs
const photosFullsDir = path.join(__dirname, '..', '..', 'public', 'photos', 'fulls');
const photosThumbsDir = path.join(__dirname, '..', '..', 'public', 'photos', 'thumbs');

let photosFullsList = [];
let photosFullsObj = {};
let fullPhotoPath = path.join(photosFullsDir, 'img01.jpg');
let thumbPhotoPath = path.join(photosThumbsDir, 'img01.jpg');
let client;

async function getPhotosDbCollection() {
  try {
    const url = 'mongodb://localhost:27017';
    const dbName = 'albumshares';

    client = await MongoClient.connect(url, { useUnifiedTopology: true });
    debug('getPhotosDbCollection -> Connected correctly to server');

    const db = client.db(dbName);
    const col = db.collection('photos');

    return col;
  } catch (err) {
    debug(err.stack);
  }

  return 1;
}

module.exports = function albumController() {
  async function readPhotoDirectory(req, res, next) {
    debug('readPhotoDirectory');
    /*
    try {
      fs.readdir(photosFullsDir, (err, files) => {
        if (err) {
          throw err;
        };
        photosFullsList = files;
      });

      photosFullsList.forEach(photo => {
        let noJpg = photo.slice(0, -4);
        photosFullsObj[noJpg] = photo;
      });

      const photosCollection = await getPhotosDbCollection(client);
      
      debug(`ONE OBJ: ${photosFullsObj['img01']}`);

      //const result = await photosCollection.insertOne(photosFullsObj);
      
    
    } catch (err) {
			debug(err.stack);
		}

    client.close();
    */  
    next();
  }

  async function renderPage(req, res, next) {
    try {
      res.render(
        'photo-gallery',
        {
          fullPhotoPath,
          thumbPhotoPath,
        },
      ); 
    } catch {
      debug(err.stack);
    }
    next();
  }

  return {
    readPhotoDirectory,
    renderPage,
  };
};