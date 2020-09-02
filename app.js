const express = require('express');
const debug = require('debug')('app');
const morgan = require('morgan');
const path = require('path');
const bodyParser = require('body-parser');
const albumRouter = require('./src/routes/albumRoutes');

const app = express();
const port = process.env.PORT || 5100;

app.use(morgan('tiny'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, '/public/')));


app.set('views', path.join(__dirname, 'src', 'views'));
app.set('view engine', 'pug');

app.use('/album', albumRouter());

app.get('/', (req, res) => {
  res.render('layout');
});

app.listen(port, () => {
  debug(`listening on port ${port}`);
});
