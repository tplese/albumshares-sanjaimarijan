const express = require('express');
const albumController = require('../controllers/albumController');

const albumRouter = express.Router();

module.exports = function router() {
  const {
    checkDirHashExists,
    readFullPhotosDirectory,
    createFullPhotosDirectoryHash,
    writeDirectoryHashToDb,
    populatePhotosDatabase,
    getPhotosFromDbToArray,
    renderPageNew,
  } = albumController();

  albumRouter.route('/')
    .get(
      checkDirHashExists,
      readFullPhotosDirectory,
      createFullPhotosDirectoryHash,
      writeDirectoryHashToDb,
      populatePhotosDatabase,
      getPhotosFromDbToArray,
      renderPageNew
    );

  return albumRouter;
};