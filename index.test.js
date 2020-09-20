const supertest = require("supertest");
const { app } = require("./index.js");
const cookieSession = require("cookie-session");

// testing test
// test("Testing to see if Jest works", () => {
//     expect(1).toBe(1);
// });

// ------- ex 1 ------- //
//logged out user redirected to registration when attempting to go to petition page

test("GET/ petition page sends 302 status as response redirect to login when no userId", () => {
    cookieSession.mockSessionOnce({});
    return supertest(app)
        .get("/petition")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/login");
        });
});

// ------- ex 2 ------- //
//logged in user redirect petition when attempting to go to login / registration page

test("GET/ registration sends 302 status as response to redirect to petition if userId", () => {
    cookieSession.mockSessionOnce({
        userId: 100,
    });
    return supertest(app)
        .get("/registration")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/petition");
        });
});

test("GET/ login sends 302 status as response to redirect to petition if userId", () => {
    cookieSession.mockSessionOnce({
        userId: 100,
    });
    return supertest(app)
        .get("/login")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/petition");
        });
});

// ------- ex 3 ------- //
//logged in user (userId) who signed the petition (signatureId) redirect to thanks page when attempting to go to petition page / submit a signature//

test("GET/ petition sends 302 as response to redirect to thanks if userId & signatureId", () => {
    cookieSession.mockSessionOnce({
        userId: 100,
        signatureId: 101,
    });
    return supertest(app)
        .get("/petition")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/thanks");
        });
});

// ------- ex 4 ------- //
// logged in user (userId) and have not signed the petition (no signatureId) redirect to petition page when attempting to go to thanks or signers (signedBy)

test("GET/ thanks sends 302 as response to redirect to petition, if userId but no signatureId", () => {
    cookieSession.mockSessionOnce({
        userId: 100,
        signatureId: null,
    });
    return supertest(app)
        .get("/thanks")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/petition");
        });
});

test("GET/ signedBy sends 302 as response to redirect to petition, if userId but no signatureId", () => {
    cookieSession.mockSessionOnce({
        userId: 100,
        signatureId: null,
    });
    return supertest(app)
        .get("/signedBy")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/petition");
        });
});
