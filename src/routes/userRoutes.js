const middlewares = require('../middlewares/authJWT')
const express = require("express");
const router = express.Router();

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
    if (!req.body.pedido || req.body.pedido.lineas.length<0){
        res.status(400).json({
            success: false,
            descripcion: "Faltan parámetros de entrada"
        })
        return;
    }
    try {
        var pedido = req.body.pedido;
        SQL = `INSERT INTO pedidos (xcliente_id, xpedido_fecha, xpendiente_entrega, xtotal) 
        VALUES (?, NOW(), 0, ?)`;
        const insertCabecera = await pool.query(SQL, [req.userID, pedido.total])
        var idCabecera = insertCabecera.insertId;
        pedido.lineas.forEach((linea)=>{
            SQL = `INSERT INTO pedidos_lineas 
            (xpedido_id, xarticulo_id, xcantidad, xporc_dto, xsubtotal)
            VALUES (?, ?, ?, ?, ?)`
            pool.query(SQL, [idCabecera, linea.xarticulo_id, linea.xcantidad, linea.xporc_dto, linea.xsubtotal])
        })
    } catch (error) {
        res.status(400).json({
            success:false,
            descripcion: "Petición mala"
        })
    }
    res.send({
        success:true,
        descripcion: 'Pedido realizado con exito'
    })

})

module.exports = router;