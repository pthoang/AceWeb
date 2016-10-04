var express = require('express');
var router = express.Router();
//var url = 'http://acepi.herokuapp.com';
var url = 'http://acepi-test2.herokuapp.com';
//var url = 'http://10.22.32.75:3000';

router.post('/', function(req, res) {
    res.send(url)
});

module.exports = router;