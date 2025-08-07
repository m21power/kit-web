import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UsernamePrompt } from './components/UsernamePrompt';
import { Workspace } from './components/Workspace';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UsernamePrompt />} />
        <Route path="/workspace/:username" element={<Workspace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;