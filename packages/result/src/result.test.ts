import { Result } from './result';

const _test = () => {
  const hello = Result.wrap(
    (a: number, b: number) => {
      if (b === 0) {
        return Result.error(new Error('Me no like'));
      }

      return Result.ok(a + b);
    },
    () => new Error('Something went wrong')
  );

  const [sum, sumError] = hello(1, 2);

  if (sumError !== null) {
    return 0;
  }

  return (sum ?? 0) + 5;
};

const _testAsync = async () => {
  const hello = Result.wrap(
    async (a: number, b: number) => {
      if (b === 0) {
        return Result.error(new Error('Async nope'));
      }
      return Result.ok(a + b);
    },
    () => new Error('Async fail')
  );

  const [sum, sumError] = await hello(1, 2);

  if (sumError !== null) {
    return 0;
  }

  return (sum ?? 0) + 5;
};
