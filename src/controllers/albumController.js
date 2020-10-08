//const SshClient = require('ssh2-sftp-client');
const { MongoClient, ObjectID } = require('mongodb');
const debug = require('debug')('app:albumController');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const archiver = require('archiver');
//const through = require('through2');

// photo directory paths - fulls and thumbs
const fullPhotosDirPath = path.join(__dirname, '..', '..', 'public', 'photos', 'fulls');
//const thumbPhotosDirPath = path.join(__dirname, '..', '..', 'public', 'photos', 'thumbs');

let dirHashExists;
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
  async function checkDirHashExists(req, res, next) {
    debug('checkDirHashExist');
    
    try {
      fs.access(path.join(__dirname, 'directory-hash.txt'), (err) => {
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
      fs.writeFileSync(path.join(__dirname, '../../directory-hash.txt'), fullPhotosHash);
    } catch (err) {
      debug(err.stack);
    };

    next();
  }


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


  async function populatePhotosDatabase(req, res, next) {
    debug('populatePhotosDatabase');

    if (dirHashExists === false) {
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
    } catch (err) {
      debug(err.stack);
    }

    next();
  }

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


  async function renderPageNew(req, res, next) {
    debug('renderPageNew');

    try {
      res.render(
        'photo-new',
        {
          listOfPhotoObjects,
        },
      );
    } catch (err) {
      debug(err.stack);
    }

    next();
  }


  async function renderVideoPlayer(req, res, next) {
    debug('renderVideoPlayer');

    try {
      res.render(
        'video-player'
      );
    } catch (err) {
      debug(err.stack);
    }

    next();
  }

  
  async function downloadVideo(req, res) {
    debug('downloadVideo');
    
    try { 
      res.download(req.body.videoDl, (error) => {
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


  return {
    checkDirHashExists,
    readFullPhotosDirectory,
    createFullPhotosDirectoryHash,
    writeDirectoryHashToFile,
    compareLastAndFileHash,
    populatePhotosDatabase,
    getPhotosFromDbToArray,
    renderPage,
    archivePhotos,
    downloadChosenPhotos,
    renderPageNew,
    renderVideoPlayer,
    downloadVideo
  };
};