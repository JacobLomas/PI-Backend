const User = require('../models/User.js');
const express = require('express');
const router = express.Router();
const pool = require("../database");

router.post("/login", async (req, res) => {
  //Comprobamos si se han informado los campos de contraseña y de email
  if(!req.body.mail || !req.body.password){
    res.status(400).json({
      success: false, 
      token:null, 
      descripcion: "No ha ingresado el correo electrónico o la contraseña"
    })
  }
  const login = await User.login(req.body.mail, req.body.password)
  if(login.success) {
    await pool.query("UPDATE clientes set xultima_conexion=NOW() WHERE xcliente_id = ?", [login.id]);
    res.status(200).json(login)
  }
  else res.status(400).json(login)
});

router.post('/signup', async (req, res) => {
  const user = req.body;
  const existe = await User.existeClienteByMail(user.mail);
  if (existe) {
    res.status(400).json({
      success:false,
      token:null,
      description: "El email ya está registrado"
    });
  } else {
    const signup = await User.signup(user);
    if (signup.error) {
      console.log(signup.error)
      res.status(400).json(signup)
    } else {
      res.status(200).json(signup)
    }

  }
})

router.get('/esAdministrador', async (req, res) => {
  console.log(req.headers)
  console.log(req.body)
  const token = req.headers["x-access-token"];
  var descripcion="No se ha informado el token";
  if(token){
    var esAdmin;
    try{
      esAdmin = await User.esAdministrador(token);
      console.log(esAdmin)
    }catch(e){
      res.send({
        success: false,
        esAdministador: esAdmin,
        descripcion: "No eres administrador"
      })
      return;
    }
    
    if(esAdmin) { descripcion = "Eres administrador" }
    else        { descripcion = "No eres administrador" }
    res.send({
      success: true,
      esAdministador: esAdmin,
      descripcion: descripcion
    })
    return;
  }else{
    res.send({
      success:false,
      esAdministrador:false,
      descripcion: descripcion
    })
  }
})



module.exports = router;