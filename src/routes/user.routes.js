const middlewares = require('../middlewares/authJWT')
const express = require("express");
const router = express.Router();
const paypal = require('paypal-rest-sdk');
const nodemailer = require('nodemailer')
const {
    paypalOpts
} = require('../keys')

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': paypalOpts.client_id,
    'client_secret': paypalOpts.client_secret
});

const pool = require("../database");

router.post('/nuevoFavorito/:idArt', middlewares.verifyToken, async (req, res) => {
    console.log(req.userID)
    var userId = req.userID;
    var articuloID = req.params.idArt;
    try {
        userId = Number.parseInt(userId);
        articuloID = Number.parseInt(articuloID)
        const result = await pool.query(
            "INSERT INTO favoritos (xcliente_id, xarticulo_id) VALUES (?, ?)",
            [userId, articuloID]
        );
        res.json({
            success: true,
        });
    } catch (err) {
        console.log(err)
        res.status(400).json({
            success: false,
            descripcion: err
        })
    }

})

router.post('/nuevoPedido', middlewares.verifyToken, async (req, res) => {
    if (!req.body.pedido || req.body.pedido.lineas.length < 0) {
        res.status(400).json({
            success: false,
            descripcion: "Faltan parámetros de entrada"
        })
        return;
    }
    try {
        var pedido = req.body.pedido;
        var purchase_units = [{
            description: 'Gastos de envío',
            reference_id: -1,
            amount: {
                currency_code: "EUR",
                value: 3.99
            }
        }];

        SQL = `INSERT INTO pedidos (xcliente_id, xpedido_fecha, xtotal) 
        VALUES (?, NOW(), ?)`;
        const insertCabecera = await pool.query(SQL, [req.userID, pedido.total])
        const idCabecera = insertCabecera.insertId;
        for (let i = 0; i < pedido.lineas.length; i++) {
            SQL = `INSERT INTO pedidos_lineas 
                (xpedido_id, xarticulo_id, xcantidad, xporc_dto, xsubtotal)
                VALUES (?, ?, ?, ?, ?)`
            await pool.query(SQL, [idCabecera, pedido.lineas[i].xarticulo_id, pedido.lineas[i].xcantidad, pedido.lineas[i].xporc_dto, pedido.lineas[i].xsubtotal])
            let articulo = await pool.query('SELECT xarticulo_id, xnombre, xprecio FROM articulos WHERE xarticulo_id = ? ', [pedido.lineas[i].xarticulo_id])
            let unit = {
                description: articulo[0].xnombre,
                reference_id: articulo[0].xarticulo_id,
                amount: {
                    currency_code: "EUR",
                    value: articulo[0].xprecio
                }
            };
            purchase_units.push(unit);
        }
        /* 
                pedido.lineas.forEach(async (linea) => {
                    SQL = `INSERT INTO pedidos_lineas 
                        (xpedido_id, xarticulo_id, xcantidad, xporc_dto, xsubtotal)
                        VALUES (?, ?, ?, ?, ?)`
                    await pool.query(SQL, [idCabecera, linea.xarticulo_id, linea.xcantidad, linea.xporc_dto, linea.xsubtotal])
                    let articulo = await pool.query('SELECT xnombre, xdescripcion FROM articulos WHERE xarticulo_id = ? ',[linea.xarticulo_id])
                    let unit = {
                        description: articulo[0].xnombre,
                        amount: {
                            currency_code: "EUR",
                            value: articulo[0].xprecio
                        }
                    };
                    purchase_units.push(unit);
                }); */
        console.log(purchase_units);
        res.json({
            success: true,
            descripcion: 'Pedido creado, pendiente de pago',
            purchase_units: purchase_units,
            id_pedido: idCabecera
        })


    } catch (error) {
        console.log(error)
        res.status(400).json({
            success: false,
            descripcion: "Petición mala"
        })
    }
})

router.post('/pagarPedido/:idPedido', middlewares.verifyToken, async (req, res) => {
    const idPedido = req.params.idPedido;
    const idCliente = req.userID;
    const idPago = req.body.paypalOrder.id
    if (!idPedido || !idCliente || !idPago) {
        res.status(402).json({
            success: false,
            descripcion: "No tienes permisos suficientes"
        })
    }
    verifyCliente = await pool.query('SELECT xcliente_id FROM pedidos WHERE xpedido_id = ?', [idPedido]);
    if (!verifyCliente[0].xcliente_id || verifyCliente[0].xcliente_id != idCliente) {
        res.status(402).json({
            success: false,
            descripcion: "No tienes permisos suficientes"
        })
    }
    pool.query('UPDATE pedidos SET xpagado = true, xid_pago= ? WHERE xpedido_id = ?', [idPago, idPedido])
    var transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: "nodemailerjs10@gmail.com",
          pass: "Password10_"
        }
      })
    res.json({
        success: true,
        descripcion: 'Pedido pagado con exito'
    })

})

router.post('/puntuarArticulo', middlewares.verifyToken, async (req, res) => {
    let idArticulo, puntuacion, userId;
    if (!req.body.idArticulo || !req.body.puntos) {
        return res.status(400).json({
            success: false,
            descripcion: "Faltan parámetros de entrada"
        });
    }
    idArticulo = req.body.idArticulo;
    puntuacion = req.body.puntos;
    userId = req.userID;

    let existe = await pool.query('SELECT COUNT(*) AS existe FROM puntuaciones WHERE xarticulo_id=? AND xcliente_id = ?', [idArticulo, userId]);
    if (existe[0].existe == 0) {
        await pool.query("INSERT INTO puntuaciones (xarticulo_id, xcliente_id, xpuntuacion, xfecha_puntuacion) VALUES (?, ? , ?, NOW())",
            [idArticulo, userId, puntuacion]
        )
        res.json({
            success: true,
            descripcion: 'Puntuación guardada'
        })
    } else {
        await pool.query("UPDATE puntuaciones SET xfecha_puntuacion = NOW(), xpuntuacion = ? WHERE xcliente_id = ? AND xarticulo_id = ?",
            [puntuacion, userId, idArticulo]
        )
        res.json({
            success: true,
            descripcion: 'Puntuación guardada'
        })
    }


})

router.post('/toggleFavorito/:idArticulo', middlewares.verifyToken, async (req, res) => {
    var idArticulo;
    if (!req.params.idArticulo) {
        return res.status(400).json({
            success: false,
            descripcion: "Faltan parámetros de entrada"
        });
    }
    idArticulo = req.params.idArticulo;

    let existe = await pool.query('SELECT COUNT(*) AS existe FROM favoritos WHERE xcliente_id = ? AND xarticulo_id = ?',
        [req.userID, idArticulo]
    )
    if (existe[0].existe == 0) {
        await pool.query('INSERT INTO favoritos (xarticulo_id, xcliente_id) VALUES (?,?)',
            [idArticulo, req.userID]
        )
        return res.json({
            success: true,
            descripcion: 'Articulo añadido a favoritos',
            favorito: true
        })
    } else {
        await pool.query('DELETE FROM favoritos WHERE xarticulo_id = ? AND xcliente_id = ?',
            [idArticulo, req.userID]
        )
        return res.json({
            success: true,
            descripcion: 'Eliminado de favoritos',
            favorito: false
        })
    }
})

router.get("/usuario", middlewares.verifyToken, async (req, res) => {
    try {
        let usuario = await pool.query("SELECT xcliente_id, xnombre, xapellidos, xmail, xtelf, xfecha_nacimiento, ximagen, xdireccion FROM clientes WHERE xcliente_id = ?",
            [req.userID]
        );
        res.json({
            success: true,
            descripcion: "Usuario encontrado",
            usuario: usuario[0]
        })
    } catch (e) {
        res.status(500)
    }
})
router.post("/actualizarUsuario", middlewares.verifyToken, async (req, res) => {
    if (!req.body.usuario) {
        return res.status(400).send()
    }
    var usuario = req.body.usuario;
    delete usuario.xfecha_nacimiento
    try {
        await pool.query(
            `UPDATE clientes 
            SET ?
            WHERE xcliente_id = ?`,
            [usuario, req.userID]
        )
    } catch (e) {
        console.log(e)
        return res.status(500).send()
    }
    res.send({
        success: true,
        descripcion: "Usuario actualizado",
        usuario: usuario
    })

})
router.post("/actualizarFoto", middlewares.verifyToken, async (req, res) => {
    let sampleFile;
    let uploadPath;

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send({
            success: false,
            descripcion: 'No se ha subido ninguna imagen'
        });
    }

    sampleFile = req.files.image;
    uploadPath = process.cwd() + '/images/perfiles/' + sampleFile.name;
    console.log(uploadPath)
    // Use the mv() method to place the file somewhere on your server
    sampleFile.mv(uploadPath, function (err) {
        if (err)
            return res.status(500).send(err);

        pool.query("UPDATE clientes SET ximagen = ? WHERE xcliente_id = ?", ['/images/perfiles/' + sampleFile.name, req.userID])
        res.send({
            success: true,
            descripcion: 'Imagen subida con éxito',
            url: '/images/perfiles/' + sampleFile.name
        });
    });
})

router.post('/eliminarFoto', middlewares.verifyToken, async (req, res) => {
    let defaultImg = "/images/perfiles/___default___.png";
    try {
        await pool.query("UPDATE clientes SET ximagen = ? WHERE xcliente_id = ?", [defaultImg, req.userID]);
    } catch (e) {
        res.status(500).send()
    }
    res.json({
        success: true,
        descripcion: 'Imagen eliminada',
        url: defaultImg
    })
})

router.get("/favoritos", middlewares.verifyToken, async (req, res) => {
    try {
        var favoritos = await pool.query(`SELECT art.* , f.xdescripcion as descFam, subf.xdescripcion as descSubF
        FROM articulos art join favoritos fav ON art.xarticulo_id = fav.xarticulo_id,
         familia f, subfamilia subf
        WHERE fav.xcliente_id = ? 
        AND art.xfamilia_id = f.xfamilia_id 
        AND art.xsubfamilia_id = subf.xsubfamilia_id`, [req.userID])
        res.json({
            success: true,
            descripcion: "Favoritos encontrados",
            favoritos: favoritos
        })
    } catch (e) {
        res.status(500).send()
    }
})

router.get("/misPedidos", middlewares.verifyToken, async (req, res) => {
    var pedidosCabs;
    var pedidosLins = [];
    var pedidos = [];
    try {
        pedidosCabs = await pool.query("SELECT p.*, c.xnombre, c.xdireccion FROM pedidos p join clientes c ON p.xcliente_id = c.xcliente_id WHERE p.xcliente_id = ?", [req.userID])
        for (let i = 0; i < pedidosCabs.length; i++) {
            pedidosLins = await pool.query(`
            SELECT pl.*, a.xnombre AS nombreArt, a.xprecio AS precio, a.ximagen AS imagen
            FROM pedidos_lineas pl LEFT JOIN articulos a ON a.xarticulo_id=pl.xarticulo_id
            WHERE xpedido_id = ?`,
                [pedidosCabs[i].xpedido_id]
            );
            pedidos.push({
                cabecera: pedidosCabs[i],
                lineas: pedidosLins
            })
        }
        res.json({
            success: true,
            descripcion: "Estos son los pedidos encontrados",
            pedidos: pedidos
        })
    } catch (e) {
        res.status(500).send()
    }
})


var bcrypt = require("bcryptjs");
router.post("/actualizarContrasena", middlewares.verifyToken, async (req, res) => {
    if (!req.body.antigua && !req.body.nueva) {
        res.status(400).send()
    }
    var antigua = req.body.antigua;
    var nueva = req.body.nueva;
    try {
        const tablePass = await pool.query("SELECT xcontraseña AS pass FROM clientes WHERE xcliente_id = ?",
            [req.userID]
        )
        if (await bcrypt.compare(antigua, tablePass[0].pass)) {
            const salt = await bcrypt.genSalt(10);
            nueva = await bcrypt.hash(nueva, salt);
            await pool.query("UPDATE clientes SET xcontraseña = ? WHERE xcliente_id = ?",
                [nueva, req.userID]
            )
            res.json({
                success: true,
                descripcion: "Constraseña actualizada"
            })
        }else{
            res.json({
                success:false,
                descripcion:"La contraseña no es correcta"
            })
        }
    } catch (e) {
        return res.status(500).send()
    }

})

module.exports = router;