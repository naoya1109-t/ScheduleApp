import { Navigate, Route, Routes } from "react-router-dom"
import { Layout } from "./components/Layout"
import { AuthProvider } from "./context/AuthContext"
import { RequireAuth } from "./context/RequireAuth"
import { LoginPage } from "./pages/login/LoginPage"
import { AdminIndexPage } from "./pages/admin/AdminIndexPage"
import { UsersPage } from "./pages/admin/users/UsersPage"
import { HolidaysPage } from "./pages/admin/holidays/HolidaysPage"
import { BoardListPage } from "./pages/board/BoardListPage"
import { CalendarPage } from "./pages/calendar/CalendarPage"
import { MonthViewPage } from "./pages/calendar/MonthViewPage"
import { NewPostPage } from "./pages/board/NewPostPage"
import { PostDetailPage } from "./pages/board/PostDetailPage"
import { PostPermalinkRedirect } from "./pages/board/PostPermalinkRedirect"
import { RoomsPage } from "./pages/rooms/RoomsPage"
import { MeetingFinderPage } from "./pages/meetingFinder/MeetingFinderPage"
import { FilesPage } from "./pages/files/FilesPage"
import { FileDetailPage } from "./pages/files/FileDetailPage"
import { FilePermalinkRedirect } from "./pages/files/FilePermalinkRedirect"
import { TopPage } from "./pages/top/TopPage"
import { IncidentReportListPage } from "./pages/incidentReports/IncidentReportListPage"
import { NewIncidentReportPage } from "./pages/incidentReports/NewIncidentReportPage"
import { IncidentReportDetailPage } from "./pages/incidentReports/IncidentReportDetailPage"
import { TopSettingsPage } from "./pages/admin/topSettings/TopSettingsPage"
import { GroupOrderPage } from "./pages/admin/groupOrder/GroupOrderPage"
import { BulkDeletePage } from "./pages/admin/bulkDelete/BulkDeletePage"
import { RoomsAdminPage } from "./pages/admin/rooms/RoomsAdminPage"
import { NewRoomPage } from "./pages/admin/rooms/NewRoomPage"

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout>
                <TopPage />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/calendar/month/:userId"
          element={
            <RequireAuth>
              <Layout>
                <MonthViewPage />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/calendar"
          element={
            <RequireAuth>
              <Layout>
                <CalendarPage />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/rooms"
          element={
            <RequireAuth>
              <Layout>
                <RoomsPage />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/meeting-finder"
          element={
            <RequireAuth>
              <Layout>
                <MeetingFinderPage />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/files"
          element={
            <RequireAuth>
              <Layout>
                <FilesPage />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/files/link/:slug"
          element={
            <RequireAuth>
              <Layout>
                <FilePermalinkRedirect />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/files/:fileId"
          element={
            <RequireAuth>
              <Layout>
                <FileDetailPage />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/incident-reports/new"
          element={
            <RequireAuth>
              <Layout>
                <NewIncidentReportPage />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/incident-reports/:reportId"
          element={
            <RequireAuth>
              <Layout>
                <IncidentReportDetailPage />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/incident-reports"
          element={
            <RequireAuth>
              <Layout>
                <IncidentReportListPage />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/board"
          element={
            <RequireAuth>
              <Layout>
                <BoardListPage />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/board/new"
          element={
            <RequireAuth>
              <Layout>
                <NewPostPage />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/board/link/:slug"
          element={
            <RequireAuth>
              <Layout>
                <PostPermalinkRedirect />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/board/:postId"
          element={
            <RequireAuth>
              <Layout>
                <PostDetailPage />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth adminOnly>
              <Layout>
                <AdminIndexPage />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RequireAuth adminOnly>
              <Layout>
                <UsersPage />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/holidays"
          element={
            <RequireAuth adminOnly>
              <Layout>
                <HolidaysPage />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/top-settings"
          element={
            <RequireAuth adminOnly>
              <Layout>
                <TopSettingsPage />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/group-order"
          element={
            <RequireAuth adminOnly>
              <Layout>
                <GroupOrderPage />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/bulk-delete"
          element={
            <RequireAuth adminOnly>
              <Layout>
                <BulkDeletePage />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/rooms"
          element={
            <RequireAuth adminOnly>
              <Layout>
                <RoomsAdminPage />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/rooms/new"
          element={
            <RequireAuth adminOnly>
              <Layout>
                <NewRoomPage />
              </Layout>
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
