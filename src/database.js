const mysql = require('mysql');
//Promisify permite convertir las consultas en promesas
const {promisify} = require('util');

const { database } = require('./keys')
//Conexion a la base de datos más adecuada para el desarrollo
const pool = mysql.createPool(database);

// Se ejecuta el metodo getConnection para que no lo tengamos
// que usar todo el rato a la hora de acceder a la base de datos
pool.getConnection((error, connection)=>{
    if(error){
        if(error.code == 'PROTOCOL_CONNECTION_LOST'){
            console.error('Se perdió la conexión a la base de datos')
        }
        if(error.code == 'ER_CON_COUNT_ERROR'){
            console.error('La base de datos tiene demasiadas conexiones')
        }
        if(error.code == 'ECONNREFUSED'){
            console.error('La conexión a la base de datos fue rechazada')
        }    
    }
   
    //Si no se obtiene error, se consigue la conexión
    if(connection) {
        connection.release()
    }
    console.log('Se ha conectado a la base de datos');
    return;
});

// Creo una propiedad en el objeto pool 
// que usaré para hacer las consultas a la base de datos con una promesa
pool.query = promisify(pool.query);

module.exports = pool;