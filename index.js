const express = require("express");
const handlebars = require("express-handlebars");
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const csurf = require("csurf");
const db = require("./db.js");
const { compare, hash } = require("./bcrypt");
const app = express();
///////////////// const redis = require("./redis");

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
let secrets;
process.env.NODE_ENV === "production"
    ? (secrets = process.env)
    : (secrets = require("./secrets"));
app.use(
    cookieSession({
        secret: `${secrets.sessionSecret}`,
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);

app.use(
    express.urlencoded({
        extended: false,
    })
);

/////////////////////////////////////
app.use(csurf());

app.use(function (req, res, next) {
    res.set("x-frame-options", "DENY");
    res.locals.csrfToken = req.csrfToken();
    console.log(req.method, req.url);
    next();
});
/////////////////////////////////////

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

////////////////////////////////////////////////
/* ---------------REGISTRATION--------------- */
////////////////////////////////////////////////

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
        hash(plainPassword).then((password) => {
            const passwordHashed = password;
            db.addUser(firstname, lastname, email, passwordHashed)
                .then((result) => {
                    req.session.userId = result.rows[0].id;
                    res.redirect("/profile");
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
        });
    }
});

/////////////////////////////////////////
/* ---------------LOGIN--------------- */
/////////////////////////////////////////

app.get("/login", (req, res) => {
    if (!req.session.userId) {
        res.render("login", {
            layout: "main",
        });
    } else {
        res.redirect("/petition");
    }
});

app.post("/login", (req, res) => {
    const email = req.body.email;
    const plainPassword = req.body.password;

    db.loginUser(email)
        .then((result) => {
            const password = result.rows[0].password;
            compare(plainPassword, password)
                .then((userExists) => {
                    console.log("userExists", userExists);
                    //if user does exist
                    if (userExists) {
                        const userId = result.rows[0].id;
                        req.session.userId = userId;
                        console.log("userID with pete", userId);
                        db.returnSignature(userId)
                            .then((result) => {
                                console.log(
                                    "result.rows.length with pete",
                                    result.rows.length
                                );
                                if (result.rows.length != 0) {
                                    req.session.signatureId = result.rows[0].id;
                                    res.redirect("/thanks");
                                } else {
                                    res.redirect("/petition");
                                }
                            })
                            .catch((err) => {
                                console.log(
                                    "error in checking if signed petition",
                                    err
                                );
                            });
                    } else {
                        res.rendirect("/registration");
                    }
                })
                .catch((err) => {
                    console.log("Err in login post req", err);
                    res.render("login", {
                        layout: "main",
                        tryAgain: true,
                    });
                });
        })
        .catch((err) => {
            console.log("Err in login post req", err);
            res.render("login", {
                layout: "main",
                tryAgain: true,
            });
        });
});

////////////////////////////////////////////
/* ---------------PETITION--------------- */
////////////////////////////////////////////

app.get("/petition", (req, res) => {
    if (!req.session.userId) {
        res.redirect("/login");
    } else {
        console.log("made it to test!");
        // if signatureId is truthy
        if (req.session.signatureId) {
            res.redirect("/thanks");
        } else {
            res.render("petition", {
                layout: "main",
            });
        }
    }
});

app.post("/petition", (req, res) => {
    const signature = req.body.signature;
    const userId = req.session.userId;
    if (!signature) {
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

//////////////////////////////////////////
/* ---------------THANKS--------------- */
//////////////////////////////////////////

app.get("/thanks", (req, res) => {
    // const signatureId = req.session.signatureId;
    const userId = req.session.userId;
    if (!req.session.signatureId) {
        res.redirect("/petition");
    } else {
        db.signedByNum()
            .then((num) => {
                const numOfNames = num.rows[0].count;
                // const currentUser;
                db.returnSignature(userId)
                    .then((result) => {
                        res.render("thanks", {
                            layout: "main",
                            signatureImg: result.rows[0].signature,
                            numOfNames,
                            userId,
                        });
                    })
                    .catch((err) => {
                        console.log("error in get thanks", err);
                    });
            })
            .catch((err) => {
                console.log("error in get thanks", err);
            });
    }
});

//////////////////////////////////////////////////////////
/* ---------------LIST OF PPL WHO SIGNED--------------- */
//////////////////////////////////////////////////////////

app.get("/signedBy", (req, res) => {
    if (!req.session.signatureId) {
        res.redirect("/petition");
    } else {
        db.signedBy()
            .then((result) => {
                console.log("LIST listOfNames", result.rows);
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

////////////////////////////////////////////////
/* ---------------PROFILE PAGE--------------- */
////////////////////////////////////////////////

app.get("/profile", (req, res) => {
    res.render("profile", {
        layout: "main",
    });
});

app.post("/profile", (req, res) => {
    let age = req.body.age;
    let city = req.body.city;
    let url = req.body.url;
    const userId = req.session.userId;
    if (req.body.url || req.body.age || req.body.city) {
        let urlInput = null;
        if (url.startsWith("http")) {
            urlInput = url;
        } else if (url !== "") {
            console.log("URL start with http is false");
            urlInput = `http://${url}`;
        }
        if (!age) {
            age = null;
        } else {
            age = req.body.age;
        }
        db.addProfile(age, city, urlInput, userId)
            .then(() => {
                res.redirect("/petition");
            })
            .catch((err) => {
                console.log(err);
            });
    } else {
        res.redirect("/petition");
    }
});

/////////////////////////////////////////////////////
/* ---------------EDIT PROFILE PAGE--------------- */
/////////////////////////////////////////////////////

app.get("/editprofile", (req, res) => {
    if (!req.session.userId) {
        res.redirect("/login");
    } else {
        db.userProfileData(req.session.userId)
            .then((result) => {
                res.render("editprofile", {
                    layout: "main",
                    userProfile: result.rows[0],
                });
            })
            .catch((err) => {
                console.log(err);
            });
    }
});

app.post("/editprofile", (req, res) => {
    let firstname = req.body.firstname;
    let lastname = req.body.lastname;
    let email = req.body.email;
    let plainPassword = req.body.password;
    let age = req.body.age;
    let city = req.body.city;
    let url = req.body.url;

    // ---------- condition for age ---------- //
    if (!age) {
        age = null;
    } else {
        age = req.body.age;
    }
    // ---------- condition for url ---------- //
    let urlInput = null;
    if (url.startsWith("http")) {
        urlInput = url;
    } else if (url !== "") {
        console.log("URL start with http is false");
        urlInput = `http://${url}`;
    }

    if (!plainPassword) {
        console.log("No password updated");
        db.usersEdit(firstname, lastname, email, req.session.userId)
            .then(() => {
                db.userProfilesEdit(age, city, urlInput, req.session.userId)
                    .then(() => {
                        res.redirect("/thanks");
                        console.log("CAN I EDIT THIS PART?");
                    })
                    .catch((err) => {
                        console.log("Pete is online with me", err);
                    });
            })
            .catch((err) => {
                res.render("editprofile", {
                    layout: "main",
                    tryAgain: true,
                });

                console.log(
                    "Error in editprofile post request - good luck with that!!",
                    err
                );
            });
    } else {
        console.log("USER IS CHANGING PASSWORD");
        hash(plainPassword).then((password) => {
            const newHashedPw = password;
            Promise.all([
                db.usersWithPasswordEdit(
                    firstname,
                    lastname,
                    email,
                    newHashedPw,
                    req.session.userId
                ),
                db.userProfilesEdit(age, city, urlInput, req.session.userId),
            ])
                .then(() => {
                    console.log(
                        "Changing user date including password this is BIG"
                    );
                    res.redirect("/petition");
                })
                .catch((err) => {
                    console.log(
                        "Error in post request edit profile changing PW",
                        err
                    );
                    db.userProfileData(req.session.userId).then((result) => {
                        res.render("editprofile", {
                            layout: "main",
                            userProfile: result.rows[0],
                            tryAgain: true,
                        });
                    });
                });
        });
    }
});

////////////////////////////////////////////////////
/* ---------------DELETE SIGNATURE--------------- */
////////////////////////////////////////////////////

app.post("/deleteSig", (req, res) => {
    console.log("Signature deleted");
    db.deleteSig(req.session.userId).then(() => {
        req.session.signatureId = null;
        res.redirect("/petition");
    });
});

//////////////////////////////////////////
/* ---------------LOGOUT--------------- */
//////////////////////////////////////////

app.get("/logout", (req, res) => {
    req.session.userId = null;
    req.session.signatureId = null;
    res.redirect("/login");
});

//////////////////////////////////////////////////
/* ---------------DELETE ACCOUNT--------------- */
//////////////////////////////////////////////////

app.get("/delete", (req, res) => {
    if (!req.session.userId) {
        res.redirect("/login");
    } else {
        res.render("delete", {
            layout: "main",
        });
    }
});

app.post("/delete", (req, res) => {
    console.log("DELETING ACCOUNT");
    const userId = req.session.userId;
    Promise.all([
        db.deleteUserProfiles(userId),
        db.deleteSig(userId),
        db.deleteUsers(userId),
    ])
        .then((x) => {
            console.log("DELETE ACCOUNT CHECK", x);
        })
        .catch((err) => {
            console.log("ERR DELETING ACC", err);
            res.redirect("/delete");
        });

    req.session.userId = null;
    req.session.signatureId = null;
    res.redirect("/registration");
});

//////////////////////////////////////////
/* ----------------PORT---------------- */
//////////////////////////////////////////

app.listen(process.env.PORT || 8081, () =>
    console.log("petition is listening")
);
