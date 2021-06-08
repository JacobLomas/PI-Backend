const jwt = require('jsonwebtoken');
const config = require('../jwconfig');
const pool = require("../database");

exports.verifyToken = async (req, res, next) => {
    try {
        const token = req.headers["x-access-token"]
        if (!token) return res.status(403).json({
            success: false,
            description: "No token available"
        });
        const decoded = jwt.verify(token, config.SECRET);
        const user = await pool.query(
            "SELECT xnombre, xmail, xrol FROM clientes WHERE xcliente_id = ?", 
            [decoded.id]
        );
        if (user.length == 0) return res.status(404).json({
            success: false,
            descripcion: "No se ha encontrado al usuario"
        })
        req.userID = decoded.id
        next();
    } catch (error) {
        console.log(error)
        return res.status(401).json({
            success: false,
            descripcion: "No autorizado",
            error: error
        })
    }
}

exports.isAdministrador = async (req, res, next) => {
    const user = await pool.query(
        "SELECT xnombre, xmail, xrol FROM clientes WHERE xcliente_id = ?",
        [req.userID]
    );
    if (user[0].xrol != 1){
        return res.status(401).json({
            success: false,
            descripcion: "No está autorizado"
        })
    }
    next();
}