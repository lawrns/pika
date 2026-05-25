import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/pages/LandingPage';
import DashboardOverviewPage from './components/pages/DashboardOverviewPage';
import CreateRequestPage from './components/pages/CreateRequestPage';
import PublicPayerPage from './components/pages/PublicPayerPage';
import ConfirmationPage from './components/pages/ConfirmationPage';
import { DesignCanvas, DCSection, DCArtboard } from './components/pika/DesignCanvas';
import { IphoneFrame } from './components/pika/IphoneFrame';

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<DashboardOverviewPage />} />
      <Route path="/app/requests/new" element={<CreateRequestPage />} />
      <Route path="/p/:slug" element={<PublicPayerPage />} />
      <Route path="/paid/:paymentId" element={<ConfirmationPage />} />
      <Route path="/canvas" element={
        <DesignCanvas minScale={0.2} maxScale={3}>
          {/* ── SECTION 1: PUBLIC LANDING ── */}
          <DCSection title="Onboarding & Landing" subtitle="Marketing site and landing presentation">
            <DCArtboard label="Landing Page (Web Desktop Preview)">
              <div style={{ width: 1200, height: 720, overflow: 'auto', scale: '0.8', transformOrigin: 'top left' }}>
                <LandingPage />
              </div>
            </DCArtboard>
          </DCSection>

          {/* ── SECTION 2: REQUESTER DASHBOARD FLOW ── */}
          <DCSection title="Requester Flows" subtitle="Dashboard, setup checklists, and link creation">
            <DCArtboard label="1. Requester Dashboard">
              <IphoneFrame>
                <DashboardOverviewPage />
              </IphoneFrame>
            </DCArtboard>
            <DCArtboard label="2. Create Request Page">
              <IphoneFrame>
                <CreateRequestPage />
              </IphoneFrame>
            </DCArtboard>
          </DCSection>

          {/* ── SECTION 3: PAYER FLOW ── */}
          <DCSection title="Payer & Confirmation Flow" subtitle="App-optional payment layers, SPEI deep links, and receipts">
            <DCArtboard label="1. Public Payer Page (/p/r_tac)">
              <IphoneFrame>
                <PublicPayerPage />
              </IphoneFrame>
            </DCArtboard>
            <DCArtboard label="2. Confirmation Receipt">
              <IphoneFrame>
                <ConfirmationPage />
              </IphoneFrame>
            </DCArtboard>
          </DCSection>
        </DesignCanvas>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return <AppContent />;
}
