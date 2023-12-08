export class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
    }
}

export function asyncHandler(fun) {
    return (req, res, next) => {
        fun(req, res, next).catch(err => {
            next(err)
        })
    }
}

export const globalErrorHandel = (err, req, res, next) => {    
        prodMode(err, res)
}

const prodMode = (err, res) => {
    const code = err.statusCode || 500
    res.status(code).json({ ErrorMessage: err.message, statusCode: code })
}
