var express = require('express');
var router = express.Router();
//var url = 'http://acepi.herokuapp.com';
var url = 'http://ace-app.herokuapp.com';

router.post('/', function(req, res) {
    res.send(url)
});

module.exports = router;