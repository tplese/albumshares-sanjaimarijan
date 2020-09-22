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
    )
    .post(renderPage);

  albumRouter.route('/download').get(downloadChosenPhotos);

/*
  albumRouter.route('/download').get((req, res) => {
    //response.setHeader("Content-Type", "text/pdf");
    res.download('img1.jpg');
  });
*/

  return albumRouter;
};