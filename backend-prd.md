# Edu-Sync Backend — PRD v2

## 1. Overview

MERN backend (Node.js + Express.js + MongoDB/Mongoose) for Edu-Sync college management. Five roles: Admin, Principal, HOD, Faculty, Student.

---

## 2. Key Feature Changes (v2)

> [!IMPORTANT]
> These are the new/changed requirements from v1:

1. **Auto Timetable Generation** — Admin uploads a CSV/Excel of faculty workload data. The system auto-generates timetables for all classes based on department rules (BCA: 20 hrs/week = 12 lab + 8 theory; BBA/BCOM/commerce: 16 hrs/week).
2. **Leave ↔ Timetable Integration** — Faculty leave → HOD approves. HOD leave → Principal approves. Approved leaves reflect on the timetable (slot marked as "on leave").
3. **Admin can manage HOD & Faculty** — Same as Principal. Includes bulk CSV/Excel import of staff with auto-generated usernames & passwords.
4. **Student Self-Registration** — Students register themselves (unique constraint: `email` + `phone` combo). After registration → can login. No duplicates.
5. **Faculty credential visibility** — Admin can view username/password (stored encrypted, decryptable) of any faculty/HOD via search/filter/sort, so they can relay credentials when asked.

---

## 3. Database Schema

### 3.1 Users (Auth)

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | |
| `username` | String (unique, indexed) | Auto-generated for staff: `firstname.lastname` or `dept.serial` |
| `email` | String (unique, indexed) | |
| `passwordHash` | String | bcrypt hashed |
| `passwordPlain` | String (encrypted) | AES-256 encrypted — only decryptable by admin for credential relay |
| `role` | Enum | `admin`, `principal`, `hod`, `faculty`, `student` |
| `isActive` | Boolean | Default: true |
| `lastLogin` | Date | |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

> [!NOTE]
> `passwordPlain` is AES-256-CBC encrypted (not plaintext). Only the admin API can decrypt it using `CREDENTIAL_ENCRYPTION_KEY` from `.env`. This is a deliberate design choice per the user's requirement that admin can relay credentials to staff.

### 3.2 Students

| Field | Type | Notes |
|-------|------|-------|
| `userId` | ObjectId → Users | |
| `registerNumber` | String (unique) | Auto: `{DEPT}-{YEAR}-{SERIAL}` |
| `firstName`, `lastName` | String | Required |
| `dateOfBirth` | Date | |
| `gender` | Enum | `male`, `female`, `other` |
| `bloodGroup`, `category` | String | |
| `fatherName`, `motherName` | String | |
| `phone` | String | **Unique constraint** (with email) |
| `address` | String | |
| `departmentId` → Departments | ObjectId | |
| `courseId` → Courses | ObjectId | |
| `semester` | Number | |
| `section` | String | e.g., "A", "B" |
| `yearOfJoining`, `yearOfPassing` | Number | |
| `cgpa` | Number | |
| `attendance` | Number | Percentage |

**Uniqueness**: Compound unique index on `{ email, phone }` to prevent duplicates during self-registration.

### 3.3 Faculty

| Field | Type | Notes |
|-------|------|-------|
| `userId` | ObjectId → Users | |
| `employeeId` | String (unique) | Auto-generated |
| `fullName` | String | |
| `designation` | String | e.g., "Assistant Professor" |
| `qualification`, `experience`, `specialization` | String | |
| `departmentId` → Departments | ObjectId | |
| `phone`, `office` | String | |
| `subjects` | [String] | Subject names from CSV |
| `yearHandling` | [Number] | e.g., [1, 2] |
| `sectionHandling` | [String] | e.g., ["A", "B"] |
| `weeklyHours` | Number | Derived from dept rules (20 for BCA, 16 for others) |
| `labHours` | Number | BCA: 12, others: 0 |
| `theoryHours` | Number | BCA: 8, others: 16 |
| `isHOD` | Boolean | Whether this faculty is a department HOD |

### 3.4 Departments

| Field | Type | Notes |
|-------|------|-------|
| `name` | String (unique) | "BCA", "BCOM", "BBA" |
| `fullName` | String | |
| `hodId` → Faculty | ObjectId | |
| `weeklyHoursRule` | Number | 20 for BCA, 16 for commerce depts |
| `labHoursRule` | Number | 12 for BCA, 0 for others |
| `theoryHoursRule` | Number | 8 for BCA, 16 for others |
| `totalStudents`, `totalFaculty` | Number | |

### 3.5 Courses — same as v1

### 3.6 Timetables (Redesigned)

| Field | Type | Notes |
|-------|------|-------|
| `departmentId` → Departments | ObjectId | |
| `type` | Enum | `academic`, `exam` |
| `year` | Number | 1, 2, 3 |
| `section` | String | "A", "B" |
| `semester` | Number | |
| `slots` | Array | See slot schema below |
| `isPublished` | Boolean | Exam TT: shown only when true |
| `generatedFrom` | ObjectId → FacultyWorkloads | Link to source upload |
| `createdBy` → Users | ObjectId | |

**Slot sub-schema**:
```js
{
  day: String,           // "Monday" … "Saturday"
  period: Number,        // 1–8
  timeStart: String,     // "09:00"
  timeEnd: String,       // "10:00"
  courseId: ObjectId,
  facultyId: ObjectId,
  room: String,
  type: String,          // "theory" | "lab"
  isOnLeave: Boolean,    // true if faculty has approved leave on this date
  leaveId: ObjectId      // ref to LeaveRequest if applicable
}
```

### 3.7 FacultyWorkloads (NEW — CSV upload tracking)

| Field | Type | Notes |
|-------|------|-------|
| `uploadedBy` → Users | ObjectId | Admin who uploaded |
| `fileName` | String | Original CSV filename |
| `fileUrl` | String | Stored path |
| `department` | String | Target department |
| `records` | Array | Parsed rows from CSV (see below) |
| `status` | Enum | `pending`, `processed`, `failed` |
| `generatedTimetableIds` | [ObjectId] | Timetables created from this upload |
| `uploadedAt` | Date | |

**Record sub-schema** (matches CSV columns):
```js
{
  serialNumber: Number,
  teacherName: String,
  department: String,
  subjects: [String],
  yearHandling: Number,
  section: String,
  weeklyHours: Number   // validated against dept rules
}
```

### 3.8 LeaveRequests (Updated)

| Field | Type | Notes |
|-------|------|-------|
| `requesterId` → Users | ObjectId | |
| `requesterRole` | Enum | `faculty`, `hod` |
| `department` | String | |
| `leaveType` | String | Casual, Medical, Earned, etc. |
| `startDate`, `endDate` | Date | |
| `reason` | String | |
| `status` | Enum | `pending`, `approved`, `rejected` |
| `approverRole` | Enum | `hod` (for faculty leave), `principal` (for HOD leave) |
| `reviewedBy` → Users | ObjectId | |
| `reviewedAt` | Date | |
| `timetableSlotsAffected` | [ObjectId] | Slots marked as on-leave after approval |

### 3.9 Syllabi — same as v1

---

## 4. API Endpoints

### 4.1 Auth

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/login` | Login (all roles) + reCAPTCHA | Public |
| POST | `/api/v1/auth/register` | **Student self-registration** | Public |
| POST | `/api/v1/auth/logout` | Invalidate | Auth |
| POST | `/api/v1/auth/refresh` | Refresh JWT | Auth |

**Student Registration flow**: Student fills form → backend validates uniqueness (email+phone) → creates User (role=student) + Student record → auto-generates register number → returns JWT.

### 4.2 Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/dashboard` | Stats |
| **Staff Management** | | |
| GET | `/api/v1/admin/staff` | List all faculty/HODs (search, filter, sort) — **includes username & decrypted password** |
| POST | `/api/v1/admin/staff` | Create single faculty/HOD (auto-generate credentials) |
| POST | `/api/v1/admin/staff/bulk-import` | **Bulk import staff from CSV/Excel** — auto-generates username+password per row |
| PUT | `/api/v1/admin/staff/:id` | Update staff |
| DELETE | `/api/v1/admin/staff/:id` | Remove staff |
| GET | `/api/v1/admin/staff/export` | Export staff list as CSV |
| **Student Management** | | |
| GET | `/api/v1/admin/students` | List (paginated, filterable) |
| POST | `/api/v1/admin/students` | Create student |
| PUT | `/api/v1/admin/students/:id` | Update |
| DELETE | `/api/v1/admin/students/:id` | Delete |
| GET | `/api/v1/admin/students/export` | Export CSV/Excel |
| **Timetable Management** | | |
| POST | `/api/v1/admin/timetable/upload-workload` | **Upload faculty workload CSV** → triggers auto timetable generation |
| GET | `/api/v1/admin/timetable/workloads` | List past workload uploads |
| GET | `/api/v1/admin/timetable` | View generated timetables |
| PUT | `/api/v1/admin/timetable/:id` | Manual adjustments |
| POST | `/api/v1/admin/timetable/:id/publish` | Publish exam timetable |

### 4.3 Principal

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/principal/dashboard` | Stats |
| GET | `/api/v1/principal/departments` | List departments |
| GET | `/api/v1/principal/departments/:id` | Dept detail |
| GET | `/api/v1/principal/faculty` | All faculty |
| GET | `/api/v1/principal/students` | All students |
| GET | `/api/v1/principal/leave-requests` | **HOD leave requests** (for approval) |
| PUT | `/api/v1/principal/leave-requests/:id` | **Approve/reject HOD leave** |

### 4.4 HOD

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/hod/dashboard` | Dept stats |
| GET | `/api/v1/hod/faculty` | Dept faculty |
| GET | `/api/v1/hod/timetable` | Dept timetable (with leave overlays) |
| PUT | `/api/v1/hod/timetable` | Edit timetable |
| POST | `/api/v1/hod/syllabus` | Upload PDF |
| GET | `/api/v1/hod/syllabus` | List syllabi |
| GET | `/api/v1/hod/leave-requests` | **Faculty leave requests** |
| PUT | `/api/v1/hod/leave-requests/:id` | **Approve/reject faculty leave** → updates timetable slots |
| POST | `/api/v1/hod/leave-request` | **HOD's own leave request** (goes to Principal) |

### 4.5 Faculty — same as v1

### 4.6 Student

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/student/profile` | Profile (CGPA, attendance) |
| PUT | `/api/v1/student/profile` | Update own profile |
| GET | `/api/v1/student/timetable/academic` | Academic timetable (with leave overlays) |
| GET | `/api/v1/student/timetable/exam` | Exam TT (only if published) |
| GET | `/api/v1/student/syllabus` | Dept syllabus |

---

## 5. Timetable Auto-Generation Algorithm

### 5.1 Input (CSV columns)

| Column | Example |
|--------|---------|
| Serial No | 1 |
| Teacher Name | Dr. Priya Sharma |
| Department | BCA |
| Subjects | Data Structures, OS Lab |
| Year | 2 |
| Section | A |
| Weekly Hours | 20 |

### 5.2 Department hour rules

| Department | Weekly Hrs | Lab Hrs | Theory Hrs |
|------------|-----------|---------|------------|
| BCA | 20 | 12 | 8 |
| BBA | 16 | 0 | 16 |
| BCOM | 16 | 0 | 16 |
| Other commerce | 16 | 0 | 16 |

### 5.3 Generation logic

1. Parse CSV → validate rows → create `FacultyWorkload` record
2. For each unique `(department, year, section)` combo, create a timetable
3. Available periods: 8 per day × 6 days = 48 slots/week
4. For each faculty in that class group:
   - Distribute their subjects across the week
   - Lab slots: consecutive 2-hour blocks (for BCA)
   - Theory slots: 1-hour blocks, max 2 consecutive for same subject
5. **Constraint checks**: No faculty double-booked, no room conflicts, weekly hours respected
6. Store generated timetable → link back to workload upload
7. Return generated timetable IDs

### 5.4 Leave impact on timetable

When a leave is **approved**:
1. Find all timetable slots where `facultyId` matches the requester AND `date` falls within `startDate–endDate`
2. Set `isOnLeave = true` and `leaveId` on those slots
3. Frontend renders these slots differently (grayed out / "On Leave" label)

---

## 6. Bulk Staff Import

**Endpoint**: `POST /api/v1/admin/staff/bulk-import`

### CSV format

| S.No | Full Name | Email | Phone | Department | Designation | Qualification | Is HOD |
|------|-----------|-------|-------|------------|-------------|---------------|--------|
| 1 | Dr. Priya Sharma | priya@college.edu | 9876543210 | BCA | Asst Professor | M.Tech | No |

### Processing

1. Parse CSV with `exceljs` / `csv-parser`
2. For each row:
   - Validate required fields & email format
   - Check for existing user (email uniqueness)
   - Auto-generate username: `firstname.lastname` (if collision, append number)
   - Auto-generate password: 8-char random (uppercase + lowercase + digits)
   - Hash password with bcrypt → store in `passwordHash`
   - Encrypt raw password with AES-256 → store in `passwordPlain`
   - Create `User` record (role = `faculty` or `hod`)
   - Create `Faculty` record linked to user
3. Return summary: `{ imported: 15, skipped: 2, errors: [{row: 3, reason: "Duplicate email"}] }`

---

## 7. Student Self-Registration

**Endpoint**: `POST /api/v1/auth/register`

### Required fields
- `firstName`, `lastName`, `email` (unique), `phone` (unique), `password`, `dateOfBirth`, `gender`, `departmentId`, `courseId`, `yearOfJoining`, `section`

### Uniqueness
- **Compound unique index**: `{ email: 1, phone: 1 }` — same email+phone combo = rejected as duplicate
- Also individual unique indexes on `email` and `phone` independently

### Flow
1. Validate input → check uniqueness → hash password
2. Create `User` (role = student) + `Student` record
3. Auto-generate register number: `BCA-2025-001`
4. Return JWT → student is logged in immediately

---

## 8. Security — same as v1, plus:

- **AES-256-CBC encryption** for `passwordPlain` field (key from `CREDENTIAL_ENCRYPTION_KEY` env var)
- Admin credential-view endpoint is rate-limited to 10 req/min
- All bulk import files are validated for max 500 rows per upload

---

## 9. Environment Configuration

```env
NODE_ENV=development
PORT=5000

# MongoDB (user will provide)
MONGODB_URI=<user-provided>

# JWT
JWT_SECRET=<generate-random-64-char>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# reCAPTCHA
RECAPTCHA_SECRET_KEY=<your-key>

# Credential encryption (for admin viewing staff passwords)
CREDENTIAL_ENCRYPTION_KEY=<random-32-byte-hex>

# CORS
ALLOWED_ORIGINS=http://localhost:5173,https://your-domain.com

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
```

---

## 10. Directory Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── env.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validate.js
│   │   ├── sanitize.js
│   │   ├── rateLimiter.js
│   │   └── upload.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Student.js
│   │   ├── Faculty.js
│   │   ├── Department.js
│   │   ├── Course.js
│   │   ├── Timetable.js
│   │   ├── FacultyWorkload.js    ← NEW
│   │   ├── Syllabus.js
│   │   └── LeaveRequest.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── admin.routes.js
│   │   ├── principal.routes.js
│   │   ├── hod.routes.js
│   │   ├── faculty.routes.js
│   │   └── student.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── admin.controller.js
│   │   ├── principal.controller.js
│   │   ├── hod.controller.js
│   │   ├── faculty.controller.js
│   │   └── student.controller.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── timetable.service.js   ← NEW (auto-generation engine)
│   │   ├── credential.service.js  ← NEW (AES encrypt/decrypt)
│   │   ├── bulkImport.service.js  ← NEW (CSV parsing + user creation)
│   │   ├── leave.service.js       ← NEW (leave→timetable sync)
│   │   ├── export.service.js
│   │   └── registerNumber.service.js
│   ├── utils/
│   │   ├── errors.js
│   │   └── response.js
│   └── app.js
├── .env.example
├── package.json
└── server.js
```

---

## 11. Dependencies

```json
{
  "dependencies": {
    "express": "^4.18",
    "mongoose": "^8.0",
    "bcryptjs": "^2.4",
    "jsonwebtoken": "^9.0",
    "cors": "^2.8",
    "helmet": "^7.1",
    "express-rate-limit": "^7.1",
    "express-mongo-sanitize": "^2.2",
    "express-validator": "^7.0",
    "multer": "^1.4",
    "dotenv": "^16.3",
    "exceljs": "^4.4",
    "csv-parser": "^3.0",
    "json2csv": "^6.0",
    "crypto": "built-in"
  },
  "devDependencies": {
    "nodemon": "^3.0"
  }
}
```

---

## 12. Implementation Priority

1. **Phase 1**: Auth (login, student registration, JWT, RBAC)
2. **Phase 2**: Admin staff management (CRUD, bulk CSV import, credential view)
3. **Phase 3**: Timetable engine (CSV upload → auto-generation)
4. **Phase 4**: Leave system (apply → approve → timetable sync)
5. **Phase 5**: Principal/HOD dashboards & endpoints
6. **Phase 6**: Student/Faculty endpoints (profile, timetable view, syllabus)
7. **Phase 7**: File upload (syllabus PDFs) & export (CSV/Excel)
8. **Phase 8**: Security hardening & testing
