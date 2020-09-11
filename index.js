const express = require("express");
const app = express();

const handlebars = require("express-handlebars");

const hbSet = handlebars.create({
    helpers: {
        getCurrentYear() {
            return new Date().getFullYear();
        },
    },
});

app.engine("handlebars", hbSet.engine);
// default without global helpers (see line below!)
// app.engine("handlebars", handlebars());
app.set("view engine", "handlebars");

app.use(express.static("./public"));
app.use(express.static("./script.js"));
//building our own server
app.get("/", (req, res) => {
    // console.log("made it to test!");
    res.render("petition", {
        layout: "main",
    });
});

app.use(
    express.urlencoded({
        extended: true,
    })
);

app.post("/submit-form", (req, res) => {
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const signature = req.body.signature;
    res.redirect("/thanks");
});

app.get("/thanks", (req, res) => {
    // console.log("made it to the thank you page!");
    res.render("thanks", {
        layout: "main",
    });
});

app.listen(8081, () => console.log("petition is listening"));
