import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import AppRoutes from './router/AppRoutes'
import { ToastContainer,Slide } from 'react-toastify'
// import './App.css'

function App() {

  return (
    <>
      <AppRoutes />
      <ToastContainer
position="bottom-right"
autoClose={5000}
hideProgressBar={false}
newestOnTop={false}
closeOnClick={false}
rtl={false}
pauseOnFocusLoss
draggable
pauseOnHover
theme="light"
transition={Slide}
/>
    </>
  )
}

export default App
