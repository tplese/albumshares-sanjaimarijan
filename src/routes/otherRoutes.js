const express = require('express');
const otherController = require('../controllers/otherController');

const otherRouter = express.Router();

module.exports = function router() {
  const {
    renderMainPage,
    renderVideoPlayer,
  } = otherController();

  otherRouter.route('/')
    .get(renderMainPage);

  otherRouter.route('/video')
    .get(renderVideoPlayer);

  return otherRouter;
};