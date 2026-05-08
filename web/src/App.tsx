import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Simulate } from './pages/Simulate';
import { Result } from './pages/Result';
import { Broadcast } from './pages/Broadcast';
import { CustomXIBuilder } from './pages/CustomXIBuilder';
import { TeamDetail } from './pages/TeamDetail';
import { PlayerBio } from './pages/PlayerBio';
import { Admin } from './pages/Admin';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/simulate" element={<Simulate />} />
        <Route path="/result" element={<Result />} />
        <Route path="/broadcast" element={<Broadcast />} />
        <Route path="/custom-xi" element={<CustomXIBuilder />} />
        <Route path="/team/:teamId" element={<TeamDetail />} />
        <Route path="/player/:playerId" element={<PlayerBio />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
