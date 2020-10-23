const { MongoClient, ObjectID } = require('mongodb');
const debug = require('debug')('app:album2Controller');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { dbUrl } = require('../../mongodb-credentials/martinaDavorin');

// ***** Google Cloud Storage ***** START *****
const GOOGLE_CLOUD_PROJECT = process.env['GOOGLE_CLOUD_PROJECT'];
const CLOUD_BUCKET = GOOGLE_CLOUD_PROJECT + '_bucket';

// [Start app_cloud_storage_client]
const {Storage} = require('@google-cloud/storage');

const storage = new Storage();
const bucket = storage.bucket(CLOUD_BUCKET);
// [End app_cloud_storage_client]

// ***** Google Cloud Storage ***** END *****

// LOCAL photo directory paths - fulls
//const fullPhotosDirPath = path.join(__dirname, '..', '..', 'public', 'photos2', 'fulls');

// GOOGLE photos bucket path 
const fullPhotosDirPath = path.join('https://storage.googleapis.com', CLOUD_BUCKET, 'photos2', 'fulls');

let dirHashExists;
let fullPhotosList = [];
let listOfPhotoObjects2 = [];
let fullPhotosHash = '';
let client;

async function getPhotosDbCollection() {
  try {
    const dbName = 'albumshares';
    
    client = await MongoClient.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    debug('getPhotosDbCollection -> Connected correctly to server');

    const db = client.db(dbName);
    const col = db.collection('photos2');
    
    return col;
  } catch (err) {
    debug(err.stack);
  }

  return 1;
}


module.exports = function albumController() {
  async function checkDirHashExists(req, res, next) {
    debug('checkDirHashExist');
    
    try {
      fs.access(path.join(__dirname, '..', '..', 'directory-hashes', 'photos2.txt'), (err) => {
        if (err) {
          dirHashExists = false;
        } else {
          dirHashExists = true;
        };
      });
    } catch (err) {
      debug(err.stack);
    }
    
    next();
  } 
  
  
  function readFullPhotosDirectory(req, res, next) {
    debug('readFullPhotosDirectory');
  
    try {
      if (dirHashExists === false) {
        // LOCAL
        //fullPhotosList = fs.readdirSync(fullPhotosDirPath);

        // GOOGLE
        fullPhotosList = storage.bucket(fullPhotosDirPath).getFiles();
      };
    } catch (err) {
      debug(err.stack);
    };

    next();
  }


  async function createFullPhotosDirectoryHash(req, res, next) {
    debug('createFullPhotosDirectoryHash');

    try {
      if (dirHashExists === false) {
        let tempString = '';
        
        for (let file in fullPhotosList) {
          tempString += file;
        };

        fullPhotosHash = crypto
          .createHash('md5')
          .update(tempString)
          .digest('hex');

        debug(`fullPhotosHash: ${fullPhotosHash}`);
      };
    } catch (err) {
      debug(err.stack);
    }

    next();
  }
 

  async function writeDirectoryHashToFile(req, res, next) {
    debug('writeDirectoryHashToFile');

    try{
      fs.writeFileSync(path.join(__dirname, '..', '..', 'directory-hashes', 'photos2.txt'), fullPhotosHash);
    } catch (err) {
      debug(err.stack);
    };

    next();
  }


  async function populatePhotosDatabase(req, res, next) {
    debug('populatePhotosDatabase');

    if (dirHashExists === false) {
      try {
        const photosCollection = await getPhotosDbCollection(client);
        const result = await photosCollection.deleteMany({});
        await client.close();
        
        for (let photo of fullPhotosList) {
          const photoObj = {};
          photoObj.name = photo;
          photoObj.full = path.join('https://storage.googleapis.com', CLOUD_BUCKET, 'photos2', 'fulls', photo);
          photoObj.thumb = path.join('https://storage.googleapis.com', CLOUD_BUCKET, 'photos2', 'thumbs', photo);

          // LOCAL only
          //photoObj.full = path.join('photos2', 'fulls', photo);
          //photoObj.thumb = path.join('photos2', 'thumbs', photo);
          
          //debug(`photoObj: ${photoObj.name}`)  
          const photosCollection = await getPhotosDbCollection(client);
          const result = await photosCollection.insertOne(photoObj);
          await client.close();
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
      listOfPhotoObjects2 = await photosCollection.find().toArray();
      await client.close();
      //debug(`listOfPhotosObj.name: ${listOfPhotoObjects2[10].name}`);
      //debug(`listOfPhotosObj.full: ${listOfPhotoObjects2[10].full}`);
      //debug(`listOfPhotosObj.thumb: ${listOfPhotoObjects2[10].thumb}`);

    } catch (err) {
			debug(err.stack);
    }
    
    next();
  }


  async function renderPageNew(req, res, next) {
    debug('renderPageNew');

    try {
      res.render(
        'photo2-gallery',
        {
          listOfPhotoObjects2,
        },
      );
    } catch (err) {
      debug(err.stack);
    }

    next();
  }


  return {
    checkDirHashExists,
    readFullPhotosDirectory,
    createFullPhotosDirectoryHash,
    writeDirectoryHashToFile,
    populatePhotosDatabase,
    getPhotosFromDbToArray,
    renderPageNew,
  };
};