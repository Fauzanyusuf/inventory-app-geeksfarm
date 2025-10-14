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
	try {
		const body = await response.json();
		return {
			message: body.message || null,
			errors: Array.isArray(body.errors) ? body.errors : [],
			raw: body,
		};
	} catch {
		return { message: null, errors: [], raw: null };
	}
};
