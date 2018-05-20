var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/dj', function(req, res, next) {
  res.render('dj', { title: 'Dj' });
});

module.exports = router;
