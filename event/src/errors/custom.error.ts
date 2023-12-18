type ErrorItem = {
  statusCode: number | string;
  message: string;
  referencedBy?: string;
};

class CustomError extends Error {
  statusCode: number | string;
  message: string;
  errors?: ErrorItem[];

  constructor(
    statusCode: number | string,
    message: string,
    errors?: ErrorItem[]
  ) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    if (errors) {
      this.errors = errors;
    }
  }
}

export default CustomError;

class CustomAvalaraError extends Error {
  code: string;
  target: string;
  details: Array<unknown>;

  constructor(
    message: string,
    {
      code,
      target,
      details,
    }: { code: string; target: string; details: Array<unknown> }
  ) {
    super(message);
    this.code = code;
    this.target = target;
    this.details = details;
  }
}

export const avalaraErrorBody = {
  code: 'CannotModifyLockedTransaction',
  target: 'Unknown',
  details: [
    {
      code: 'CannotModifyLockedTransaction',
      number: 1100,
      message: 'Modifying a locked document is not allowed.',
      description: 'Document -0- is locked. Modification is not allowed.',
      faultCode: 'Client',
      helpLink:
        'http://developer.avalara.com/avatax/errors/CannotModifyLockedTransaction',
      severity: 'Error',
    },
  ],
};
export { CustomAvalaraError };
