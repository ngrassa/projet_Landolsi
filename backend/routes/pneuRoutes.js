const express = require("express");
const router = express.Router();

const pneuController = require("../controllers/PneuController");
const uploadFile = require("../middleware/uploadFile");
const requireAdmin = require("../middleware/requireAdmin");
//  /pneus  //

router.post("/", requireAdmin, uploadFile.single("image"), pneuController.addPneu);
router.put("/:id", requireAdmin, uploadFile.single("image"), pneuController.updatePneu);
router.delete("/:id", requireAdmin, pneuController.deletePneu);
// Afficher pneus
router.get("/getallpneus", pneuController.getAllPneus);
router.get("/search/dimension",pneuController.searchPneusByDimension);
router.get( "/dimensions/largeurs", pneuController.getLargeurs);
router.get("/dimensions/hauteurs",pneuController.getHauteurs);
router.get("/dimensions/diametres",pneuController.getDiametres);
router.get("/search/saison/:saison",pneuController.searchPneusBySaison);

router.get( "/:id", pneuController.getPneuById);


module.exports = router;