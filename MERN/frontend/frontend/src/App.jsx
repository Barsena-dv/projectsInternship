import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './router/AppRoutes';

const App = () => {
	return (
		<AuthProvider>
			<AppRoutes />
			<ToastContainer
				position={window.innerWidth < 640 ? "top-center" : "bottom-right"}
				autoClose={2500}
				hideProgressBar={false}
				newestOnTop
				closeOnClick
				pauseOnHover
				theme="colored"
			/>
		</AuthProvider>
	);
};

export default App;
