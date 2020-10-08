const express = require('express');
const albumController = require('../controllers/albumController');

const albumRouter = express.Router();

module.exports = function router() {
  const {
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
  } = albumController();

  /*
  albumRouter.route('/albumold')
    .get(
      readFullPhotosDirectory,
      createFullPhotosDirectoryHash,
      compareLastAndFileHash,
      populatePhotosDatabase,
      getPhotosFromDbToArray,
      renderPage 
    );
  
  albumRouter.route('/download').post(archivePhotos, downloadChosenPhotos);
*/  

  albumRouter.route('/')
    .get(
      checkDirHashExists,
      readFullPhotosDirectory,
      createFullPhotosDirectoryHash,
      writeDirectoryHashToFile,
      populatePhotosDatabase,
      getPhotosFromDbToArray,
      renderPageNew
    );

  return albumRouter;
};