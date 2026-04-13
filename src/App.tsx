import React, { Suspense, lazy } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import PermissionRoute from "./components/PermissionRoute.tsx";
import SuperadminRoute from "./components/SuperadminRoute.tsx";
import LoadingScreen from "./layouts/LoadingScreen.tsx";
import AuthInitializer from "./components/auth/AuthInitializer.tsx";
import { ClipsProvider } from "./contexts/ClipsContext.tsx";
import { useAppSelector } from "./store";
// import "./App.css";

const queryClient = new QueryClient();

// const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/LoginPage"));
const Signup = lazy(() => import("./pages/SignupPage"));
const LoginSSO = lazy(() => import("./pages/SSOPage"));
const Dashboard = lazy(() => import("./pages/DashboardPage"));
const Clips = lazy(() => import("./pages/ClipsPage"));
const MyHighlights = lazy(() => import("./pages/Highlights.tsx"));
const Published = lazy(() => import("./pages/PublishedPage"));
const LiveVideo = lazy(() => import("./pages/LiveVideoPage.tsx"));
const EditorPage = lazy(() => import("./pages/HighlightEditorPage.tsx"));
const ClipEditorPage = lazy(() => import("./pages/ClipEditorPage.tsx"));
const AutoFlipPage = lazy(() => import("./pages/AutoFlipPage.tsx"));
const AssetsPage = lazy(() => import("./pages/AssetsPage.tsx"));
const ManualHighlightPage = lazy(() => import("./pages/ManualHighlightPage.tsx"));
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage.tsx"));
const PublishingPage = lazy(() => import("./pages/PublishingPage.tsx"));
const OrganizationsPage = lazy(() => import("./pages/OrganizationsPage.tsx"));
const OrganizationDetailPage = lazy(() => import("./pages/OrganizationDetailPage.tsx"));
const MonitoringPage = lazy(() => import("./pages/MonitoringPage.tsx"));

/** For "/" and "/dashboard": superadmin goes to Monitoring, others see Dashboard. */
function DashboardOrRedirect() {
  const { user } = useAppSelector((state) => state.auth);
  if (user?.role === "superadmin") {
    return <Navigate to="/monitoring" replace />;
  }
  return (
    <ClipsProvider>
      <Dashboard />
    </ClipsProvider>
  );
}

/** Catch-all: superadmin → /monitoring, others → /dashboard. */
function DefaultRedirect() {
  const { user } = useAppSelector((state) => state.auth);
  return <Navigate to={user?.role === "superadmin" ? "/monitoring" : "/dashboard"} replace />;
}

type ErrorBoundaryProps = { children: React.ReactNode };
type ErrorBoundaryState = { hasError: boolean; error: Error | null };

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };

  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: "red", padding: 24, textAlign: "center" }}>
          <h2>Something went wrong.</h2>
          <pre>{this.state.error && this.state.error.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <AuthInitializer>
            <BrowserRouter>
              <Suspense
                fallback={
                  <div className="flex items-center justify-center min-h-screen">
                    <LoadingScreen />
                  </div>
                }
              >
                <>
                  <Routes>
                    {/* <Route path="/" element={<Index />} /> */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/login-sso" element={<LoginSSO />} />
                    <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

                    <Route element={<ProtectedRoute />}>
                      <Route element={<PermissionRoute />}>
                        <Route path="/" element={<DashboardOrRedirect />} />
                        <Route path="/dashboard" element={<DashboardOrRedirect />} />
                        <Route path="/clips/:streamId" element={<Clips page="clips" />} />
                        <Route path="/my-highlights" element={<MyHighlights page="my-highlights" />} />
                        <Route path="/publish-history" element={<Published page="/publish-history" />} />
                        <Route path="/live-video/:streamId" element={<LiveVideo page="live-video" />} />
                        <Route path="/editor-page/:folderId" element={<EditorPage page="editor-page" />} />
                        <Route path="/clip-editor" element={<ClipEditorPage page="clipeditor-page" />} />
                        <Route path="/auto-flip/:clipId" element={<AutoFlipPage page="auto-flip" />} />
                        <Route path="/assets" element={<AssetsPage />} />
                        <Route path="/create-highlight" element={<ManualHighlightPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/publish/:clipId" element={<PublishingPage />} />
                      </Route>
                      <Route element={<SuperadminRoute />}>
                        <Route path="/organizations" element={<OrganizationsPage />} />
                        <Route path="/organizations/:orgId" element={<OrganizationDetailPage />} />
                        <Route path="/monitoring" element={<MonitoringPage />} />
                      </Route>
                      <Route path="*" element={<DefaultRedirect />} />
                    </Route>

                    {/* <Route
                path="*"
                element={
                  isLoggedIn ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              /> */}
                  </Routes>

                  <Toaster
                    position="top-right"
                    closeButton
                    toastOptions={{
                      style: {
                        background: "#1B1B1B",
                        color: "#fff",
                        border: "1px solid #373737",
                      },
                    }}
                  />
                </>
              </Suspense>
            </BrowserRouter>
          </AuthInitializer>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );

}

export default App;

