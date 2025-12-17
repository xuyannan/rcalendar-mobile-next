import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import Home from '../pages/Home';
import Index from '../pages/Index';
import StravaBind from '../pages/StravaBind';
import StravaCallback from '../pages/StravaCallback';
import WxAuthCallback from '../pages/WxAuthCallback';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Index />,
  },
  {
    element: <Layout />,
    children: [
      { path: 'home', element: <Home /> },
      { path: 'bind_strava', element: <StravaBind /> },
      { path: 'strava_callback', element: <StravaCallback /> },
      { path: 'wx_auth_callback', element: <WxAuthCallback /> },
    ]
  }
]);

export default router;
