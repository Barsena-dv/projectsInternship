import axios from "axios";
import { useEffect, useState } from "react";
import { Slide, ToastContainer } from "react-toastify";
import AppRoutes from "./router/AppRoutes";

const getToastTheme = () =>
  document.documentElement.classList.contains("dark") ? "dark" : "light";

function App() {
  const [toastTheme, setToastTheme] = useState(getToastTheme);

  useEffect(() => {
    axios.defaults.baseURL = "http://localhost:3000";

    const interceptorId = axios.interceptors.request.use((config) => {
      const token = localStorage.getItem("token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    });

    return () => {
      axios.interceptors.request.eject(interceptorId);
    };
  }, []);

  useEffect(() => {
    const rootElement = document.documentElement;
    const observer = new MutationObserver(() => {
      setToastTheme(getToastTheme());
    });

    observer.observe(rootElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

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
        theme={toastTheme}
        transition={Slide}
      />
    </>
  );
}

export default App;
