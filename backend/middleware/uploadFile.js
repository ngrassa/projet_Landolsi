const multer = require("multer");
const path = require("path");
const config = require("../config");

// Configuration du stockage
const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(null, config.uploadDir);

    },

    filename: function (req, file, cb) {

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1000000) +
            path.extname(file.originalname);

        cb(null, uniqueName);

    }

});


// Types de fichiers autorisés
const fileFilter = (req, file, cb) => {

    const allowedTypes = [

        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"

    ];

    if (allowedTypes.includes(file.mimetype)) {

        cb(null, true);

    } else {

        cb(new Error("Seules les images JPG, JPEG, PNG et WEBP sont autorisées."), false);

    }

};


// Middleware Multer
const uploadFile = multer({

    storage,

    fileFilter,

    limits: {

        fileSize: 5 * 1024 * 1024 // 5 Mo

    }

});

module.exports = uploadFile;