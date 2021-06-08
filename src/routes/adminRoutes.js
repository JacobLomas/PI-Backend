const express = require("express");
const router = express.Router();

const pool = require("../database");

/**
 * Post nuevo producto
 */
router.post("/nuevoArticulo", async (req, res) => {
    try { //Comprobaciones
        const resultQuery = await pool.query("INSERT INTO articulos SET  ? ", [req.body])
        const SQL = `SELECT a.*, f.xdescripcion AS descFam, sf.xdescripcion AS descSubF 
        FROM articulos a JOIN familia f ON a.xfamilia_id=f.xfamilia_id  
        JOIN subfamilia sf ON a.xsubfamilia_id=sf.xsubfamilia_id AND a.xarticulo_id=?`
        const nuevoArticulo = await pool.query(SQL, [resultQuery.insertId])
        res.send({
            success: true,
            descripcion: "Se ha añadido un nuevo producto",
            nuevoArticulo: nuevoArticulo[0]
        });
    } catch (e) {
        res.status(400).send({
            success: false,
            descripcion: e.sqlMessage
        })
        return;
    }


    return;
});
router.delete('/borrarArticulo/:id', async (req, res) => {
    try { //Comprobaciones
        console.log(req.body)
        await pool.query("DELETE FROM articulos WHERE xarticulo_id =   ? ", [req.params.id])
        res.send({
            success: true,
            descripcion: "Se ha eliminado el articulo",
        });
    } catch (e) {
        res.status(400).send({
            success: false,
            descripcion: e.sqlMessage
        })
        return;
    }


    return;

})

router.post("/actualizarArticulo", async (req, res) => {
    var respuestaJSON = {};
    var id;
    if (!req.body.xarticulo_id) {
        respuestaJSON = {
            success: false,
            descripcion: "Falta el id de referencia"
        };
        res.status(400).json(respuestaJSON);
        return;
    }
    try {
        id = req.body.xarticulo_id;
        delete req.body['xarticulo_id'];
        await pool.query("UPDATE articulos SET ? WHERE xarticulo_id = ?", [req.body, id]);
    } catch (e) {
        respuestaJSON = {
            success: false,
            descripcion: e.sqlMessage
        };
        res.status(400).json(respuestaJSON);
        return;
    }
    try {
        const SQL = `SELECT a.*, f.xdescripcion AS descFam, sf.xdescripcion AS descSubF 
        FROM articulos a JOIN familia f ON a.xfamilia_id=f.xfamilia_id 
        JOIN subfamilia sf ON a.xsubfamilia_id=sf.xsubfamilia_id AND
        a.xarticulo_id = ?`
        const producto = await pool.query(SQL, [id]);
        respuestaJSON = {
            success: true,
            descripcion: producto[0].xnombre + " actualizado correctamente",
            articuloActualizado: producto
        }
    } catch (e) {
        respuestaJSON = {
            success: false,
            descripcion: e.sqlMessage
        }
        res.status(400).json(respuestaJSON);
        return;
    }


    res.json(respuestaJSON);
    return;
})

router.get('/todosArticulos', async (req, res) => {
    try {
        const SQL = `SELECT a.*, f.xdescripcion AS descFam, sf.xdescripcion AS descSubF 
        FROM articulos a LEFT OUTER JOIN familia f ON a.xfamilia_id=f.xfamilia_id 
        LEFT OUTER JOIN subfamilia sf ON a.xsubfamilia_id=sf.xsubfamilia_id`
        const articulos = await pool.query(SQL)
        res.json({
            success: true,
            articulos: articulos
        })
    } catch (e) {
        res.status(500).json({
            success: false,
            descripcion: "Error del servidor"
        })
    }

})
router.get('/subfamilias', async (req, res) => {
    try {
        const SQL = `select *  from subfamilia`
        const subfamilias = await pool.query(SQL)
        res.json({
            success: true,
            subfamilias: subfamilias
        })
    } catch (e) {
        res.status(500).json({
            success: false,
            descripcion: "Error del servidor"
        })
    }

})
router.delete('/borrarSubFamilia/:id', async (req, res) => {
    const SQL = 'DELETE FROM subfamilia WHERE xsubfamilia_id = ?';
    
    try{
        if(req.params.id){
            await pool.query(SQL, [req.params.id])
        }
    }catch(e){
        res.json({
            success:false,
            descripcion: e
        })
    }
    res.json({
        success:true,
        descripcion: 'Subfamilia borrada'
    })
    
})
router.post('/nuevaSubfamilia', async (req, res) => {
    if(!req.body){
        res.status(400).send({
            success:false,
            descripcion: 'Faltan parámetros de entrada'
        })
        return;
    }
    try {
        const SQL = 'INSERT INTO subfamilia (xdescripcion, xfamilia_id) VALUES (?, ?)';
        await pool.query(SQL, [req.body.xdescripcion, req.body.xfamilia_id]);
        res.json({
            success:true,
            descripcion: 'Subfamilia ' + req.body.xdescripcion + ' creada'
        })
    }catch(e){
        res.json({
            success: false,
            descripcion: e.sqlMessage
        })
    }
})

router.get('/familias', async (req, res) => {
    try {
        const SQL = `SELECT * from familia`
        const familias = await pool.query(SQL)
        res.json({
            success: true,
            familias: familias
        })
    } catch (e) {
        res.status(500).json({
            success: false,
            descripcion: "Error del servidor"
        })
    }

})
router.post('/nuevaFamilia', async (req, res) => {
    if(!req.body){
        res.status(400).send({
            success:false,
            descripcion: 'Faltan parámetros de entrada'
        })
        return;
    }
    try {
        const SQL = 'INSERT INTO familia (xdescripcion) VALUES (?)';
        await pool.query(SQL, [req.body.xdescripcion]);
        res.json({
            success:true,
            descripcion: 'Familia ' + req.body.xdescripcion + ' creada'
        })
    }catch(e){
        res.json({
            success: false,
            descripcion: e.sqlMessage
        })
    }
})
router.delete('/borrarFamilia/:id', async (req, res) => {
    const SQL = 'DELETE FROM familia WHERE xfamilia_id = ?';
    
    try{
        if(req.params.id){
            await pool.query(SQL, [req.params.id])
        }
    }catch(e){
        res.json({
            success:false,
            descripcion: e
        })
    }
    res.json({
        success:true,
        descripcion: 'Familia borrada'
    })
    
})

router.post('/subirFoto', async (req, res) => {
    let sampleFile;
    let uploadPath;
    console.log(req.files);
    console.log(req.body);

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send({
            success: false,
            descripcion: 'No se ha subido ninguna imagen'
        });
    }

    sampleFile = req.files.image;
    uploadPath = process.cwd()+'/images/articulos/' + sampleFile.name;
    console.log(uploadPath)
    // Use the mv() method to place the file somewhere on your server
    sampleFile.mv(uploadPath, function (err) {
        if (err)
            return res.status(500).send(err);

        res.send({
            success:true,
            descripcion: 'Imagen subida con éxito',
            url:'/images/articulos/' + sampleFile.name
        });
    });
})

module.exports = router;