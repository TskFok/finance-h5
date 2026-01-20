import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import AddExpense from './pages/AddExpense';
import AddIncome from './pages/AddIncome';
import Stats from './pages/Stats';
import { storage } from './utils/storage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = storage.getToken();
  return token ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/expense/add"
          element={
            <PrivateRoute>
              <AddExpense />
            </PrivateRoute>
          }
        />
        <Route
          path="/income/add"
          element={
            <PrivateRoute>
              <AddIncome />
            </PrivateRoute>
          }
        />
        <Route
          path="/stats"
          element={
            <PrivateRoute>
              <Stats />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/home" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
