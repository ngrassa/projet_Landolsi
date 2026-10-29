const express = require("express");

const router = express.Router();

const compatibiliteController = require("../controllers/compatibiliteController");
const requireAdmin = require("../middleware/requireAdmin");

router.post(
    "/",
    requireAdmin,
    compatibiliteController.ajouterCompatibilite
);

router.get(
    "/vehicule/:vehiculeId",
    compatibiliteController.getCompatibilitesVehicule
);
router.delete(
    "/:vehiculeId/:pneuId",
    requireAdmin,
    compatibiliteController.supprimerCompatibilite
);


module.exports = router;