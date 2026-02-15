import { useAuth, SignedIn } from '@clerk/clerk-react'
import React from 'react'
import {Outlet, useNavigate} from 'react-router-dom'
import NavBar from '../component/home/Navbar'
export const Layout = () => {
  return (
    <>
    <div className="layout h-screen">
    <div className="content" >
      <Outlet />
    </div>
  </div>
    </>
  )
}
export const AuthLayout = () => {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  // Redirect the user if they are not signed in
  if (!isSignedIn) {
    navigate('/sign-in', { replace: true });
    return null; // Avoid rendering anything else while redirecting
  }

  return (
    <div className="layout h-screen">
      <div className="navbar h-[100px]">
        <NavBar />
      </div>
      <div className="content" style={{ height: 'calc(100vh - 70px)' }}>
        <Outlet />
      </div>
    </div>
  );
};
