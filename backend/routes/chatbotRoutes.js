const express = require("express");

const router = express.Router();

const chatbotController = require("../controllers/ChatbotController");

router.post(
    "/",
    chatbotController.chatbot
);

module.exports = router;