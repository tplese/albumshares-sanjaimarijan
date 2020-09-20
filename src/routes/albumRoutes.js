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
    downloadChosenPhotos
  } = albumController();

  albumRouter.route('/')
    .get(
      readFullPhotosDirectory, 
      createFullPhotosDirectoryHash, 
      compareLastAndFileHash, 
      populatePhotosDatabase, 
      getPhotosFromDbToArray, 
      renderPage)
    .post(downloadChosenPhotos, renderPage)

  return albumRouter;
};