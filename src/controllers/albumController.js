//const SshClient = require('ssh2-sftp-client');
const debug = require('debug')('app:albumController');

module.exports = function albumController() {
  async function readPhotoDirectory(req, res, next) {

    next();
  }

  async function renderPage(req, res, next) {
    next();
  }

  return {
    readPhotoDirectory,
    renderPage,
  };
};