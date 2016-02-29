var express = require('express');
var router = express.Router();
var url = 'http://acepi.herokuapp.com';

/* GET home page. */
router.post('/', function(req, res) {
    res.send(url)
});

module.exports = router;