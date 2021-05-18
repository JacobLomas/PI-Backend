const User = require('../models/User.js');
const express = require('express');
const router = express.Router();
/* const pool = require("../database"); */

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
  if(login.success) res.status(200).json(login)
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
    const token = await User.signup(user);
    if (token.error) {
      res.status(400).json(error)
    } else {
      res.status(200).json({
        success: true,
        token: token,
        descripcion: "Usuario registrado!"
      })
    }

  }
})



module.exports = router;