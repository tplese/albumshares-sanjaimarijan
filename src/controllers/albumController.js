const { MongoClient, ObjectID } = require('mongodb');
const debug = require('debug')('app:albumController');
//const path = require('path');
//const fs = require('fs');
const crypto = require('crypto');
//const archiver = require('archiver');
const { dbUrl } = require('../../mongodb-credentials/martinaDavorin');

// ********** Google Cloud Storage ********** START **********
const GOOGLE_CLOUD_PROJECT = process.env['GOOGLE_CLOUD_PROJECT'];
const CLOUD_BUCKET = GOOGLE_CLOUD_PROJECT + '_bucket';

// [Start app_cloud_storage_client]
const {Storage} = require('@google-cloud/storage');

const storage = new Storage();
const bucket = storage.bucket(CLOUD_BUCKET);
// [End app_cloud_storage_client]
// ********** Google Cloud Storage ********** END **********

// ************************** CORS **************************
const bucketName = 'martinaidavorin_bucket';
const maxAgeSeconds = 3600;
const method = 'GET';
const origin = 'https://martinaidavorin.xyz';
const responseHeader = 'Content-Type';

// ************************* CORS - END *********************

const directoryName = 'photos';
let dirHashExists = false;
let photosFullsList = [];
let listOfPhotoObjects = [];
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


module.exports = function albumController() {
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
			debug(err.stack);
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
        const [photosFullsObjects] = await bucket.getFiles({ prefix:`${directoryName}/fulls/` });

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
    debug('writeDirectoryHashToDb');

    try {
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


  // OLD - not working
  /*
  async function compareLastAndFileHash(req, res, next) {
    debug('compareLastAndFileHash');

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
  */


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

          photoObj.full = `https://storage.googleapis.com/martinaidavorin_bucket/${directoryName}/fulls/` + photo;
          photoObj.thumb = `https://storage.googleapis.com/martinaidavorin_bucket/${directoryName}/thumbs/` + photo;

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
      listOfPhotoObjects = await photosCollection.find().toArray();
      await client.close();
    } catch (err) {
			debug(err.stack);
		}
    
    next();
  }

  async function configureBucketCors(req, res, next) {
    debug('configureBucketCors');

    try {
      await storage.bucket(bucketName).setCorsConfiguration([
        {
          maxAgeSeconds,
          method: [method],
          origin: [origin],
          responseHeader: [responseHeader],
        },
      ]);

      console.log(`Bucket ${bucketName} was updated with a CORS config
          to allow ${method} requests from ${origin} sharing 
          ${responseHeader} responses across origins`);
    } catch (err) {
      debug(err.stack);
    }

    next();
  }
  

  async function renderPageNew(req, res, next) {
    debug('renderPageNew');

    try {
      res.render(
        'photo-gallery',
        {
          listOfPhotoObjects,
        },
      );
    } catch (err) {
      debug(err.stack);
    }

    next();
  }


  // OLD - not working
  /*
  async function renderPage(req, res, next) {
    debug('renderPage');

    try {
      res.render(
        'photo-gallery',
        {
          listOfPhotoObjects,
        },
      );
    } catch (err) {
      debug(err.stack);
    }

    next();
  }
  */


  // OLD - not working
  /*
  async function archivePhotos(req, res, next) {
    debug('archivePhotos');
    
    try {
      let output = fs.createWriteStream('Davorin-Martina-Foto.zip');
      
      let archive = archiver('zip', {
        zlib: { level: 9 }
      });

      output.on('close', function() {
        console.log(archive.pointer() + ' total bytes');
        console.log('archiver has been finalized and the output file descriptor has closed.');
      });

      output.on('end', function() {
        console.log('Data has been drained');
      });

      archive.on('error', function(err) {
        throw err;
      });

      archive.on('warning', function(err) {
        if (err.code === 'ENOENT') {
          // log warning
        } else {
          // throw error
          throw err;
        }
      });

      archive.on('error', function(err) {
        throw err;
      });

      // Pipe archive data to the output file
      archive.pipe(output);

      // Append files
      const photosToDownload = await req.body;
      let fileBeingArchived;
      
      for (let key in photosToDownload) {
        //debug(`value: ${photosToDownload[key]}`);
        fileBeingArchived = path.join(fullPhotosDirPath, key);
        //debug(`currentFile: ${currentFileDownload}`);

        archive.append(fs.createReadStream(fileBeingArchived), { name: key });
      };

      await archive.finalize();
    } catch (err) {
      debug(err.stack);
    }

    next();
  }
  */

  // OLD - not working
  /*
  async function downloadChosenPhotos(req, res) {
    debug('downloadChosenPhotos');
 
    try {
      res.download('Davorin-Martina-Foto.zip', (error) => {
        if (error) {
          debug(`Error: ${error}`)
        } else {
          debug('Successful download!');
        };
      });
    } catch (err) {
      debug(err.stack);
    }
  }
  */

  return {
    checkDirHashExists,
    readFullPhotosDirectory,
    createFullPhotosDirectoryHash,
    writeDirectoryHashToDb,  
    populatePhotosDatabase,
    getPhotosFromDbToArray,
    configureBucketCors,
    renderPageNew,
  };
};