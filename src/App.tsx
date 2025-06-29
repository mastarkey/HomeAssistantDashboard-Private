import Dashboard from './components/Dashboard';
import { ToastProvider } from './contexts/ToastContext';
import { ToastContainer } from './components/Toast';

function App() {
  return (
    <ToastProvider>
      <Dashboard />
      <ToastContainer />
    </ToastProvider>
  );
}

export default App;