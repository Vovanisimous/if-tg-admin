import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import BookingsPage from './pages/BookingsPage';
import VisitorsPage from './pages/VisitorsPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<BookingsPage />} />
          <Route path="/visitors" element={<VisitorsPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
