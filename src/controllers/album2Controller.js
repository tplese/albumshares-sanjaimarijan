const { MongoClient, ObjectID } = require('mongodb');
const debug = require('debug')('app:album2Controller');
const crypto = require('crypto');
const { dbUrl } = require('../../mongodb-credentials/martinaDavorin');

// ********** Google Cloud Storage ********** START **********
//const GOOGLE_CLOUD_PROJECT = process.env['GOOGLE_CLOUD_PROJECT'];
//const CLOUD_BUCKET = GOOGLE_CLOUD_PROJECT + '_storage';

const bucketName = 'martinaidavorin_storage';

// [Start app_cloud_storage_client]
const {Storage} = require('@google-cloud/storage');

const storage = new Storage();
//const bucket = storage.bucket(CLOUD_BUCKET);
// [End app_cloud_storage_client]
// ********** Google Cloud Storage ********** END **********


const directoryName = 'photos2';
let dirHashExists = false;
let photosFullsList = [];
let listOfPhotoObjects2 = [];
let fullPhotosHash = '';
let client;

async function getCollectionFromDb(colToGet) {
  try {
    const dbName = 'albumshares';
    
    client = await MongoClient.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    debug('getPhotosDbCollection -> Connected correctly to server');

    const db = client.db(dbName);
    const col = db.collection(colToGet);
    
    return col;
  } catch (err) {
    debug(err.stack);
  }

  return 1;
}


module.exports = function album2Controller() {
  async function checkDirHashExists(req, res, next) {
    debug('checkDirHashExist');
    
    try {
      const colToGet = 'hashes';
      const hashesCollection = await getCollectionFromDb(colToGet);
      const hashForDirectory = await hashesCollection.find({name: directoryName}).toArray();
      await client.close();
      
      if (hashForDirectory[0] != 'undefined' && hashForDirectory[0].name === directoryName) {
        dirHashExists = true;
      };
    } catch (err) {
			dirHashExists = false;
    }
    
    next();
  } 
  
  
  async function readFullPhotosDirectory(req, res, next) {
    debug('readFullPhotosDirectory');
  
    try {
      if (dirHashExists === false) {
        // LOCAL
        // photosFullsList = fs.readdirSync(fullPhotosDirPath);

        // GOOGLE
        const [photosFullsObjects] = await storage.bucket(bucketName).getFiles({ prefix:`${directoryName}/fulls/` });

        let i = 0;
        photosFullsObjects.forEach(file => {
          if (file.name.includes('.jpg')){
            photosFullsList[i] = file.name.replace(`${directoryName}/fulls/`, '');
            i++;
          };
        });
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
        
        for (let photoName in photosFullsList) {
          tempString += photoName;
        };

        fullPhotosHash = crypto
          .createHash('md5')
          .update(tempString)
          .digest('hex');
      };
    } catch (err) {
      debug(err.stack);
    }

    next();
  }
 

  async function writeDirectoryHashToDb(req, res, next) {
    debug('writeDirectoryHashToFile');

    try{
      if (dirHashExists === false) {
        let hashesObject = {};
        hashesObject.name = directoryName;
        hashesObject.hash = fullPhotosHash;

        const colToGet = 'hashes';
        const hashesCollection = await getCollectionFromDb(colToGet);
        const result = await hashesCollection.insertOne(hashesObject);
        await client.close();
      };
    } catch (err) {
      debug(err.stack);
    };

    next();
  }


  async function populatePhotosDatabase(req, res, next) {
    debug('populatePhotosDatabase');

    try {
      if (dirHashExists === false) {
        const colToGet = directoryName;
        const photosCollection = await getCollectionFromDb(colToGet);
        const result = await photosCollection.deleteMany({});
        await client.close();
        
        for (let photo of photosFullsList) {
          const photoObj = {};
          photoObj.name = photo;

          photoObj.full = `https://storage.googleapis.com/martinaidavorin_storage/${directoryName}/fulls/` + photo;
          photoObj.thumb = `https://storage.googleapis.com/martinaidavorin_storage/${directoryName}/thumbs/` + photo;

          const colToGet = directoryName;
          const photosCollection = await getCollectionFromDb(colToGet);
          const result = await photosCollection.insertOne(photoObj);
          await client.close();
        };
      };
    } catch (err) {
      debug(err.stack);
    }

    next();
  }


  async function getPhotosFromDbToArray(req, res, next) {
    debug('getPhotosFromDbToArray');

    try {
      const colToGet = directoryName;
      const photosCollection = await getCollectionFromDb(colToGet);
      listOfPhotoObjects2 = await photosCollection.find().toArray();
      await client.close();
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
    writeDirectoryHashToDb,
    populatePhotosDatabase,
    getPhotosFromDbToArray,
    renderPageNew,
  };
};