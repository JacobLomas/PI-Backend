const jwt = require('jsonwebtoken');
const config = require('../jwconfig');
const pool = require("../database");
var bcrypt = require("bcryptjs");
class User {
    async signup(user) {
        console.log(user)
        //===========================================================
        //Insert
        var sql = "INSERT INTO clientes (xnombre, xapellidos, xmail, xcontraseña,";
        sql += "xtelf, xfecha_nacimiento, ximagen, xdireccion) VALUES (?,?,?,?,?,?,?,?)";

        //Comprobaciones
        if (!this.checkNombreyApellidos(user.nombre, user.apellidos)) {
            return {
                error: "Nombre y/o apellidos inválidos"
            }
        }
        if (!this.checkMail(user.mail) || !user.mail) {
            return {
                error: "Correo electrónico inválido"
            }
        }
        if (!this.checkPassword(user.password) || !user.password) {
            return {
                error: "Contraseña no válida"
            }
        } else {
            user.password = await this.encryptPassword(user.password);
        }
        if (!this.checkTelf(user.telf) || !user.telf) {
            return {
                error: "Número de teléfono inválido"
            }
        }
        if (!this.checkDate(user.fechaNacimiento) || !user.fechaNacimiento) {
            return {
                error: "Fecha de nacimiento inválida"
            }
        } else {
            user.fechaNacimiento = new Date(user.fechaNacimiento)
        }
        if (!user.imagen) {
            user.imagen = "/imagenes/generalProfile.jpg";
        }

        //Query
        const oRes = await pool.query(
            sql,
            [user.nombre, user.apellidos, user.mail, user.password, user.telf, user.fechaNacimiento, user.imagen, user.direccion]
        );
        if (oRes.insertId) {
            var user = await this.getUser(oRes.insertId);
            
            const token = jwt.sign({
                id: oRes.insertId,
                rol: user.xrol
            }, config.SECRET, {
                expiresIn: 86400 //24 horas
            });            
            
            return {
                success: true,
                token: token,
                nombre: user.xnombre,
                id: user.xcliente_id,
                img: user.ximagen,
                descripcion: "Bienvenido a la familia"
            }
        }//if (oRes.insertId)

        return {
            success:false, 
            token:null,
            descripcion:"No se ha podido registrar"
        }
    }
    async login(email, password) {
        const user = await this.existeClienteByMail(email);
        if (user) {
            const matchPassword = await this.comparePassword(password, user.xcontraseña);
            if (matchPassword) {
                const {ximagen} = await this.getUser(user.xcliente_id)
                const token = await jwt.sign({id: user.xcliente_id, rol: user.xrol}, config.SECRET)
                pool.query("UPDATE clientes set xultima_conexion = NOW() WHERE xcliente_id=?", [user.xcliente_id])
                return {
                    success: true,
                    token: token,
                    nombre: user.xnombre,
                    id: user.xcliente_id,
                    img: ximagen,
                    descripcion: "Bienvenido de nuevo " + user.xnombre
                }
            } else {
                return {
                    success: false,
                    token: null,
                    descripcion: "La contraseña es incorrecta, vuelva a intentarlo"
                }
            }

        }//if (user)
        else {
            return {
                success: false,
                token: null,
                descripcion: "El usuario no existe en la base de datos"
            }
        }

    }
    checkNombreyApellidos(nombre, apellidos) {
        // Cualquier letra min 5 max 30 caracteres
        const regexp = /^[a-zA-Z]{2,30}$/;
        return regexp.test(nombre) && regexp.test(apellidos)
    }
    checkMail(mail) {
        const regexp = /^(?:[^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*|"[^\n"]+")@(?:[^<>()[\].,;:\s@"]+\.)+[^<>()[\]\.,;:\s@"]{2,63}$/i;
        return regexp.test(mail);
    }
    checkPassword(pass) {
        //Cualquier cosa mayor o igual que 4 y menor o igual que 30
        if (pass)
            return pass.length <= 30 && pass.length >= 4;
        else
            return false
    }
    checkTelf(telf) {
        //Que sea todo números, que empiece por 7 o 6 y que tenga 8 caractéres
        const regex = /^[76]{1}[0-9]{8}$/;
        return regex.test(telf);
    }
    checkDate(date) {
        //dd/mm/yyyy, dd-mm-yyyy or dd.mm.yyyy
        const regex = /^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[13-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/;
        return regex.test(date);
    }
    async encryptPassword(password) {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    }
    async comparePassword(password, receivedPasswords) {
        return await bcrypt.compare(password, receivedPasswords);
    }
    async existeClienteByMail(email) {
        const sql = "SELECT xcliente_id, xmail, xcontraseña, xnombre FROM clientes WHERE xmail = ?";
        const existe = await pool.query(sql, [email]);
        if (existe.length > 0) {
            return existe[0];
        } else {
            return false;
        }
    }
    async getUser(id){
        const sql = "SELECT * FROM clientes WHERE xcliente_id = ?";
        const user = await pool.query(sql, [id]);
        if (user.length > 0) {
            return user[0];
        } else {
            return false;
        }
    }
    async esAdministrador(token){
        const decoded = jwt.verify(token, config.SECRET);
        console.log(decoded)
        const rol = await pool.query("SELECT xrol FROM clientes WHERE xcliente_id = ?",[decoded.id])
        console.log(rol)
        return rol[0].xrol == 1
    }
}
const user = new User()
module.exports = user;