/** biome-ignore-all lint/suspicious/noExplicitAny: Its fine usage */
export type ResultType<T, E extends Error> = [value: T, error: null] | [value: null, error: E];

function ok<T, E extends Error = Error>(value: T): ResultType<T, E> {
  return [value, null];
}

function error<E extends Error>(err: E): [null, E] {
  return [null, err];
}

export function wrap<Args extends unknown[], T, EInner extends Error, EWrap extends Error>(
  fn: (...args: Args) => Promise<ResultType<T, EInner>>,
  mapError: (err: unknown) => EWrap
): (...args: Args) => Promise<ResultType<T, EInner | EWrap>>;

export function wrap<Args extends unknown[], T, EInner extends Error, EWrap extends Error>(
  fn: (...args: Args) => ResultType<T, EInner>,
  mapError: (err: unknown) => EWrap
): (...args: Args) => ResultType<T, EInner | EWrap>;

export function wrap(fn: (...args: any[]) => any, mapError: (err: unknown) => Error) {
  return (...args: any[]) => {
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return result.catch((err) => [null, mapError(err)]);
      }
      return result;
    } catch (err) {
      return [null, mapError(err)];
    }
  };
}

function toError(err: unknown): Error {
  if (err instanceof Error) return err;

  let message = '[could not convert error to string]';

  if (typeof err === 'object' && err !== null && 'message' in err) {
    const msg = err.message;
    if (typeof msg === 'string') message = msg;
  } else {
    try {
      message = String(err);
    } catch {}
  }

  return new Error(message);
}

function attempt<T>(fn: () => Promise<T>): Promise<ResultType<T, Error>>;
function attempt<T>(fn: () => T): ResultType<T, Error>;

function attempt(fn: () => any): any {
  try {
    const value = fn();
    if (value instanceof Promise) {
      return value.then((v) => [v, null]).catch((e) => [null, toError(e)]);
    }
    return [value, null];
  } catch (e) {
    return [null, toError(e)];
  }
}

async function retry<T, E extends Error>(
  fn: () => Promise<ResultType<T, E>>,
  opts: {
    attempts: number;
    delay: number | ((attempt: number) => number);
    condition?: (err: E) => boolean;
  }
): Promise<ResultType<T, E>> {
  let lastError: E | Error = new Error('Retry failed');

  for (let i = 0; i < opts.attempts; i++) {
    try {
      const res = await fn();
      if (res[1] === null) {
        return res;
      }

      if (opts.condition && !opts.condition(res[1])) {
        return res;
      }

      lastError = res[1];
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }

    if (i < opts.attempts - 1) {
      const ms = typeof opts.delay === 'number' ? opts.delay : opts.delay(i);
      await new Promise((resolve) => setTimeout(resolve, ms));
    }
  }

  return [null, lastError as E];
}

export const Result = {
  ok,
  error,
  wrap,
  try: attempt,
  retry,
};
