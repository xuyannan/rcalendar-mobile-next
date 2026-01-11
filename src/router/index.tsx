import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import Home from '../pages/Home';
import Index from '../pages/Index';
import StravaBind from '../pages/StravaBind';
import StravaCallback from '../pages/StravaCallback';
import GarminBind from '../pages/GarminBind';
import GarminCallback from '../pages/GarminCallback';
import WxAuthCallback from '../pages/WxAuthCallback';
import PrivacyPolicy from '../pages/PrivacyPolicy';

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
      { path: 'bind_garmin', element: <GarminBind /> },
      { path: 'garmin_callback', element: <GarminCallback /> },
      { path: 'wx_auth_callback', element: <WxAuthCallback /> },
      { path: 'privacy', element: <PrivacyPolicy /> },
    ]
  }
]);

export default router;
