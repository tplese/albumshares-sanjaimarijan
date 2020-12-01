const express = require('express');
const debug = require('debug')('app');
const morgan = require('morgan');
const path = require('path');
const bodyParser = require('body-parser');
const albumRouter = require('./src/routes/albumRoutes');
const album2Router = require('./src/routes/album2Routes');
const otherRouter = require('./src/routes/otherRoutes');

const app = express();
const port = process.env.PORT || 8080;

app.use(morgan('tiny'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

app.set('views', path.join(__dirname, 'src', 'views'));
app.set('view engine', 'pug');

app.use('/', otherRouter());
app.use('/album', albumRouter());
app.use('/album2', album2Router());

app.listen(port, () => {
  debug(`listening on port ${port}`);
});


