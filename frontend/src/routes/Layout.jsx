import { useAuth } from "@clerk/clerk-react";
import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import NavBar from "../component/home/Navbar";
export const Layout = () => {
  return (
    <>
      <div className="layout h-screen">
        <div className="content">
          <Outlet />
        </div>
      </div>
    </>
  );
};
export const AuthLayout = () => {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <div className="layout h-screen">
      <div className="navbar h-[100px]">
        <NavBar />
      </div>
      <div className="content" style={{ height: "calc(100vh - 70px)" }}>
        <Outlet />
      </div>
    </div>
  );
};
