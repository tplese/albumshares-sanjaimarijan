const express = require('express');
const albumController = require('../controllers/albumController');

const albumRouter = express.Router();

module.exports = function router() {
  const {
    readPhotoDirectory,
    renderPage
  } = albumController();

  albumRouter.route('/')
    .get(readPhotoDirectory, renderPage)

  return albumRouter;
};