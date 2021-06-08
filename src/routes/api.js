const express = require("express");
const router = express.Router();

const pool = require("../database");

/**
 * GET - Devuelve las familias y subfamilias de productos
 */
router.get("/familias_subfamilias", async (req, res) => {
  var navbar = [];
  const familias = await pool.query("SELECT * from familia  ORDER BY xdescripcion");
  console.log(familias)
  for(let i=0; i<familias.length; i++)//await familias.forEach(async (familia, indice) =>
     {
    var subfamilias = await pool.query(
      `SELECT xdescripcion from subfamilia
        WHERE xfamilia_id= ? ORDER BY xdescripcion`,
      [familias[i].xfamilia_id]
    );
    var navbarItem = {
      familiaItem: familias[i].xdescripcion,
      subfamiliasItem: [],
    };
    subfamilias.forEach((subfamilia) => {
      navbarItem.subfamiliasItem.push(subfamilia.xdescripcion);
    });
    navbar.push(navbarItem);
    if (familias.length == navbar.length) {
      res.status(200).send(navbar);
    }
  }
});

router.get("/unArticulo/:id", async (req, res) => {
  console.log(req.params.id);
  const articuloId = req.params.id;
  var articulo = await pool.query("SELECT * FROM articulos WHERE xarticulo_id = ?", [articuloId]);
  if(articulo.length == 0){
    res.status(404).json({
      success: false,
      descripcion: "No existe el articulo"
    })
  }else{
    articulo = articulo[0];
    articulo.xvisitas++
    pool.query("UPDATE articulos set xvisitas = ? WHERE xarticulo_id = ?", [articulo.xvisitas, articuloId])
    res.json({
      success: true,
      articulo: articulo,
      descripcion: "Articulo "+articuloId+" encontrado"
    })
  }
});

router.get("/todosArticulos/:page", async (req, res) => {
  const page = req.params.page;
  var sSQL = "SELECT * FROM articulos limit 10 offset ";
  var productos;
  var siguientesProductos;
  var respsuestaJSON = {};
  //COMPROBACIONES
  //No me pasa un numero como parametro
  if (!typeof page === "number") {
    respsuestaJSON = {
      success: false,
      descripcion: page + " No es un número de página válido"
    };
    res.status(400).json(respsuestaJSON);
    return;
  }
  sSQL += page * 10
  try {
    productos = await pool.query(sSQL);
  } catch (e) {
    res.status(400).json({
      success: false,
      descripcion: e.sqlMessage
    })
    return;
  }

  var lastPage = await pool.query("SELECT COUNT(*) as totalArt FROM articulos");
  lastPage = lastPage[0].totalArt / 10

  //No hay productos
  if (productos.length == 0) {
    respsuestaJSON = {
      success: false,
      descripcion: "No hay más productos",
      lastPage: lastPage
    };
    res.status(404).json(respsuestaJSON);
    return;
  }
  //Comprobar siguiente página
  siguientesProductos = await pool.query("SELECT * FROM articulos LIMIT 10 OFFSET " + (page + 1) * 10);
  if (siguientesProductos.length == 0) {
    respsuestaJSON = {
      success: true,
      descripcion: "Success",
      productos: productos,
      pActual: page,
      pSiguiente: false,
      lastPage: lastPage
    }
  } else {
    respsuestaJSON = {
      success: true,
      descripcion: "Success",
      productos: productos,
      pActual: page,
      pSiguiente: page + 1,
      lastPage: lastPage
    };
  }
  res.status(200).json(respsuestaJSON);
})

router.get("/articulos/:familia/:subfamilia", async (req, res) => {
  const familia = req.params.familia;
  const subfamilia = req.params.subfamilia;
  if (familia) {
    //Compruebo si existe familia
    var existeFamilia = await pool.query(
      'SELECT COUNT(*) AS existe FROM familia WHERE xdescripcion = ?',
      [familia]
    );
    if (existeFamilia[0].existe > 0) existeFamilia = true
    else existeFamilia = false;
    //=============================
    if (existeFamilia) {
      //1.- Si se ha informado subfamilia, compruebo si existe
      if (subfamilia !="null") {
        var existeSubFamilia = await pool.query(
          'SELECT COUNT(*) AS existe FROM subfamilia WHERE xdescripcion = ?',
          [subfamilia]
        );
        if (existeSubFamilia[0].existe > 0) existeSubFamilia = true
        else existeSubFamilia = false;
        // Llegados a este punto, existe la familia.
        // 1.1 - Si existe la subfamilia, buscamos articulos por familia y subfamilia
        if (existeSubFamilia) {
          try {
            const articulos = await pool.query(
              `SELECT * FROM articulos art, familia fam, subfamilia subfam 
              WHERE art.xfamilia_id = fam.xfamilia_id AND 
              art.xsubfamilia_id = subfam.xsubfamilia_id AND 
              fam.xdescripcion = ? AND 
              subfam.xdescripcion= ?
              `,
              [familia, subfamilia]
            );
            res.json({
              success: true,
              articulos: articulos,
            });
            return;
          } catch (e) {
            console.log(e.sqlMessage)
            res.json({
              success: false,
              description: e.sqlMessage
            })
            return;
          }
        } //if (existeSubfamilia)
        else {
          res.json({
            success: false,
            descripcion: "No existe subfamilia"
          })
        }
        //1.1 - ===============================================
      }
      //1.- =================================================
      //2. - No se ha informado subfamilia, devuelvo los productos de la familia
      else {
        try {
          const articulos = await pool.query(
            `SELECT * FROM articulos art, familia fam 
          WHERE art.xfamilia_id = fam.xfamilia_id 
          AND fam.xdescripcion = ?`,
            [familia]
          );
          res.json({
            success: true,
            articulos: articulos,
          });
          return;
        } catch (e) {
          console.log(e.sqlMessage)
          res.json({
            success: false,
            description: e.sqlMessage
          })
          return;
        }

      }
    }//if(existeFamilia)
    else{
      res.json({
        success: false,
        description: "No existe la familia"
      })
      return;
    }

  }//if(familia)
  else{
    res.json({
      success: false,
      description: "No se ha informado la familia"
    })
    return;
  }
})

router.get("/ultimosArticulos/:n", async (req, res) => {
  try{
    const n = Number.parseInt(req.params.n);
    const articulos = await pool.query(
      "SELECT * FROM articulos ORDER BY xfecha_creacion DESC LIMIT ?",
      [n]
    )
    res.json({
      success: true,
      articulos: articulos,
      descripcion: "Último(s) "+n+" artículo(s)"
    })
    return;
  }catch(e){
    res.status(400).send({ 
      success: false,
      descripcion: e
    })
  }

})

module.exports = router;