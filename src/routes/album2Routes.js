const express = require('express');
const album2Controller = require('../controllers/album2Controller');

const album2Router = express.Router();

module.exports = function router() {
  const {
    checkDirHashExists,
    readFullPhotosDirectory,
    createFullPhotosDirectoryHash,
    writeDirectoryHashToDb,
    populatePhotosDatabase,
    getPhotosFromDbToArray,
    renderPageNew,
  } = album2Controller();

  album2Router.route('/')
    .get(
      checkDirHashExists,
      readFullPhotosDirectory,
      createFullPhotosDirectoryHash,
      writeDirectoryHashToDb,
      populatePhotosDatabase,
      getPhotosFromDbToArray,
      renderPageNew
    );

  return album2Router;
};
