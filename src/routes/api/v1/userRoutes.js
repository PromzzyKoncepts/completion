const express = require("express");
const {
    userLogin,
    userSignup,
    forgotPassword,
    refreshToken,
    socialAuth,
    updatePushToken,
    deleteAccount
} = require("../../../controllers/v1/userController");
const { AuthMiddleware } = require("../../../middlewares/v1/auth");
const Auth0Middleware = require("../../../middlewares/v1/auth0");

const router = express.Router();

/**
 * @openapi
 * /login:
 *  post:
 *    description: Use to login with email and password
 *    tags:
 *      - Auth
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Login'
 *    responses:
 *      200:
 *        description: Login successful
 *        content:
 *          application/json:
 *            schema:
 *      400:
 *        description: Invalid input data
 *        content:
 *          application/json:
 *            schema:
 *      403:
 *        description: Invalid credentials
 *        content:
 *          application/json:
 *            schema:
 *      404:
 *        description: Not found
 *        content:
 *          application/json:
 *            schema:
 *      429:
 *        description: Too many requests
 *        content:
 *          application/json:
 *            schema:
 *      500:
 *        description: Internal server error
 *        content:
 *          application/json:
 *            schema:
 */
router.post("/login", AuthMiddleware.validateLogin, userLogin);

/**
 * @openapi
 * /signup:
 *  post:
 *    description: Use to signup with email and password
 *    tags:
 *      - Auth
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Signup'
 *    responses:
 *      201:
 *        description: account created successfully
 *        content:
 *          application/json:
 *            schema:
 *      400:
 *        description: Invalid input data
 *        content:
 *          application/json:
 *            schema:
 *      401:
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *      404:
 *        description: Not found
 *        content:
 *          application/json:
 *            schema:
 *      429:
 *        description: Too many requests
 *        content:
 *          application/json:
 *            schema:
 *      500:
 *        description: Internal server error
 *        content:
 *          application/json:
 *            schema:
 *
 */
router.post("/signup", AuthMiddleware.validateSignup, userSignup);

/**
 *
 * /forgot-password:
 * post:
 *  description: Use to send forgot password email
 * tags:
 * - Auth
 * requestBody:
 *  required: true
 *  content:
 *  application/json:
 *     schema:
 *      type: object
 *     properties:
 *      email:
 *     type: string
 *    example:
 *    email:
 *   type: string
 * responses:
 *
 *
 * responses:
 * 200:
 * description: successful operation
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/SuccessResponse'
 * 400:
 * description: Invalid input data
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 * 401:
 * description: Unauthorized
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 * 404:
 * description: Not found
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 * 500:
 * description: Internal server error
 * content:
 * application/json:
 * schema:
 *
 */

/**
 * @openapi
 * /forgot-password:
 *  post:
 *    description: Use to send forgot password email
 *    tags:
 *      - Auth
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/ForgotPassword'
 *    responses:
 *      200:
 *        description: email sent successfully
 *        content:
 *          application/json:
 *            schema:
 *      400:
 *        description: Invalid input data
 *        content:
 *          application/json:
 *            schema:
 *      401:
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *      404:
 *        description: Not found
 *        content:
 *          application/json:
 *            schema:
 *      429:
 *        description: Too many requests
 *        content:
 *          application/json:
 *            schema:
 *      500:
 *        description: Internal server error
 *        content:
 *          application/json:
 *            schema:
 */
router.post(
    "/forgot-password",
    AuthMiddleware.validateforgotPassword,
    forgotPassword
);

/**
 * @openapi
 * /refresh-token:
 *  post:
 *    description: Use to refresh token
 *    tags:
 *      - Auth
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/RefreshToken'
 *    responses:
 *      200:
 *        description: token refreshed successfully
 *        content:
 *          application/json:
 *            schema:
 *      400:
 *        description: Invalid input data
 *        content:
 *          application/json:
 *            schema:
 *      401:
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *      404:
 *        description: Not found
 *        content:
 *          application/json:
 *            schema:
 *      429:
 *        description: Too many requests
 *        content:
 *          application/json:
 *            schema:
 *      500:
 *        description: Internal server error
 *        content:
 *          application/json:
 *            schema:
 */
router.post(
    "/refresh-token",
    AuthMiddleware.validateRefreshToken,
    refreshToken
);

// protect routes under this
router.use(Auth0Middleware.checkJwt);

/**
 * @openapi
 * /social-auth:
 *  post:
 *    description: Use to login with social account (e.g. google, apple, twitter, facebook)
 *    tags:
 *      - Auth
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *           $ref: '#/components/schemas/SocialAuth'
 *    responses:
 *      200:
 *        description: login successful
 *        content:
 *          application/json:
 *            schema:
 *      401:
 *        description: Unauthorized (bad connection)
 *        content:
 *          application/json:
 *            schema:
 *      429:
 *        description: Too many requests
 *        content:
 *          application/json:
 *            schema:
 *      500:
 *        description: Internal server error
 *        content:
 *          application/json:
 *            schema:
 */
router.post("/social-auth", Auth0Middleware.tokenInfo, socialAuth);

/**
 * @openapi
 * /update-push-token:
 *  patch:
 *    description: Use to update push token
 *    tags:
 *      - Auth
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/UserPushToken'
 *    responses:
 *      201:
 *        description: account created successfully
 *        content:
 *          application/json:
 *            schema:
 *      400:
 *        description: Invalid input data
 *        content:
 *          application/json:
 *            schema:
 *      429:
 *        description: Too many requests
 *        content:
 *          application/json:
 *            schema:
 *      500:
 *        description: Internal server error
 *        content:
 *          application/json:
 *            schema:
 */
router.patch(
    "/update-push-token",
    AuthMiddleware.validateUpdatePushToken,
    Auth0Middleware.appendUserId,
    updatePushToken
);

router.delete(
    "/remove-account",
    Auth0Middleware.checkJwt,
    Auth0Middleware.appendUserId,
    deleteAccount
)

module.exports = router;
