import { Result, type ResultType } from '@template/result';
import type { Json } from '@template/shared/json';
import type { ZodEntity } from '@template/shared/zod';
import { z } from 'zod/v4';

type JsonParse = <Schema extends ZodEntity | undefined>(options: {
  jsonString: string;
  schema: Schema;
}) => ResultType<Schema extends undefined ? Json : z.infer<NonNullable<Schema>>, Error>;

export const jsonParse: JsonParse = (options) => {
  const { schema } = options;

  const jsonString = options.jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');

  try {
    const parsed = JSON.parse(jsonString);

    if (parsed === null || parsed === undefined || typeof parsed !== 'object') {
      return Result.error(new Error('Parsed data was not of type object'));
    }

    if (!schema) {
      return Result.ok(parsed);
    }

    const validate = schema.safeParse(parsed);

    if (!validate.success) {
      return Result.error(new Error(`Validation failed: ${z.prettifyError(validate.error)}`));
    }

    return Result.ok(validate.data);
  } catch {
    return Result.error(new Error('Failed to json stringify'));
  }
};
