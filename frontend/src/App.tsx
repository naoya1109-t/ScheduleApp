import { Navigate, Route, Routes } from "react-router-dom"
import { Layout } from "./components/Layout"
import { AuthProvider } from "./context/AuthContext"
import { RequireAuth } from "./context/RequireAuth"
import { LoginPage } from "./pages/login/LoginPage"
import { UsersPage } from "./pages/admin/users/UsersPage"
import { HolidaysPage } from "./pages/admin/holidays/HolidaysPage"
import { BoardListPage } from "./pages/board/BoardListPage"
import { CalendarPage } from "./pages/calendar/CalendarPage"
import { MonthViewPage } from "./pages/calendar/MonthViewPage"
import { NewPostPage } from "./pages/board/NewPostPage"
import { PostDetailPage } from "./pages/board/PostDetailPage"
import { PostPermalinkRedirect } from "./pages/board/PostPermalinkRedirect"
import { RoomsPage } from "./pages/rooms/RoomsPage"
import { TopPage } from "./pages/top/TopPage"

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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
