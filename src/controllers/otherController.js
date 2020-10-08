const debug = require('debug')('app:albumController');

module.exports = function albumController() {
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
  
  
  async function downloadVideo(req, res) {
    debug('downloadVideo');
    
    try { 
      res.download(req.body.videoDl, (error) => {
        if (error) {
          debug(`Error: ${error}`)
        } else {
          debug('Successful download!');
        };
      });
    } catch (err) {
      debug(err.stack);
    }
  }


  return {
    renderVideoPlayer,
    downloadVideo
  };
};