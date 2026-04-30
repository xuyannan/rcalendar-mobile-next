import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Home from '../pages/Home';
import IndexNew from '../pages/IndexNew';
import StravaBind from '../pages/StravaBind';
import StravaCallback from '../pages/StravaCallback';
import GarminCallback from '../pages/GarminCallback';
import CorosBind from '../pages/CorosBind';
import CorosCallback from '../pages/CorosCallback';
import WxAuthCallback from '../pages/WxAuthCallback';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import EventDashboard from '../pages/EventDashboard';
import Login from '../pages/Login';
import Register from '../pages/Register';
import UserCenter from '../pages/UserCenter';
import BindDevice from '../pages/UserCenter/BindDevice';
import AccountManage from '../pages/UserCenter/AccountManage';
import MyWorkouts from '../pages/UserCenter/MyWorkouts';
import StoreIndex from '../pages/Store/StoreIndex';
import StoreCheckout from '../pages/Store/StoreCheckout';
import StoreOrders from '../pages/Store/StoreOrders';
import StoreOrderDetail from '../pages/Store/StoreOrderDetail';

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
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/user',
    element: <UserCenter />,
    children: [
      { index: true, element: <Navigate to="/user/bindDevice" replace /> },
      { path: 'bindDevice', element: <BindDevice /> },
      { path: 'account', element: <AccountManage /> },
      { path: 'workouts', element: <MyWorkouts /> },
    ],
  },
  {
    element: <Layout />,
    children: [
      { path: 'home', element: <Home /> },
      { path: 'bind_strava', element: <StravaBind /> },
      { path: 'strava_callback', element: <StravaCallback /> },
      { path: 'garmin_callback', element: <GarminCallback /> },
      { path: 'bind_coros', element: <CorosBind /> },
      { path: 'coros_callback', element: <CorosCallback /> },
      { path: 'wx_auth_callback', element: <WxAuthCallback /> },
      { path: 'privacy', element: <PrivacyPolicy /> },
    ]
  },
  {
    path: '/store',
    element: <StoreIndex />,
  },
  {
    path: '/store/checkout',
    element: <StoreCheckout />,
  },
  {
    path: '/store/orders',
    element: <StoreOrders />,
  },
  {
    path: '/store/orders/:id',
    element: <StoreOrderDetail />,
  },
]);

export default router;
