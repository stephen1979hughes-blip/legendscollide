import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Simulate } from './pages/Simulate';
import { Result } from './pages/Result';
import { Broadcast } from './pages/Broadcast';
import { CustomXIBuilder } from './pages/CustomXIBuilder';
import { SavedCustomXIs } from './pages/SavedCustomXIs';
import { Teams } from './pages/Teams';
import { TeamDetail } from './pages/TeamDetail';
import { Rankings } from './pages/Rankings';
import { PlayerBio } from './pages/PlayerBio';
import { Admin } from './pages/Admin';
import { DailyChallenge } from './pages/DailyChallenge';
import { DailyResult } from './pages/DailyResult';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/simulate" element={<Simulate />} />
        <Route path="/result" element={<Result />} />
        <Route path="/broadcast" element={<Broadcast />} />
        <Route path="/custom-xi" element={<CustomXIBuilder />} />
        <Route path="/saved-xis" element={<SavedCustomXIs />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/team/:teamId" element={<TeamDetail />} />
        <Route path="/rankings" element={<Rankings />} />
        <Route path="/player/:playerId" element={<PlayerBio />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/daily" element={<DailyChallenge />} />
        <Route path="/daily/result" element={<DailyResult />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
