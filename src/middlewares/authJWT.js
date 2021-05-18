import jwt from 'jsonwebtoken';
import config from '../jwconfig';
const pool = require("../database");

export const verifyToken = async (req, res, next) => {
    try {
        const token = req.heders["x-access-token"]
        if (!token) return res.status(403).json({
            success: false,
            description: "No token available"
        });
        const decoded = jwt.verify(token, config.SECRET);
        const user = await pool.query("SELECT xnombre, xmail, xrole_id FROM cliente WHERE xcliente_id = ?", decoded.id);
        if (user.length == 0) return res.status(404).json({
            success: false,
            descripcion: "No se ha encontrado al usuario"
        })
        req.userID = decoded.id
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            descripcion: "No autorizado"
        })
    }
}

export const isAdministrador = async (req, res, next) => {
    const user = await pool.query("SELECT xnombre, xmail, xrol FROM clientes WHERE xcliente_id = ?", req.userID);
    if (user[0].xrol != 1) return res.status(401).json({
        success: false,
        descripcion: "No está autorizado"
    })
    next();
}