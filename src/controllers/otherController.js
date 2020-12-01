const debug = require('debug')('app:otherController');
const path = require('path');
// Imports the Google Cloud client library
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();
const bucket = storage.bucket('martinaidavorin_bucket');

module.exports = function otherController() {
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
  
  
  async function downloadVideo(req, res, next) {
    debug('downloadVideo');
    
    try {
      
      /*
      const fs = require('fs');
      const remoteFile = bucket.file('photos.txt');
      const localFilename = path.join(__dirname, 'download.txt');

      remoteFile.createReadStream()
        .on('error', function(err) {
          debug(err.stack);
        })
        .on('response', function(response) {
          for (item in response) {
            //debug(`response: ${item}`);
          };
        })
        .on('end', function() {
          // The file is fully downloaded.
        })
        .pipe(fs.createWriteStream(localFilename));
      */

      /*
      res.download(req.body.videoDl, (error) => {
        debug(`videoDl: ${req.body.videoDl}`);

        if (error) {
          debug(error.stack)
        } else {
          debug('Successful download!');
        };
      });
      */
    } catch (err) {
      debug(err.stack);
    }
  }


  return {
    renderVideoPlayer,
    downloadVideo
  };
};