import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * validate
 * ─────────
 * A middleware factory that validates `req.body` against a Zod schema.
 *
 * Usage in route files:
 *   router.post('/', validate(createCustomerSchema), createCustomer)
 *
 * On success:
 *   - `req.body` is replaced with the parsed (and coerced/trimmed) data
 *   - `next()` is called, passing control to the controller
 *
 * On failure:
 *   - Returns HTTP 400 with a structured errors array:
 *     {
 *       "success": false,
 *       "message": "Validation failed",
 *       "errors": [
 *         { "field": "email", "message": "Invalid email address" },
 *         { "field": "phone", "message": "Phone must be 10–15 digits" }
 *       ]
 *     }
 *
 * File location: src/middlewares/validate.ts
 */
export const validate =
  (schema: ZodSchema): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (result.success) {
      // Replace req.body with the parsed/coerced data (trimmed strings, etc.)
      req.body = result.data;
      next();
      return;
    }

    // Map Zod's issue list into a clean, flat array (Zod v4: .issues, not .errors)
    const errors = (result.error as ZodError).issues.map((e: ZodError['issues'][number]) => ({
      field: e.path.join('.') || 'body',
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  };
