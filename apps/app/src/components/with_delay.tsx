import { Center, Loader } from '@mantine/core';
import { useEffect, useState } from 'react';

export const withDelay = (Component: React.FC): React.FC => {
  const DelayedComponent: React.FC = () => {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const waitParam = urlParams.get('redirectWait');

      if (waitParam) {
        const waitAmount = parseInt(waitParam);

        if (isNaN(waitAmount) || waitAmount <= 0) {
          setIsReady(true);
        } else {
          const timer = setTimeout(() => {
            urlParams.delete('redirectWait');
            const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
            window.history.replaceState({}, '', newUrl);
            setIsReady(true);
          }, waitAmount * 1000);
          return () => clearTimeout(timer);
        }

        urlParams.delete('redirectWait');
        const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
        window.history.replaceState({}, '', newUrl);
      } else {
        setIsReady(true);
      }
    }, []);

    return isReady ? (
      <Component />
    ) : (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  };

  return DelayedComponent;
};
