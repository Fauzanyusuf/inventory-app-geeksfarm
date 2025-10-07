export class ApiError extends Error {
	constructor({ message, status = 0, errors = [], raw = null } = {}) {
		super(
			message || (errors && errors.length ? errors[0].message : "API Error")
		);
		this.name = "ApiError";
		this.status = status;
		this.errors = errors || [];
		this.raw = raw;
	}
}

export const parseErrorBody = async (response) => {
	// Attempt to parse JSON body and return structured error info
	try {
		const body = await response.json();
		// Support both { errors: [...] } and { message: '...' }
		return {
			message: body.message || null,
			errors: Array.isArray(body.errors) ? body.errors : [],
			raw: body,
		};
	} catch {
		return { message: null, errors: [], raw: null };
	}
};
