import { useState } from 'react';
import { Box } from '@chakra-ui/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CodeEditor from './components/CodeEditor';
import Navbar from './components/Navbar';
import ResetPasswordPage from './pages/ResetPasswordPage';

function App() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    return token && username ? username : null;
  });

  const handleLogin = (username) => {
    localStorage.setItem("username", username);
    setUser(username);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/*" element={
          <Box minH="100vh" bg="gray.900" _light={{ bg: "white" }} color="gray.500">
            <Navbar user={user} onLogin={handleLogin} onLogout={handleLogout} />
            <CodeEditor user={user} />
          </Box>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;