import "dotenv/config"
import cors from "cors"
import express from "express"
import session from "express-session"
import { errorHandler } from "../middleware/errorHandler.js"
import { AuthService } from "../modules/auth/authService.js"
import { createAuthRoutes } from "../modules/auth/authRoutes.js"
import { createBoardRoutes } from "../modules/board/boardRoutes.js"
import { PostService } from "../modules/board/postService.js"
import { CalendarService } from "../modules/calendar/calendarService.js"
import { createCalendarRoutes } from "../modules/calendar/calendarRoutes.js"
import { createFileRoutes } from "../modules/files/fileRoutes.js"
import { FileService } from "../modules/files/fileService.js"
import { createGroupRoutes } from "../modules/groups/groupRoutes.js"
import { createHolidayRoutes } from "../modules/holidays/holidayRoutes.js"
import { HolidayService } from "../modules/holidays/holidayService.js"
import { HttpJapaneseHolidaySource } from "../modules/holidays/japaneseHolidaySource.js"
import { createIncidentReportRoutes } from "../modules/incidentReports/incidentReportRoutes.js"
import { IncidentReportService } from "../modules/incidentReports/incidentReportService.js"
import { createMeetingFinderRoutes } from "../modules/meetingFinder/meetingFinderRoutes.js"
import { MeetingFinderService } from "../modules/meetingFinder/meetingFinderService.js"
import { createRoomRoutes } from "../modules/rooms/roomRoutes.js"
import { RoomService } from "../modules/rooms/roomService.js"
import { createTopPageRoutes } from "../modules/topPage/topPageRoutes.js"
import { TopPageService } from "../modules/topPage/topPageService.js"
import { createDirectoryRoutes } from "../modules/users/directoryRoutes.js"
import { UserService } from "../modules/users/userService.js"
import { createUserRoutes } from "../modules/users/userRoutes.js"
import { seedDevData } from "./seed.js"

const PORT = Number(process.env.PORT ?? 3001)

async function main() {
  const {
    userRepository,
    groupRepository,
    eventRepository,
    postRepository,
    holidayRepository,
    roomRepository,
    reservationRepository,
    folderRepository,
    fileRepository,
    incidentReportRepository,
    customerMasterRepository,
    topPageSettingsRepository,
    operationLogRepository,
  } = await seedDevData()

  const app = express()
  app.use(cors())
  app.use(express.json())
  app.use(
    session({
      secret: "dev-mock-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, secure: false, maxAge: 1000 * 60 * 60 * 8 },
    }),
  )

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }))
  app.get("/api/health/db", (_req, res) => res.json({ status: "ok", note: "mock mode: no real DB" }))

  const authService = new AuthService(userRepository)
  const userService = new UserService(userRepository)
  const calendarService = new CalendarService(eventRepository)
  const postService = new PostService(postRepository, operationLogRepository, "./storage")
  const holidayService = new HolidayService(holidayRepository, new HttpJapaneseHolidaySource())
  const topPageService = new TopPageService(calendarService, groupRepository, userRepository, topPageSettingsRepository)
  const roomService = new RoomService(roomRepository, reservationRepository, eventRepository)
  const fileService = new FileService(fileRepository, folderRepository, operationLogRepository, "./storage")
  const incidentReportService = new IncidentReportService(
    incidentReportRepository,
    customerMasterRepository,
    operationLogRepository,
  )
  const meetingFinderService = new MeetingFinderService(calendarService, holidayService)

  app.use("/api/auth", createAuthRoutes(authService, userRepository))
  app.use("/api/admin/users", createUserRoutes(userService))
  app.use("/api/users", createDirectoryRoutes(userService))
  app.use("/api/posts", createBoardRoutes(postService, "./storage"))
  app.use("/api/calendar", createCalendarRoutes(calendarService))
  app.use("/api/holidays", createHolidayRoutes(holidayService))
  app.use("/api/groups", createGroupRoutes(groupRepository))
  app.use("/api/top-page", createTopPageRoutes(topPageService))
  app.use("/api/rooms", createRoomRoutes(roomService))
  app.use("/api/files", createFileRoutes(fileService, "./storage"))
  app.use("/api/incident-reports", createIncidentReportRoutes(incidentReportService))
  app.use("/api/meeting-finder", createMeetingFinderRoutes(meetingFinderService))

  app.use(errorHandler)

  app.listen(PORT, () => {
    console.log(`[mock] backend listening on port ${PORT}`)
    console.log("[mock] ログイン用アカウント(いずれもパスワード: password123)")
    console.log("[mock]   admin  / password123 (管理者: 高橋 直哉)")
    console.log("[mock]   yamada / password123 (一般: 山田 太郎)")
    console.log("[mock]   sato   / password123 (一般: 佐藤 花子)")
    console.log("[mock]   suzuki / password123 (一般: 鈴木 一郎)")
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
