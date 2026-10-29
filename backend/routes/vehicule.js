const express = require("express");
const router = express.Router();

const vehiculeController = require("../controllers/VehiculeController");

router.get(
    "/immatriculation/:immatriculation",
    vehiculeController.searchVehicule
);

module.exports = router;