const debug = require('debug')('app:otherController');

module.exports = function otherController() {
  async function renderMainPage(req, res, next) {
    debug('renderMainPage');

    try {
      res.render(
        'main-page'
      );
    } catch (err) {
      debug(err.stack);
    }

    next();
  }
  
  
  async function renderVideoPlayer(req, res, next) {
    debug('renderVideoPlayer');

    try {
      res.render(
        'video-player'
      );
    } catch (err) {
      debug(err.stack);
    }

    next();
  }
  
  
  return {
    renderMainPage,
    renderVideoPlayer,
  };
};