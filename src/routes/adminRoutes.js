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

    try {
        if (req.params.id) {
            await pool.query(SQL, [req.params.id])
        }
    } catch (e) {
        res.json({
            success: false,
            descripcion: e
        })
    }
    res.json({
        success: true,
        descripcion: 'Subfamilia borrada'
    })

})
router.post('/nuevaSubfamilia', async (req, res) => {
    if (!req.body) {
        res.status(400).send({
            success: false,
            descripcion: 'Faltan parámetros de entrada'
        })
        return;
    }
    try {
        const SQL = 'INSERT INTO subfamilia (xdescripcion, xfamilia_id) VALUES (?, ?)';
        await pool.query(SQL, [req.body.xdescripcion, req.body.xfamilia_id]);
        res.json({
            success: true,
            descripcion: 'Subfamilia ' + req.body.xdescripcion + ' creada'
        })
    } catch (e) {
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
    if (!req.body) {
        res.status(400).send({
            success: false,
            descripcion: 'Faltan parámetros de entrada'
        })
        return;
    }
    try {
        const SQL = 'INSERT INTO familia (xdescripcion) VALUES (?)';
        await pool.query(SQL, [req.body.xdescripcion]);
        res.json({
            success: true,
            descripcion: 'Familia ' + req.body.xdescripcion + ' creada'
        })
    } catch (e) {
        res.json({
            success: false,
            descripcion: e.sqlMessage
        })
    }
})
router.delete('/borrarFamilia/:id', async (req, res) => {
    const SQL = 'DELETE FROM familia WHERE xfamilia_id = ?';

    try {
        if (req.params.id) {
            await pool.query(SQL, [req.params.id])
        }
    } catch (e) {
        res.json({
            success: false,
            descripcion: e
        })
    }
    res.json({
        success: true,
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
    uploadPath = process.cwd() + '/images/articulos/' + sampleFile.name;
    console.log(uploadPath)
    // Use the mv() method to place the file somewhere on your server
    sampleFile.mv(uploadPath, function (err) {
        if (err)
            return res.status(500).send(err);

        res.send({
            success: true,
            descripcion: 'Imagen subida con éxito',
            url: '/images/articulos/' + sampleFile.name
        });
    });
})

router.post('/subirFoto/:idArticulo', async (req, res) => {
    let sampleFile;
    let uploadPath;
    let idArticulo;
    console.log(req.files);
    console.log(req.body);

    if (!req.files || Object.keys(req.files).length === 0 || !req.params.idArticulo) {
        return res.status(400).send({
            success: false,
            descripcion: 'Fáltan parámetros de entrada'
        });
    }
    idArticulo = req.params.idArticulo;
    let existe = await pool.query("SELECT COUNT(*) AS existe FROM articulos WHERE xarticulo_id = ?", [idArticulo]);
    if (existe[0].existe <= 0) {
        return res.status(400).send({
            success: false,
            descripcion: 'No existe el articulo'
        });
    }

    sampleFile = req.files.image;
    uploadPath = process.cwd() + '/images/articulos/' + sampleFile.name;
    console.log(uploadPath)
    // Use the mv() method to place the file somewhere on your server
    sampleFile.mv(uploadPath, function (err) {
        if (err)
            return res.status(500).send(err);
        let url = '/images/articulos/' + sampleFile.name
        pool.query('INSERT INTO img_articulos (xarticulo_id, xruta) VALUES (?, ?)', [idArticulo, url]).catch()

        res.send({
            success: true,
            descripcion: 'Imagen subida con éxito',
            url: url
        });
    });
})

router.get("/pedidos", async (req, res) => {
    var pedidosCabs;
    var pedidosLins = [];
    var pedidos = [];
    try {
        pedidosCabs = await pool.query("SELECT p.*, c.xnombre, c.xapellidos, c.xdireccion FROM pedidos p join clientes c ON p.xcliente_id = c.xcliente_id")
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
router.post("/entregar/:idPedido", async (req, res) => {
    if (!req.params.idPedido) {
        res.status(400).send()
    }
    var idPedido = req.params.idPedido;
    pool.query("UPDATE pedidos SET xentregado = true WHERE xpedido_id = ?", [idPedido])
        .then(() => {
            res.json({
                success: true,
                descripcion: "Pedido entregado"
            })
        }).catch(() => {
            res.status(500).send()
        })
})
router.get("/usuarios", async (req, res) => {
    try {
        var usuarios = await pool.query("SELECT * FROM clientes");
        res.json({
            success: true,
            descripcion: "Estos son los suarios encontrados",
            usuarios: usuarios
        })
    } catch (e) {
        res.status(500).send()
    }

})
router.delete("/borrarUsuario/:id", async (req, res) => {
    if (!req.params.id)
        return res.status(500).send();
    var id = req.params.id;
    pool.query("DELETE FROM clientes WHERE xcliente_id = ?", [id])
        .catch()
    res.json({
        success: true,
    })
})
router.get("/estadisticas/ventasAno/:ano", async (req, res) => {
    if (!req.params.ano)
        return res.status(400).send();
    var year = Number.parseInt(req.params.ano);
    var estadisticas = [];
    try {
        for (let i = 1; i <= 12; i++) {
            let count = await pool.query(`SELECT COUNT(pl.xpedido_lin_id) AS count FROM pedidos p JOIN pedidos_lineas pl 
                ON p.xpedido_id = pl.xpedido_id
                WHERE MONTH(p.xpedido_fecha) = ?
                AND YEAR(p.xpedido_fecha) = ?`,
                [i, year]
            );
            let sum = await pool.query(`SELECT SUM(p.xtotal) AS suma FROM pedidos p join pedidos_lineas pl 
                ON p.xpedido_id = pl.xpedido_id
                WHERE MONTH(p.xpedido_fecha) = ?
                AND YEAR(p.xpedido_fecha) = ?`, [i, year])
            let mes = {
                sum: sum[0].suma,
                count: count[0].count
            }
            estadisticas.push(mes);
        }
    } catch (e) {
        console.log(e)
        return res.status(500).send();
    }
    res.json({
        success: true,
        estadisticas: estadisticas,
        ano: year
    })
})
router.get("/estadisticas/masVendidos", async (req, res) => {
    const query = await pool.query(`SELECT 
    COUNT(pl.xarticulo_id) AS count, a.xnombre, a.xvisitas
FROM
    pedidos_lineas pl
        JOIN
    articulos a ON a.xarticulo_id = pl.xarticulo_id
    WHERE pl.xarticulo_id = a.xarticulo_id
    GROUP BY pl.xarticulo_id
    ORDER BY count DESC
    LIMIT 5`)
    var json = {
        labels: [],
        dataCount: [],
        dataVisitas: []
    };
    query.forEach(e => {
        json.labels.push(e.xnombre);
        json.dataCount.push(e.count);
        json.dataVisitas.push(e.xvisitas);
    });
    res.json({
        success:true,
        datos:json
    })
})
router.get("/estadisticas/masVisitados", async (req, res) => {
    const query = await pool.query(`SELECT 
    COUNT(pl.xarticulo_id) AS count, a.xnombre, a.xvisitas
FROM
    pedidos_lineas pl
        JOIN
    articulos a ON a.xarticulo_id = pl.xarticulo_id
    WHERE pl.xarticulo_id = a.xarticulo_id
    GROUP BY pl.xarticulo_id
    ORDER BY a.xvisitas DESC
    LIMIT 5`)
    var json = {
        labels: [],
        dataCount: [],
        dataVisitas: []
    };
    query.forEach(e => {
        json.labels.push(e.xnombre);
        json.dataCount.push(e.count);
        json.dataVisitas.push(e.xvisitas);
    });
    res.json({
        success:true,
        datos:json
    })
})
module.exports = router;