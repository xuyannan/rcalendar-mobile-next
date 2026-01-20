import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import Home from '../pages/Home';
import IndexNew from '../pages/IndexNew';
import StravaBind from '../pages/StravaBind';
import StravaCallback from '../pages/StravaCallback';
import GarminBind from '../pages/GarminBind';
import GarminCallback from '../pages/GarminCallback';
import CorosBind from '../pages/CorosBind';
import CorosCallback from '../pages/CorosCallback';
import WxAuthCallback from '../pages/WxAuthCallback';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import EventDashboard from '../pages/EventDashboard';

const router = createBrowserRouter([
  {
    path: '/',
    element: <IndexNew />,
  },
  {
    path: '/events/:id/dashboard',
    element: <EventDashboard />,
  },
  {
    element: <Layout />,
    children: [
      { path: 'home', element: <Home /> },
      { path: 'bind_strava', element: <StravaBind /> },
      { path: 'strava_callback', element: <StravaCallback /> },
      { path: 'bind_garmin', element: <GarminBind /> },
      { path: 'garmin_callback', element: <GarminCallback /> },
      { path: 'bind_coros', element: <CorosBind /> },
      { path: 'coros_callback', element: <CorosCallback /> },
      { path: 'wx_auth_callback', element: <WxAuthCallback /> },
      { path: 'privacy', element: <PrivacyPolicy /> },
    ]
  }
]);

export default router;
