const express = require("express");
const handlebars = require("express-handlebars");
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const db = require("./db.js");
const app = express();

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
app.use(cookieParser());
app.use(
    cookieSession({
        secret: `I'm always hungry.`,
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);

app.use(
    express.urlencoded({
        extended: false,
    })
);

app.use((req, res, next) => {
    console.log(
        req.method,
        req.body,
        "(1) req.cookies:",
        req.cookies,
        "(2) req session",
        req.session
    );
    next();
});
app.use(express.static("./public"));

app.get("/", (req, res) => {
    res.redirect("/petition");
});

app.get("/petition", (req, res) => {
    // console.log("made it to test!");
    // if you have a signatureID -> you already signed -> redirect to "thanks"
    if (req.session.signatureId) {
        console.log("(A) req.session.signatureId: ", req.session.signatureId);
        res.redirect("/thanks");
        // else -> sign petition
    } else {
        res.render("petition", {
            layout: "main",
        });
    }
});

app.post("/submit-form", (req, res) => {
    console.log("req.body.firstname: ", req.body.firstname);
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const signature = req.body.signature;

    if (!firstname || !lastname || !signature) {
        console.log("All fields require input!");
        res.render("petition", {
            layout: "main",
            inputIncomplete: true,
        });
    } else {
        db.addData(firstname, lastname, signature)
            .then((result) => {
                req.session.signatureId = result.rows[0].id; //////////// !!!
                req.session.firstname = result.rows[0].firstname; /////// !!!
                res.redirect("/thanks");
            })
            .catch((err) => {
                console.log("There was an error in addData!", err);
                res.render("petition", {
                    layout: "main",
                    inputIncomplete: true,
                });
            });
    }
});

app.get("/thanks", (req, res) => {
    const signatureId = req.session.signatureId;
    const currentName = req.session.firstname;
    // console.log("req.session.signatureId: ", req.session.signatureId);
    if (!req.session.signatureId) {
        res.redirect("/petition");
    } else {
        // console.log("made it to the thank you page!");
        db.signedByNum()
            .then((result) => {
                const numOfNames = result.rows[0].count;

                db.addSignature(signatureId).then((signatureImg) => {
                    res.render("thanks", {
                        layout: "main",
                        signatureImg: signatureImg.rows[0].signature,
                        numOfNames,
                        signatureId,
                        currentName,
                    });
                });
            })
            .catch((err) => {
                console.log("error in addSignature", err);
            });
    }
});

app.get("/signedBy", (req, res) => {
    if (!req.session.signatureId) {
        res.redirect("/petition");
    } else {
        db.signedBy()
            .then((result) => {
                res.render("signedBy", {
                    layout: "main",
                    listOfNames: result.rows,
                });
            })
            .catch((error) => {
                res.end(error, "BIG ERROR! CAN'T RETURN LIST OF SIGNATURES");
            });
    }
});

app.listen(8081, () => console.log("petition is listening"));
