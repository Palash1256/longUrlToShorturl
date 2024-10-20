require('dotenv').config();
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const QRCode = require('qrcode');
const urlModel = require("../server/model/urlModel");
const mongoose = require("mongoose");
const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;

app.use(express.static(path.join(__dirname, '../client')));
//app.use('/style.css', express.static(path.join(__dirname, '../client/style.css')));
app.use("/QRcodes", express.static(path.join(__dirname, 'QRcodes')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

function randomString() {
    return Math.random().toString(36).substr(3, 5);
}

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/index.html"));
});

app.post("/short", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const userData = {
        longUrl: req.body.longUrl,
        uid: randomString(),
    };

    const existUrl = await urlModel.findOne({ longUrl: req.body.longUrl });

    if (existUrl) {
        res.json({
            shortUrl: `${BACKEND_URL}/${existUrl.uid}`,
            QRcode: `${BACKEND_URL}/QRcodes/${existUrl.uid}.png`
        });
    } else {
        QRCode.toFile(`QRcodes/${userData.uid}.png`, userData.longUrl, {
            height: 300,
            width: 300,
            color: {
                dark: '#34eb98',
                light: '#54fa'
            }
        }, async (err) => {
            if (err) throw err;
            console.log("QR code generated");
            const newUrl = new urlModel(userData);
            await newUrl.save();
            console.log("Data Saved");

            res.json({
                shortUrl: `${BACKEND_URL}/${userData.uid}`,
                QRcode: `${BACKEND_URL}/QRcodes/${userData.uid}.png`
            });
        });
    }
});

app.get("/:uid", async (req, res) => {
    console.log("param /:uid", req.params.uid);

    const existUrl = await urlModel.findOne({ uid: req.params.uid });
    if (existUrl) {
        res.redirect(existUrl.longUrl);
    } else {
        res.send("<h1>Url not in database</h1>");
    }
});

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("MongoDB connected");
        app.listen(PORT, () => {
            console.log(`Server is running at ${PORT}`);
        });
    })
    .catch((err) => {
        console.log("Mongo connection error", err);
    });