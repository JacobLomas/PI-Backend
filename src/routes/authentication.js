const User = require('../models/User.js');
const express = require('express');
const router = express.Router();
const pool = require("../database");
const nodemailer = require('nodemailer')

router.post("/login", async (req, res) => {
  //Comprobamos si se han informado los campos de contraseña y de email
  if (!req.body.mail || !req.body.password) {
    res.status(400).json({
      success: false,
      token: null,
      descripcion: "No ha ingresado el correo electrónico o la contraseña"
    })
  }
  const login = await User.login(req.body.mail, req.body.password)
  if (login.success) {
    await pool.query("UPDATE clientes set xultima_conexion=NOW() WHERE xcliente_id = ?", [login.id]);
    res.status(200).json(login)
  } else res.status(400).json(login)
});

router.post('/signup', async (req, res) => {
  const user = req.body;
  const existe = await User.existeClienteByMail(user.mail);
  if (existe) {
    res.status(400).json({
      success: false,
      token: null,
      description: "El email ya está registrado"
    });
  } else {
    const signup = await User.signup(user);
    if (signup.error) {
      console.log(signup.error)
      res.status(400).json(signup)
    } else {
      res.status(200).json(signup)
      mailBienvenida(user.mail, user.nombre);
    }

  }
})

router.get('/esAdministrador', async (req, res) => {
  console.log(req.headers)
  console.log(req.body)
  const token = req.headers["x-access-token"];
  var descripcion = "No se ha informado el token";
  if (token) {
    var esAdmin;
    try {
      esAdmin = await User.esAdministrador(token);
      console.log(esAdmin)
    } catch (e) {
      res.send({
        success: false,
        esAdministador: esAdmin,
        descripcion: "No eres administrador"
      })
      return;
    }

    if (esAdmin) {
      descripcion = "Eres administrador"
    } else {
      descripcion = "No eres administrador"
    }
    res.send({
      success: true,
      esAdministador: esAdmin,
      descripcion: descripcion
    })
    return;
  } else {
    res.send({
      success: false,
      esAdministrador: false,
      descripcion: descripcion
    })
  }
})







async function mailBienvenida(mail, nombre) {
  var articulosPop = await pool.query('SELECT * FROM articulos ORDER By xvisitas DESC LIMIT 4');
  var articulosHTML = ""
  articulosPop.forEach((articulo) => {
    articulosHTML += `
        <div class="card" style="width:50%">
            <img src="${articulo.ximagen}" class="card-img-top" alt="">
            <div class="card-body">
                <h5 class="card-title">${articulo.xnombre}</h5>
                <p class="card-text">${articulo.xdescripcion}</p>
                <a href="#" class="btn btn-primary">Ir a la tienda</a>
            </div>
        </div>`
  })
  var amp = `<!DOCTYPE html>
    <html ⚡4email>
    
    <head>
    <style>
        .card {
            position: relative;
            display: -ms-flexbox;
            display: flex;
            -ms-flex-direction: column;
            flex-direction: column;
            min-width: 0;
            word-wrap: break-word;
            background-color: #fff;
            background-clip: border-box;
            border: 1px solid rgba(0, 0, 0, 0.125);
            border-radius: 0.25rem;
            margin-left:5%;
        }

        .card>hr {
            margin-right: 0;
            margin-left: 0;
        }

        .card>.list-group {
            border-top: inherit;
            border-bottom: inherit;
        }

        .card>.list-group:first-child {
            border-top-width: 0;
            border-top-left-radius: calc(0.25rem - 1px);
            border-top-right-radius: calc(0.25rem - 1px);
        }

        .card>.list-group:last-child {
            border-bottom-width: 0;
            border-bottom-right-radius: calc(0.25rem - 1px);
            border-bottom-left-radius: calc(0.25rem - 1px);
        }

        .card>.card-header+.list-group,
        .card>.list-group+.card-footer {
            border-top: 0;
        }

        .card-body {
            -ms-flex: 1 1 auto;
            flex: 1 1 auto;
            min-height: 1px;
            padding: 1.25rem;
        }

        .card-title {
            margin-bottom: 0.75rem;
        }

        .card-subtitle {
            margin-top: -0.375rem;
            margin-bottom: 0;
        }

        .card-text:last-child {
            margin-bottom: 0;
        }

        .card-link:hover {
            text-decoration: none;
        }

        .card-link+.card-link {
            margin-left: 1.25rem;
        }

        .card-header {
            padding: 0.75rem 1.25rem;
            margin-bottom: 0;
            background-color: rgba(0, 0, 0, 0.03);
            border-bottom: 1px solid rgba(0, 0, 0, 0.125);
        }

        .card-header:first-child {
            border-radius: calc(0.25rem - 1px) calc(0.25rem - 1px) 0 0;
        }

        .card-footer {
            padding: 0.75rem 1.25rem;
            background-color: rgba(0, 0, 0, 0.03);
            border-top: 1px solid rgba(0, 0, 0, 0.125);
        }

        .card-footer:last-child {
            border-radius: 0 0 calc(0.25rem - 1px) calc(0.25rem - 1px);
        }

        .card-header-tabs {
            margin-right: -0.625rem;
            margin-bottom: -0.75rem;
            margin-left: -0.625rem;
            border-bottom: 0;
        }

        .card-header-pills {
            margin-right: -0.625rem;
            margin-left: -0.625rem;
        }

        .card-img-overlay {
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            padding: 1.25rem;
            border-radius: calc(0.25rem - 1px);
        }

        .card-img,
        .card-img-top,
        .card-img-bottom {
            -ms-flex-negative: 0;
            flex-shrink: 0;
            width: 100%;
        }

        .card-img,
        .card-img-top {
            border-top-left-radius: calc(0.25rem - 1px);
            border-top-right-radius: calc(0.25rem - 1px);
        }

        .card-img,
        .card-img-bottom {
            border-bottom-right-radius: calc(0.25rem - 1px);
            border-bottom-left-radius: calc(0.25rem - 1px);
        }

        .card-deck .card {
            margin-bottom: 15px;
        }
    </style>
        <title>Bienvenida</title>
    </head>
    
    <body>
        <div style="display:flex;flex-flow:row-wrap width:100%">
            <h2>Bienvenido ${nombre}</h2>
            <h3>Los más buscados!</h3>
            <div style="display:flex;flex-flow:row-wrap;width:100%">
                ${articulosHTML}
            </div>
        </div>
    </body>
    </html>`
  var transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: "nodemailerjs10@gmail.com",
      pass: "Password10_"
    }
  })
  var mailOptions = {
    from: "Remitente",
    to: mail,
    subject: 'Registro Bienvenida Tienda',
    html: amp
  }
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error)
    }
    console.log(info)
    console.log(amp)
  })
}

module.exports = router;