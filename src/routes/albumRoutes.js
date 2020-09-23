const express = require('express');
const albumController = require('../controllers/albumController');

const albumRouter = express.Router();

module.exports = function router() {
  const {
    readFullPhotosDirectory,
    createFullPhotosDirectoryHash,
    compareLastAndFileHash,
    populatePhotosDatabase,
    getPhotosFromDbToArray,
    renderPage,
    archivePhotos,
    downloadChosenPhotos,
    renderPageNew
  } = albumController();

  albumRouter.route('/').get((req, res) => {
    res.render('main-page');
  });

  albumRouter.route('/album')
    .get(
      readFullPhotosDirectory,
      createFullPhotosDirectoryHash,
      compareLastAndFileHash,
      populatePhotosDatabase,
      getPhotosFromDbToArray,
      renderPage 
    );
    
  albumRouter.route('/fotonew')
    .get(
      readFullPhotosDirectory,
      createFullPhotosDirectoryHash,
      compareLastAndFileHash,
      populatePhotosDatabase,
      getPhotosFromDbToArray,
      renderPageNew
    );

  albumRouter.route('/download').post(archivePhotos, downloadChosenPhotos);

  return albumRouter;
};