import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeProvider } from "next-themes";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CRM from "./pages/CRM";
import Metrics from "./pages/Metrics";
import WhatsApp from "./pages/WhatsApp";
import Admin from "./pages/Admin";
import ScriptGenerator from "./pages/ScriptGenerator";
import StrategicAnalysis from "./pages/StrategicAnalysis";
import ClientBriefingForm from "./pages/ClientBriefingForm";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import Checkout from "./pages/Checkout";
import CarouselGenerator from "./pages/CarouselGenerator";
import PdfSettings from "./pages/PdfSettings";
import DiagnosticQuiz from "./pages/DiagnosticQuiz";
import AdminDiagnostic from "./pages/AdminDiagnostic";
import Configuracoes from "./pages/Configuracoes";
import InterfaceSettings from "./pages/InterfaceSettings";
import FormSettingsPage from "./pages/FormSettings";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/crm" element={<ProtectedRoute><CRM /></ProtectedRoute>} />
            <Route path="/metrics" element={<ProtectedRoute><Metrics /></ProtectedRoute>} />
            <Route path="/whatsapp" element={<ProtectedRoute><WhatsApp /></ProtectedRoute>} />
            <Route path="/gerador" element={<ProtectedRoute><ScriptGenerator /></ProtectedRoute>} />
            <Route path="/analise-estrategica" element={<ProtectedRoute><StrategicAnalysis /></ProtectedRoute>} />
            <Route path="/carrossel" element={<ProtectedRoute><CarouselGenerator /></ProtectedRoute>} />
            <Route path="/admin" element={<Navigate to="/configuracoes/usuarios" replace />} />
            <Route path="/admin/diagnostico" element={<ProtectedRoute adminOnly><AdminDiagnostic /></ProtectedRoute>} />
            <Route path="/pdf-settings" element={<Navigate to="/configuracoes/pdf" replace />} />
            <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
            <Route path="/configuracoes/usuarios" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
            <Route path="/configuracoes/interface" element={<ProtectedRoute><InterfaceSettings /></ProtectedRoute>} />
            <Route path="/configuracoes/formularios" element={<ProtectedRoute><FormSettingsPage /></ProtectedRoute>} />
            <Route path="/configuracoes/pdf" element={<ProtectedRoute><PdfSettings /></ProtectedRoute>} />
            <Route path="/checkout/:plan" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/briefing/:token" element={<ClientBriefingForm />} />
            <Route path="/diagnostico" element={<DiagnosticQuiz />} />
            <Route path="/diagnostico/:type" element={<DiagnosticQuiz />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
