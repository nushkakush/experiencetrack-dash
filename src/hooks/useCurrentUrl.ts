import { useLocation } from 'react-router-dom';

export const useCurrentUrl = () => {
  const location = useLocation();
  const baseUrl = 'https://lit-cb3g6baa1-anushkas-projects-30c1e8f2.vercel.app';

  return `${baseUrl}${location.pathname}${location.search}`;
};
