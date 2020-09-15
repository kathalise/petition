const express = require("express");
const handlebars = require("express-handlebars");
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const db = require("./db.js");
const { compare, hash } = require("./bcrypt");
const app = express();

const hbSet = handlebars.create({
    helpers: {
        getCurrentYear() {
            return new Date().getFullYear();
        },
    },
});

app.engine("handlebars", hbSet.engine);
// ---- default without global helpers (see line below!) -----
// ---- app.engine("handlebars", handlebars()); ----
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
    res.redirect("/registration");
});

/* ---------------REGISTRATION--------------- */
app.get("/registration", (req, res) => {
    if (!req.session.userId) {
        res.render("registration", {
            layout: "main",
        });
    } else {
        res.redirect("/petition");
    }
});

app.post("/registration", (req, res) => {
    // console.log("req.body", req.body);
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const email = req.body.email;
    const plainPassword = req.body.password;

    if (!firstname || !lastname || !email || !plainPassword) {
        res.render("registration", {
            layout: "main",
            inputIncomplete: true,
        });
    } else {
        hash(plainPassword)
            .then((password) => {
                db.addUser(firstname, lastname, email, password).then(
                    (result) => {
                        req.session.userId = result.rows[0].id;
                        res.redirect("/profile");
                    }
                );
            })
            .catch((err) => {
                console.log(
                    "There was an error creating a user-account (addUser)!",
                    err
                );
                res.render("registration", {
                    layout: "main",
                    inputIncomplete: true,
                });
            });
    }
});

/* ---------------LOGIN--------------- */
app.get("/login", (req, res) => {
    if (!req.session.userId) {
        res.render("login", {
            layout: "main",
        });
    } else {
        res.render("petition", {
            layout: "main",
        });
    }
});

app.post("/login", (req, res) => {
    const email = req.body.email;
    const plainPassword = req.body.password;

    db.loginUser(email)
        .then((result) => {
            const password = result.rows[0].password;
            const userId = result.rows[0].id;
            compare(plainPassword, password).then((userExists) => {
                console.log("userExists", userExists);
                if (userExists === false) {
                    res.render("login", {
                        layout: "main",
                        inputIncomplete: true,
                    });
                } else {
                    req.session.userId = userId;
                    res.redirect("/petition");
                }
            });
        })
        .catch((err) => {
            console.log(err);
        });
});

/* ---------------PETITION--------------- */
app.get("/petition", (req, res) => {
    // console.log("made it to test!");
    const userId = req.session.userId;
    if (!userId) {
        console.log("(A) req.session.userId: ", req.session.userId);
        res.redirect("/login");
    } else {
        db.returnSignature(userId).then((result) => {
            if (!result.rows[0]) {
                res.render("petition", {
                    layout: "main",
                });
            } else {
                res.redirect("/thanks");
            }
        });
    }
});

app.post("/petition", (req, res) => {
    const signature = req.body.signature;
    const userId = req.session.userId;
    if (!req.body.signature) {
        // console.log("All fields require input!");
        res.render("petition", {
            layout: "main",
            inputIncomplete: true,
        });
    } else {
        db.addSignature(signature, userId)
            .then((result) => {
                console.log("beyond this point!");
                req.session.signatureId = result.rows[0].id;
                res.redirect("/thanks");
            })
            .catch((err) => {
                console.log("There was an error in addSignature!", err);
                res.render("petition", {
                    layout: "main",
                    inputIncomplete: true,
                });
            });
    }
});

/* ---------------THANKS--------------- */
app.get("/thanks", (req, res) => {
    if (!req.session.userId) {
        res.redirect("/petition");
    } else {
        db.signedByNum()
            .then((result) => {
                const numOfNames = result.rows[0].count;
                db.returnSignature(req.session.userId).then((result) => {
                    res.render("thanks", {
                        layout: "main",
                        signatureImg: result.rows[0].signature,
                        numOfNames,
                    });
                });
            })
            .catch((err) => {
                console.log("error in get thanks", err);
            });
    }
});

app.post("/thanks", (req, res) => {
    res.redirect("/registration");
});

/* ---------------LIST OF PPL WHO SIGNED--------------- */
app.get("/signedBy", (req, res) => {
    if (!req.session.signatureId) {
        res.redirect("/petition");
    } else {
        db.signedBy()
            .then((result) => {
                console.log("(LIST) listOfNames", result.rows);
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

app.get("/signedBy/:city", (req, res) => {
    const city = req.params.city;
    // console.log("city", city);
    db.signedByCity(city).then((result) => {
        res.render("signedBy", {
            layout: "main",
            listOfNames: result.rows,
        });
    });
});

/* ---------------PROFILE PAGE--------------- */
app.get("/profile", (req, res) => {
    res.render("profile", {
        layout: "main",
    });
});

app.post("/profile", (req, res) => {
    const age = req.body.age;
    const city = req.body.city;
    // const url = req.body.url;
    const userId = req.session.userId;
    if (req.body.url || req.body.age || req.body.city) {
        let url = "";
        if (!req.body.url.startsWith("http")) {
            console.log("URL starts with http is false");
            url = `http://" ${url}`;
        } else {
            console.log("URL start with http is true");
            url = req.body.url;
        }
        db.addProfile(age, city, url, userId)
            .then(() => {
                res.redirect("/petition");
            })
            .catch((err) => console.log(err));
    } else {
        res.redirect("/petition");
    }
});

/* ---------------LOGOUT--------------- */
app.get("/logout", (req, res) => {
    req.session = null;
    res.render("logout", {
        layout: "main",
    });
});

app.listen(8081, () => console.log("petition is listening"));
