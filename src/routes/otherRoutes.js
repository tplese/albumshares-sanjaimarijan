const express = require('express');
const otherController = require('../controllers/otherController');

const otherRouter = express.Router();

module.exports = function router() {
  const {
    renderVideoPlayer,
    downloadVideo
  } = otherController();

  otherRouter.route('/').get((req, res) => {
    res.render('main-page');
  });

  otherRouter.route('/video')
    .get(renderVideoPlayer);

  otherRouter.route('/download')
    .post(downloadVideo);

  return otherRouter;
};