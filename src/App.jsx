import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './features/dashboard/Dashboard';
import { Shows } from './features/shows/Shows';
import { ShowAttendeesPage } from './features/shows/ShowAttendeesPage';
import { People } from './features/people/People';
import { PersonHistoryPage } from './features/people/PersonHistoryPage';
import { Sales } from './features/sales/Sales';
import { Reports } from './features/reports/Reports';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="shows" element={<Shows />} />
          <Route path="shows/:id/attendees" element={<ShowAttendeesPage />} />
          <Route path="people" element={<People />} />
          <Route path="people/:id/history" element={<PersonHistoryPage />} />
          <Route path="sales" element={<Sales />} />
          <Route path="reports" element={<Reports />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
