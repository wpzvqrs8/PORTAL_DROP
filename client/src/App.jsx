import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import JoinPortal from './pages/JoinPortal';
import CreatePortal from './pages/CreatePortal';
import PortalRoom from './pages/PortalRoom';
import IdentityPrompt from './components/IdentityPrompt';

function App() {
  return (
    <BrowserRouter>
      <IdentityPrompt>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/join" element={<JoinPortal />} />
          <Route path="/create" element={<CreatePortal />} />
          <Route path="/room/:code" element={<PortalRoom />} />
        </Routes>
      </IdentityPrompt>
    </BrowserRouter>
  );
}

export default App;
