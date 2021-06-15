const middlewares = require('../middlewares/authJWT')
const express = require("express");
const router = express.Router();

router.get('/success', async (req, res) => {
    console.log('WEEEEEEEEEEEE')
    res.redirect('http://localhost:8080/')
})




module.exports = router;