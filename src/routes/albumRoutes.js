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
    renderVideoPlayer,
    downloadVideo
  } = albumController();

  albumRouter.route('/').get((req, res) => {
    res.render('main-page');
  });
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

  albumRouter.route('/album')
    .get(
      checkDirHashExists,
      readFullPhotosDirectory,
      createFullPhotosDirectoryHash,
      writeDirectoryHashToFile,
      populatePhotosDatabase,
      getPhotosFromDbToArray,
      renderPageNew
    );

  albumRouter.route('/video')
    .get(renderVideoPlayer);

  albumRouter.route('/download')
    .post(downloadVideo);

  return albumRouter;
};