import bcrypt from "bcrypt"
import { FakeCustomerMasterRepository } from "./fakes/fakeCustomerMasterRepository.js"
import { FakeEventRepository } from "./fakes/fakeEventRepository.js"
import { FakeFileRepository } from "./fakes/fakeFileRepository.js"
import { FakeFolderRepository } from "./fakes/fakeFolderRepository.js"
import { FakeGroupRepository } from "./fakes/fakeGroupRepository.js"
import { FakeHolidayRepository } from "./fakes/fakeHolidayRepository.js"
import { FakeIncidentReportRepository } from "./fakes/fakeIncidentReportRepository.js"
import { FakeJobTitleRepository } from "./fakes/fakeJobTitleRepository.js"
import { FakeOperationLogRepository } from "./fakes/fakeOperationLogRepository.js"
import { FakePostRepository } from "./fakes/fakePostRepository.js"
import { FakeReservationRepository } from "./fakes/fakeReservationRepository.js"
import { FakeRoomRepository } from "./fakes/fakeRoomRepository.js"
import { FakeTopPageSettingsRepository } from "./fakes/fakeTopPageSettingsRepository.js"
import { FakeUserRepository } from "./fakes/fakeUserRepository.js"

function isoAt(daysFromToday: number, hour: number, minute: number): string {
  const date = new Date()
  date.setDate(date.getDate() + daysFromToday)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

export async function seedDevData() {
  const userRepository = new FakeUserRepository()
  const groupRepository = new FakeGroupRepository()
  const jobTitleRepository = new FakeJobTitleRepository()
  const eventRepository = new FakeEventRepository()
  const postRepository = new FakePostRepository()
  const holidayRepository = new FakeHolidayRepository()
  const roomRepository = new FakeRoomRepository()
  const reservationRepository = new FakeReservationRepository()
  const folderRepository = new FakeFolderRepository()
  const fileRepository = new FakeFileRepository()
  const incidentReportRepository = new FakeIncidentReportRepository()
  const customerMasterRepository = new FakeCustomerMasterRepository()
  const topPageSettingsRepository = new FakeTopPageSettingsRepository()
  const operationLogRepository = new FakeOperationLogRepository()

  const passwordHash = await bcrypt.hash("password123", 4)

  const managerTitle = await jobTitleRepository.create({ name: "部長" })
  const leaderTitle = await jobTitleRepository.create({ name: "主任" })
  await jobTitleRepository.create({ name: "一般" })

  const admin = userRepository.seed({
    loginId: "admin",
    passwordHash,
    name: "高橋 直哉",
    email: "takahashi@example.com",
    employeeNo: "0001",
    role: "admin",
    status: "active",
    jobTitleId: managerTitle.jobTitleId,
  })
  const staffA = userRepository.seed({
    loginId: "yamada",
    passwordHash,
    name: "山田 太郎",
    email: "yamada@example.com",
    employeeNo: "0002",
    role: "general",
    status: "active",
    jobTitleId: leaderTitle.jobTitleId,
  })
  const staffB = userRepository.seed({
    loginId: "sato",
    passwordHash,
    name: "佐藤 花子",
    email: "sato@example.com",
    employeeNo: "0003",
    role: "general",
    status: "active",
    jobTitleId: null,
  })
  const staffC = userRepository.seed({
    loginId: "suzuki",
    passwordHash,
    name: "鈴木 一郎",
    email: "suzuki@example.com",
    employeeNo: "0004",
    role: "general",
    status: "active",
    jobTitleId: null,
  })

  postRepository.setAuthorName(admin.userId, admin.name)
  postRepository.setAuthorName(staffA.userId, staffA.name)
  postRepository.setAuthorName(staffB.userId, staffB.name)
  reservationRepository.setReserverName(staffA.userId, staffA.name)
  reservationRepository.setReserverName(staffB.userId, staffB.name)
  incidentReportRepository.setUserName(staffA.userId, staffA.name)
  incidentReportRepository.setUserName(staffB.userId, staffB.name)
  fileRepository.setUpdaterName(admin.userId, admin.name)
  fileRepository.setUpdaterName(staffA.userId, staffA.name)

  groupRepository.addGroup({ groupId: 1, name: "営業部" })
  groupRepository.addGroup({ groupId: 2, name: "総務部" })
  groupRepository.seedMember(1, admin.userId, admin.name, 1)
  groupRepository.seedMember(1, staffA.userId, staffA.name, 2)
  groupRepository.seedMember(1, staffB.userId, staffB.name, 3)
  groupRepository.seedMember(2, staffC.userId, staffC.name, 1)
  // FakePostRepositoryは掲示板の可視性判定用に、所属グループを独自に保持する
  // (groupRepositoryとは別状態のため、こちらにも同じ所属関係を反映する)
  postRepository.setUserGroups(admin.userId, [1])
  postRepository.setUserGroups(staffA.userId, [1])
  postRepository.setUserGroups(staffB.userId, [1])
  postRepository.setUserGroups(staffC.userId, [2])

  await eventRepository.create({
    ownerId: admin.userId,
    createdBy: admin.userId,
    title: "定例MTG",
    startAt: isoAt(0, 10, 0),
    endAt: isoAt(0, 11, 0),
    visibility: "all",
    isHidden: false,
    isRecurring: false,
    recurrenceRule: "none",
    eventType: "personal",
  })
  await eventRepository.create({
    ownerId: staffA.userId,
    createdBy: staffA.userId,
    title: "来客対応",
    startAt: isoAt(1, 13, 0),
    endAt: isoAt(1, 14, 30),
    visibility: "all",
    isHidden: false,
    isRecurring: false,
    recurrenceRule: "none",
    eventType: "personal",
  })
  await eventRepository.create({
    ownerId: staffB.userId,
    createdBy: staffB.userId,
    title: "非公開の予定",
    startAt: isoAt(2, 9, 0),
    endAt: isoAt(2, 10, 0),
    visibility: "all",
    isHidden: true,
    isRecurring: false,
    recurrenceRule: "none",
    eventType: "personal",
  })
  await eventRepository.create({
    ownerId: admin.userId,
    createdBy: admin.userId,
    title: "夏季休暇",
    startAt: isoAt(3, 0, 0),
    endAt: isoAt(3, 23, 59),
    visibility: "all",
    isHidden: false,
    isRecurring: false,
    recurrenceRule: "none",
    eventType: "company_holiday",
  })

  await holidayRepository.create({
    holidayDate: isoAt(10, 0, 0).slice(0, 10),
    name: "サンプル祝日",
    fiscalYear: new Date().getFullYear(),
  })

  await postRepository.create({
    authorId: admin.userId,
    title: "【全社】年末年始休業のお知らせ",
    bodyHtml: "<p><b>12/29〜1/3</b>は休業とさせていただきます。</p>",
    visibilityScope: "company",
    groupId: null,
    permalinkSlug: "sample-slug-1",
  })
  await postRepository.create({
    authorId: staffA.userId,
    title: "【営業部】月次会議の資料を共有します",
    bodyHtml: "<p>添付の資料をご確認ください。<span style=\"color:#e2725b\">要返信</span></p>",
    visibilityScope: "group",
    groupId: 1,
    permalinkSlug: "sample-slug-2",
  })

  const room1 = await roomRepository.create({ name: "会議室A", memo: "定員6名・モニターあり" })
  await roomRepository.create({ name: "会議室B", memo: "定員4名" })
  await reservationRepository.createWithConflictCheck({
    roomId: room1.roomId,
    reserverId: staffA.userId,
    title: "定例MTG",
    startAt: isoAt(0, 11, 0),
    endAt: isoAt(0, 12, 0),
  })

  const rootFolder = await folderRepository.create("共有フォルダ", null)
  fileRepository.updaterNames.set(admin.userId, admin.name)
  await fileRepository.createFile({
    folderId: rootFolder.folderId,
    fileName: "2026年度_予算計画.xlsx",
    currentPath: "/dummy/budget.xlsx",
    updatedBy: admin.userId,
    permalinkSlug: "sample-file-slug-1",
  })

  await incidentReportRepository.create({
    customerCode: "C001",
    customerName: "アマゾンジャパン合同会社",
    salesRepId: staffA.userId,
    productName: "サンプル商品A",
    customerInfo: null,
    incidentCategory: "送り先間違い",
    incidentContent: "誤った住所に発送した",
    responseStatus: "再発送済み",
    actionTaken: "正しい送り先に再発送",
    description: null,
    returnWarehouse: null,
    occurredAt: isoAt(-1, 9, 0),
    reporterId: staffB.userId,
  })

  customerMasterRepository.entries.push(
    { customerCode: "C001", customerName: "アマゾンジャパン合同会社", salesRepId: staffA.userId },
    { customerCode: "C002", customerName: "株式会社サンプル商事", salesRepId: staffB.userId },
  )

  jobTitleRepository.setUserRepository(userRepository)

  return {
    userRepository,
    groupRepository,
    jobTitleRepository,
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
  }
}
