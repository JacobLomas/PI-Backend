const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');


const morgan = require('morgan');
const path = require('path');

const app=express();

//Configuración del servidor
app.set('port', process.env.PORT || 8000);/* 
app.set('views', path.join(__dirname, 'views')); */


//Middlewares
app.use(morgan('dev'));
app.use(fileUpload({
    preserveExtension:true
}));
app.use(cors());
app.use(express.urlencoded({extended:false}));
app.use(express.json());
//Variables globales
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});
app.use(function(req, res, next) {
    res.sendFile(path.join(__dirname, 'public'));
  });
//Rutas
const middlewares = require('./middlewares/authJWT')

app.use('/api/auth', require('./routes/authentication'));
app.use('/api', require('./routes/api'));
app.use('/admin',middlewares.verifyToken, middlewares.isAdministrador,require('./routes/adminRoutes'));
app.use('/api/user', require('./routes/user.routes'));
app.use('/images', require('./routes/imagenes'))

//Carpeta Public
app.use(express.static(path.join(__dirname, 'public')))
//El servidor arranca
app.listen(app.get('port'), ()=>{
    console.log('Servidor en el puerto:'+app.get('port'))
})