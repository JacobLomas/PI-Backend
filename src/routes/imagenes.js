const express = require("express");
const router = express.Router();

router.get("/articulos/:nombre", async (req, res)=>{
    res.sendFile(process.cwd()+"/images/articulos/"+req.params.nombre)
})
router.get("/perfiles/:nombre", async (req, res)=>{
    res.sendFile(process.cwd()+"/images/perfiles/"+req.params.nombre)
})





module.exports = router;