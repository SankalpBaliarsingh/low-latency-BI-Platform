// Mock auth middleware — simulates a logged-in user
// Replace with real JWT validation when auth service is ready

const MOCK_USER = {
    id: "user::1",
    email: "sankalp@example.com",
    name: "Sankalp",
    roles: ["role::admin"],
};

function authMiddleware(req, res, next) {
    // Later: extract JWT from Authorization header, validate, fetch user
    req.user = MOCK_USER;
    next();
}

module.exports = authMiddleware;