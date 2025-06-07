class ApiResponse {
    static success(res, data = {}, message = "Success", statusCode = 200) {
        return res.status(statusCode).json({
            status: "success",
            message,
            data,
        });
    }

    static failure(res, message = "Failure", statusCode = 400, data = {}) {
        return res.status(statusCode).json({
            status: "failed",
            message,
            data,
        });
    }

    static error(res, message = "Internal Server Error", statusCode = 500, data = {}) {
        return res.status(statusCode).json({
            status: "error",
            message,
            data,
        });
    }
}

module.exports = ApiResponse;
