import cors from "cors"
import express from "express"
import session from "express-session"
import { env } from "./config/env.js"
import { getPool } from "./config/db.js"
import { errorHandler } from "./middleware/errorHandler.js"
import { AuthService } from "./modules/auth/authService.js"
import { createAuthRoutes } from "./modules/auth/authRoutes.js"
import { createBoardRoutes } from "./modules/board/boardRoutes.js"
import { MssqlPostRepository } from "./modules/board/postRepository.mssql.js"
import { PostService } from "./modules/board/postService.js"
import { createCalendarRoutes } from "./modules/calendar/calendarRoutes.js"
import { CalendarService } from "./modules/calendar/calendarService.js"
import { MssqlEventRepository } from "./modules/calendar/calendarRepository.mssql.js"
import { createHolidayRoutes } from "./modules/holidays/holidayRoutes.js"
import { HolidayService } from "./modules/holidays/holidayService.js"
import { MssqlHolidayRepository } from "./modules/holidays/holidayRepository.mssql.js"
import { createGroupRoutes } from "./modules/groups/groupRoutes.js"
import { MssqlGroupRepository } from "./modules/groups/groupRepository.mssql.js"
import { MssqlOperationLogRepository } from "./modules/logs/operationLogRepository.mssql.js"
import { createRoomRoutes } from "./modules/rooms/roomRoutes.js"
import { RoomService } from "./modules/rooms/roomService.js"
import { MssqlRoomRepository } from "./modules/rooms/roomRepository.mssql.js"
import { MssqlReservationRepository } from "./modules/rooms/reservationRepository.mssql.js"
import { createTopPageRoutes } from "./modules/topPage/topPageRoutes.js"
import { TopPageService } from "./modules/topPage/topPageService.js"
import { MssqlTopPageSettingsRepository } from "./modules/topPage/topPageSettingsRepository.mssql.js"
import { MssqlUserRepository } from "./modules/users/userRepository.mssql.js"
import { UserService } from "./modules/users/userService.js"
import { createUserRoutes } from "./modules/users/userRoutes.js"

const app = express()

app.use(cors())
app.use(express.json())
app.use(
  session({
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 8,
    },
  }),
)

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" })
})

app.get("/api/health/db", async (_req, res) => {
  try {
    const pool = await getPool()
    await pool.request().query("SELECT 1 AS ok")
    res.json({ status: "ok" })
  } catch (error) {
    res.status(503).json({ status: "error", message: (error as Error).message })
  }
})

const userRepository = new MssqlUserRepository(getPool)
const authService = new AuthService(userRepository)
const userService = new UserService(userRepository)
const operationLogRepository = new MssqlOperationLogRepository(getPool)
const postRepository = new MssqlPostRepository(getPool)
const postService = new PostService(postRepository, operationLogRepository)
const eventRepository = new MssqlEventRepository(getPool)
const calendarService = new CalendarService(eventRepository)
const holidayRepository = new MssqlHolidayRepository(getPool)
const holidayService = new HolidayService(holidayRepository)
const groupRepository = new MssqlGroupRepository(getPool)
const topPageSettingsRepository = new MssqlTopPageSettingsRepository(getPool)
const topPageService = new TopPageService(calendarService, groupRepository, userRepository, topPageSettingsRepository)
const roomRepository = new MssqlRoomRepository(getPool)
const reservationRepository = new MssqlReservationRepository(getPool)
const roomService = new RoomService(roomRepository, reservationRepository, eventRepository)

app.use("/api/auth", createAuthRoutes(authService, userRepository))
app.use("/api/admin/users", createUserRoutes(userService))
app.use("/api/posts", createBoardRoutes(postService))
app.use("/api/calendar", createCalendarRoutes(calendarService))
app.use("/api/holidays", createHolidayRoutes(holidayService))
app.use("/api/groups", createGroupRoutes(groupRepository))
app.use("/api/top-page", createTopPageRoutes(topPageService))
app.use("/api/rooms", createRoomRoutes(roomService))

app.use(errorHandler)

app.listen(env.port, () => {
  console.log(`backend listening on port ${env.port}`)
})
