import { Slide, ToastContainer } from 'react-toastify'
import AppRoutes from './router/AppRoutes'
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
