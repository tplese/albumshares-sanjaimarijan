//const SshClient = require('ssh2-sftp-client');
const { MongoClient, ObjectID } = require('mongodb');
const debug = require('debug')('app:albumController');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// photo directory paths - fulls and thumbs
const fullPhotosDirPath = path.join(__dirname, '..', '..', 'public', 'photos', 'fulls');
//const thumbPhotosDirPath = path.join(__dirname, '..', '..', 'public', 'photos', 'thumbs');

let fullPhotosList = [];
let listOfPhotoObjects = [];
let fullPhotosHash = '';
let hashesIdentical = false;
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
  function readFullPhotosDirectory(req, res, next) {
    debug('readFullPhotosDirectory');
  
    fullPhotosList = fs.readdirSync(fullPhotosDirPath);

    next();
  }

  async function createFullPhotosDirectoryHash(req, res, next) {
    debug('createFullPhotosDirectoryHash');

    try {
      let tempString = '';
      
      for (let file in fullPhotosList) {
        tempString += file;
      };

      fullPhotosHash = crypto
        .createHash('md5')
        .update(tempString)
        .digest('hex');

      debug(`fullPhotosHash: ${fullPhotosHash}`);

    } catch (err) {
      debug(err.stack);
    }

    next();
  }
 

  async function compareLastAndFileHash(req, res, next) {
    debug('compareDirAndFileHash');

    try {
      // directory hash stored in .txt file
      const directoryHashOnFile = fs.readFileSync(path.join(__dirname, '../../directory-hash.txt')).toString();
      debug(`directoryHashOnFile: ${directoryHashOnFile}`);

      if (directoryHashOnFile === fullPhotosHash) {
        hashesIdentical = true;
      } else {
        fs.writeFileSync(path.join(__dirname, '../../directory-hash.txt'), fullPhotosHash);
      };
    } catch (err) {
      debug(err.stack);
    }

    next();
  }


  async function populatePhotosDatabase(req, res, next) {
    debug('populatePhotosDatabase');

    if (!hashesIdentical) {
      try {
        const photosCollection = await getPhotosDbCollection(client);
        const result = await photosCollection.deleteMany({});

        const pathPhotosFulls = path.join('photos', 'fulls');
        const pathPhotosThumbs = path.join('photos', 'thumbs');
        
        for (let photo of fullPhotosList) {
          const photoObj = {};
          photoObj.name = photo;
          photoObj.full = path.join(pathPhotosFulls, photo);
          photoObj.thumb = path.join(pathPhotosThumbs, photo);
          
          //debug(`photoObj: ${photoObj.name}`)  
          const photosCollection = await getPhotosDbCollection(client);
          const result = await photosCollection.insertOne(photoObj);
        };
      } catch (err) {
        debug(err.stack);
      }

      await client.close();
    };

    next();
  }


  async function getPhotosFromDbToArray(req, res, next) {
    debug('getPhotosFromDbToArray');

    try {
      const photosCollection = await getPhotosDbCollection(client);
      listOfPhotoObjects = await photosCollection.find().toArray();
      //debug(`listOfPhotosObj.name: ${listOfPhotoObjects[10].name}`);
      //debug(`listOfPhotosObj.full: ${listOfPhotoObjects[10].full}`);
      //debug(`listOfPhotosObj.thumb: ${listOfPhotoObjects[10].thumb}`);

    } catch (err) {
			debug(err.stack);
		}

    await client.close();
    
    next();
  }

  
  async function renderPage(req, res, next) {
    debug('renderPage');

    try {
      res.render(
        'photo-gallery',
        {
          listOfPhotoObjects,
        },
      ); 
    } catch {
      debug(err.stack);
    }
    next();
  }

  return {
    readFullPhotosDirectory,
    createFullPhotosDirectoryHash,
    compareLastAndFileHash,
    populatePhotosDatabase,
    getPhotosFromDbToArray,
    renderPage,
  };
};