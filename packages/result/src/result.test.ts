import { ResultType } from './result';

const _test = () => {
  const hello = ResultType.wrap(
    (a: number, b: number) => {
      if (b === 0) {
        return ResultType.error(new Error('Me no like'));
      }

      return ResultType.ok(a + b);
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
  const hello = ResultType.wrap(
    async (a: number, b: number) => {
      if (b === 0) {
        return ResultType.error(new Error('Async nope'));
      }
      return ResultType.ok(a + b);
    },
    () => new Error('Async fail')
  );

  const [sum, sumError] = await hello(1, 2);

  if (sumError !== null) {
    return 0;
  }

  return (sum ?? 0) + 5;
};
