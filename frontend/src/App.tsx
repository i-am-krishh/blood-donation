import React from 'react';
import { BrowserRouter } from "react-router-dom";
import AppRoutes from './AppRoutes';
import { UserProvider } from "./context/UserContext";
import { Toaster } from './components/ui/toaster';
import { useEffect } from 'react'


function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster />
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
