/** biome-ignore-all lint/complexity/noBannedTypes: <ok> */
/** biome-ignore-all lint/suspicious/noConsole: <ok> */

import {
  type UseFormInput,
  type UseFormReturnType,
  useForm as useFormMantine,
} from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import type { z } from 'zod/v4';

type ZodEntity = z.ZodObject<z.ZodRawShape> | z.ZodSchema;

export type NestedKeys<T> = T extends object
  ? T extends Date | Function
    ? ''
    : {
        [K in keyof T & string]: Exclude<T[K], undefined | null> extends object
          ? Exclude<T[K], undefined | null> extends Date | Function
            ? K
            : Exclude<T[K], undefined | null> extends Array<infer U>
              ? U extends object
                ? K | `${K}.${number}.${NestedKeys<U>}`
                : K
              : K | `${K}.${NestedKeys<Exclude<T[K], undefined | null>>}`
          : K;
      }[keyof T & string]
  : '';

export type TypedForm<Z extends ZodEntity> = UseFormReturnType<z.infer<Z>> & {
  /**
   * The type definition does not show, but you can access nested arrays
   * like this: example.${index}.somethingHere
   * and whatever else the type def shows
   */
  controller: (path: NestedKeys<z.infer<Z>>) => {
    value: string | number | boolean | undefined | null;
    onChange: (value: string | number | boolean | undefined | null) => void;
    error: string | undefined;
    name: string;
  };
};

type AllowUndefPrimitives<T> = T extends string | number | boolean | Date
  ? T | undefined
  : T extends (infer U)[]
    ? Array<AllowUndefPrimitives<U>>
    : T extends object
      ? { [K in keyof T]: AllowUndefPrimitives<T[K]> }
      : T;

export const useForm = <Z extends ZodEntity>(
  schema: Z,
  formInput: UseFormInput<z.infer<typeof schema>> & {
    initial: AllowUndefPrimitives<z.infer<typeof schema>>;
    persistOptions?: {
      prefix: string;
      identifier: string;
    };
  }
): TypedForm<Z> => {
  type SchemaType = z.infer<typeof schema>;
  type SchemaKeys = NestedKeys<SchemaType>;

  // biome-ignore lint/suspicious/noExplicitAny: Its fine
  const form = useFormMantine<any>({
    validate: zod4Resolver(schema),
    initialValues: formInput?.initial,
    ...formInput,
  });

  const controller = (path: SchemaKeys) => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const { value, error } = form.getInputProps(path as string, {
      withError: true,
    });

    return {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      value: value as string | number | undefined | null,
      // biome-ignore lint/suspicious/noExplicitAny: Its fine
      onChange: (value: any) => form.setFieldValue(path, value),
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      error: error as string | undefined,
      name: path,
    };
  };

  return {
    controller,
    ...form,
  };
};
