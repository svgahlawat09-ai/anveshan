import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import LandingPage from "@/pages/LandingPage";
import InvestigationPage from "@/pages/InvestigationPage";
import ResultsPage from "@/pages/ResultsPage";
import ReportPage from "@/pages/ReportPage";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/investigate" element={<InvestigationPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/report" element={<ReportPage />} />
      </Routes>
      <Toaster />
    </>
  );
}
