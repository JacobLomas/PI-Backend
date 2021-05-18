const express = require("express");
const router = express.Router();

const pool = require("../database");

/**
 * GET - Devuelve las familias y subfamilias de productos
 */
router.get("/familias_subfamilias", async (req, res) => {
  var navbar = [];
  const familias = await pool.query("SELECT * from familia  ORDER BY xdescripcion");
  console.log(familias);
  await familias.forEach(async (familia, indice) => {
    var subfamilias = await pool.query(
      `SELECT xdescripcion from subfamilia
        WHERE xfamilia_id= ? ORDER BY xdescripcion`,
      [familia.xfamilia_id]
    );
    var navbarItem = {
      familiaItem: familia.xdescripcion,
      subfamiliasItem: [],
    };
    subfamilias.forEach((subfamilia) => {
      navbarItem.subfamiliasItem.push(subfamilia.xdescripcion);
    });
    navbar.push(navbarItem);
    if (familias.length == navbar.length) {
      res.status(200).send(navbar);
    }
  });
});
module.exports = router;
