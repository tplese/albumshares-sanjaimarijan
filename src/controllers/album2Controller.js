const { MongoClient, ObjectID } = require('mongodb');
const debug = require('debug')('app:album2Controller');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const archiver = require('archiver');

// photo directory paths - fulls and thumbs
const fullPhotosDirPath = path.join(__dirname, '..', '..', 'public', 'photos2', 'fulls');

let dirHashExists;
let fullPhotosList = [];
let listOfPhotoObjects2 = [];
let fullPhotosHash = '';
let client;

async function getPhotosDbCollection() {
  try {
    const url = 'mongodb://tomtom:9hotHwAcEvoq1NWDtPgLY2MlKhHRLqdh3dH2csFS9oih4Z7L@34.89.232.92:27017/albumshares?authSource=albumshares&readPreference=primary&appname=MongoDB%20Compass&ssl=false';
    //const dbName = 'albumshares';

    client = await MongoClient.connect(url, { useUnifiedTopology: true });
    debug('getPhotosDbCollection -> Connected correctly to server');

    //const db = client.db(dbName);
    //const col = db.collection('photos');
    const col = client.collection('photos2');

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
        fullPhotosList = fs.readdirSync(fullPhotosDirPath);
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

        const pathPhotosFulls = path.join('photos2', 'fulls');
        const pathPhotosThumbs = path.join('photos2', 'thumbs');
        
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
      listOfPhotoObjects2 = await photosCollection.find().toArray();
      //debug(`listOfPhotosObj.name: ${listOfPhotoObjects2[10].name}`);
      //debug(`listOfPhotosObj.full: ${listOfPhotoObjects2[10].full}`);
      //debug(`listOfPhotosObj.thumb: ${listOfPhotoObjects2[10].thumb}`);

    } catch (err) {
			debug(err.stack);
		}

    await client.close();
    
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