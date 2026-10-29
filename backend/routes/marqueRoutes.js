const express = require("express");
const router = express.Router();

const marqueController = require("../controllers/MarqueController");

const uploadFile = require("../middleware/uploadFile");
const requireAdmin = require("../middleware/requireAdmin");

// /marques //

// Ajouter une marque avec logo
router.post("/" , requireAdmin, uploadFile.single("logo"),marqueController.addMarque
);


// Récupérer toutes les marques
router.get( "/", marqueController.getAllMarques);


// Récupérer une marque par id
router.get("/:id", marqueController.getMarqueById
);


// Modifier une marque
router.put(
    "/:id", requireAdmin, uploadFile.single("logo"),marqueController.updateMarque
);

router.get( "/search/:id/pneus",marqueController.searchPneusByMarque);
// Supprimer une marque
router.delete("/:id", requireAdmin, marqueController.deleteMarque);
router.get( "/:id", marqueController.getMarqueById);



module.exports = router;