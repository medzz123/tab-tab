import { Link, type LinkComponentProps } from '@tanstack/react-router';

export const TLink: React.FC<LinkComponentProps & { children?: React.ReactNode }> = (props) => {
  return <Link {...props} />;
};
