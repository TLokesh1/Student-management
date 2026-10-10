# Student Academic Management System

A full-stack, enterprise-grade academic management web application built with Spring Boot, React, and MySQL. This application enables higher education institutions to manage students, faculties, departments, courses, enrollments, attendance, marks, and assignments through role-based access control (RBAC).

---

## 1. Project Overview

The **Student Academic Management System** provides a centralized platform for academic administrators, teaching faculties, and students. It streamlines the day-to-day administration of academic operations, ensuring data integrity across interconnected entities such as courses, departments, marks, and attendance.

---

## 2. Problem Statement

Traditional university record tracking often relies on disconnected spreadsheets or siloed software modules, resulting in:
- Inconsistent student enrollment and attendance data.
- Foreign key and relational integrity errors when updating or deleting student accounts.
- Security vulnerabilities due to inadequate role-based route protection.
- Hardcoded configurations that inhibit zero-downtime, cloud-native deployments.

This system provides a unified RESTful backend API with relational integrity enforcement and a modern, responsive single-page frontend application.

---

## 3. Features

- **Authentication & Security:** JWT (JSON Web Token) stateless authentication with BCrypt password hashing.
- **Role-Based Authorization:** Fine-grained permissions segregated between `ADMIN`, `FACULTY`, and `STUDENT`.
- **Relational Integrity Protection:** Robust cascade deletion handling for students with historical attendance, marks, and course enrollment records without disabling database foreign-key checks.
- **Search & Pagination:** Server-side and client-side pagination with real-time filtering by department and name.
- **Dynamic Dashboards:** Real-time metrics tailored to each user's assigned role.
- **Cloud-Ready Configurations:** Complete environment variable support for Railway (Backend + MySQL) and Render (Frontend).

---

## 4. Role Matrix & Permissions

| Feature / Resource | ADMIN | FACULTY | STUDENT |
| :--- | :---: | :---: | :---: |
| **Authentication (`/auth/**`)** | Login, Register | Login, Register | Login, Register |
| **Dashboard (`/dashboard`)** | Full Institutional Overview | Faculty Courses & Stats | Personal Enrolled Data |
| **Departments (`/departments`)** | Create, Read, Update, Delete | Read | Read |
| **Faculty Directory (`/faculty`)** | Create, Read, Update, Delete | Read, Update Profile | Read |
| **Students Directory (`/students`)** | Create, Read, Update, Delete | Read, View Details | View Self Profile |
| **Courses (`/courses`)** | Create, Read, Update, Delete | Create, Read, Update | Read Enrolled |
| **Enrollment (`/students/{id}/courses`)** | Enroll / Unenroll Students | View Course Rosters | View Enrolled Courses |
| **Attendance (`/attendance`)** | View, Update, Delete Records | Mark & Update Attendance | View Personal Records |
| **Marks & Grades (`/marks`)** | View, Update, Delete Records | Input & Edit Marks | View Personal Grades |
| **Assignments (`/assignments`)** | View, Manage All Assignments | Create, Edit Assignments | View & Track Assignments |

---

## 5. Technology Stack

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite 5
- **Routing:** React Router v6
- **HTTP Client:** Axios with JWT request/response interceptors
- **Icons & UI:** Lucide React, modern CSS with responsive design

### Backend
- **Framework:** Spring Boot 4.1.1 (Java 21 LTS)
- **Security:** Spring Security 6 with JJWT (io.jsonwebtoken 0.13.0)
- **Data Access:** Spring Data JPA with Hibernate ORM
- **Validation:** Jakarta Validation (`jakarta.validation-api`)
- **Database Connector:** MySQL Connector/J

### Database
- **Engine:** MySQL 8.0+

---

## 6. Architecture & System Design

```
+---------------------------------------------------------+
|                    Browser / Client                     |
|                 React 18 Single Page App                |
+---------------------------------------------------------+
                            |
                     HTTPS / JSON REST
                            |
+---------------------------------------------------------+
|                  Spring Boot REST API                   |
|  - SecurityFilterChain (Stateless JWT, CORS)            |
|  - AuthController, StudentController, CourseController...|
|  - Service Layer (Business rules & Cascading logic)     |
|  - JPA Repositories (Data Access Layer)                 |
+---------------------------------------------------------+
                            |
                     JDBC Connection
                            |
+---------------------------------------------------------+
|                     MySQL Database                      |
|  - users, departments, faculty, students, courses       |
|  - student_courses, attendance, marks, assignments      |
+---------------------------------------------------------+
```

---

## 7. Project Structure

```
student-management/
|-- backend/
|   |-- src/
|   |   |-- main/
|   |   |   |-- java/com/example/student_management/
|   |   |   |   |-- config/              # DataInitializer, Security configs
|   |   |   |   |-- controller/          # REST API endpoints
|   |   |   |   |-- dto/                 # Request/Response data transfer objects
|   |   |   |   |-- entity/              # JPA domain entities
|   |   |   |   |-- exception/           # Global exception handling
|   |   |   |   |-- repository/         # Spring Data JPA repositories
|   |   |   |   |-- security/           # CustomUserDetailsService, JWT filters
|   |   |   |   `-- service/            # Business & persistence logic
|   |   |   `-- resources/
|   |   |       `-- application.properties  # Config with env var fallbacks
|   |   `-- test/                        # Integration and unit tests
|   |-- pom.xml
|   `-- mvnw / mvnw.cmd
|-- frontend/
|   |-- src/
|   |   |-- api/                         # Axios client & service API wrappers
|   |   |-- components/                  # Modals, Navbar, Sidebar, Guards
|   |   |-- context/                     # AuthContext state provider
|   |   |-- pages/                       # Route components (Students, Marks, etc.)
|   |   `-- styles/                      # Application styling
|   |-- index.html
|   |-- package.json
|   `-- vite.config.js
|-- .gitignore                           # Clean exclusion of target, dist, node_modules
`-- README.md
```

---

## 8. Database Entities & Relationships

- **Department (`departments`):** One-to-Many with `Student`, `Faculty`, `Course`.
- **Faculty (`faculty`):** Many-to-One with `Department`, One-to-Many with `Course`, `Assignment`.
- **Student (`students`):**
  - Many-to-One with `Department`.
  - Many-to-Many with `Course` via `student_courses` join table.
  - One-to-Many with `Attendance` and `Marks`.
- **Course (`courses`):** Many-to-One with `Department` and `Faculty`.
- **Attendance (`attendance`):** Many-to-One with `Student` and `Course`.
- **Marks (`marks`):** Many-to-One with `Student` and `Course`.
- **Assignment (`assignments`):** Many-to-One with `Course` and `Faculty`.
- **User (`users`):** Authentication credential storage with role (`ADMIN`, `FACULTY`, `STUDENT`).

---

## 9. Authentication and JWT Implementation

1. **Authentication Flow:**
   - Client sends credentials (`username`, `password`) to `POST /auth/login`.
   - `CustomUserDetailsService` validates credentials against `users` table via `DaoAuthenticationProvider` and `BCryptPasswordEncoder`.
   - `JwtService` issues a signed HMAC-SHA256 JWT containing the username, role, and expiration timestamp.
2. **Authorization Enforcement:**
   - Client includes `Authorization: Bearer <token>` in subsequent requests via Axios request interceptor.
   - `JwtAuthenticationFilter` intercepts requests, extracts and verifies the token, and sets the authenticated principal in `SecurityContextHolder`.
   - `SecurityConfig` enforces HTTP method and path level authorization matching the roles (`hasRole('ADMIN')`, `hasAnyRole('ADMIN', 'FACULTY')`, etc.).

---

## 10. CRUD Functionality

- **Students:** Paginated listing, create student, edit profile, safe delete with cascade removal of dependencies, enroll and unenroll in courses.
- **Faculty:** Full CRUD with re-assignment/disassociation of assigned courses and assignments upon deletion.
- **Departments:** Full CRUD with code uniqueness check.
- **Courses:** Full CRUD with department and assigned faculty linkage.
- **Attendance:** Record daily attendance statuses (`PRESENT`, `ABSENT`, `LATE`), filter by date/course/student.
- **Marks:** Record marks obtained vs. max marks, exam type, semester, and academic year.
- **Assignments:** Create assignment submissions with title, description, and due date.

---

## 11. Foreign Key Deletion Bug Fix

### Known Issue
Previously, deleting a student record resulted in a MySQL foreign-key constraint violation (`Cannot delete or update a parent row: a foreign key constraint fails`) because child tables `attendance`, `marks`, and the join table `student_courses` still maintained references to the student ID.

### The Fix
In `StudentService.java`:
```java
@Transactional
public boolean deleteStudent(Long id) {
    if (!studentRepository.existsById(id)) {
        return false;
    }

    // 1. Delete all attendance records referencing this student
    attendanceRepository.deleteByStudentId(id);

    // 2. Delete all marks records referencing this student
    marksRepository.deleteByStudentId(id);

    // 3. Clear associations in student_courses join table
    Student student = studentRepository.findById(id).get();
    student.getEnrolledCourses().clear();
    studentRepository.save(student);

    // 4. Safely delete the student entity
    studentRepository.deleteById(id);

    return true;
}
```
Foreign key constraints remain strictly enforced in MySQL without using unsafe global foreign key bypasses.

---

## 12. Local Setup & Execution

### Prerequisites
- Java 21 LTS installed
- Maven 3.9+ installed
- Node.js 18+ and npm installed
- MySQL 8.0+ running locally on port 3306

### Backend Setup
1. Configure local MySQL database:
   ```sql
   CREATE DATABASE student_management;
   ```
2. Run backend from `backend/`:
   ```bash
   cd backend
   mvn spring-boot:run
   ```
   Or package and run the JAR:
   ```bash
   mvn clean package -DskipTests
   java -jar target/student-management-0.0.1-SNAPSHOT.jar
   ```
   The backend starts at `http://localhost:8080`.

3. Default seed accounts created automatically on startup:
   - **Admin:** `admin` / `admin123`
   - **Faculty:** `faculty` / `faculty123`
   - **Student:** `student` / `student123`

### Frontend Setup
1. From `frontend/`:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Access the frontend application at `http://localhost:5173`.

---

## 13. Environment Variables Reference

### Backend (`application.properties`)
| Variable | Description | Default (Local) | Production Example |
| :--- | :--- | :--- | :--- |
| `PORT` | HTTP port for Spring Boot | `8080` | Assigned by Railway |
| `SPRING_DATASOURCE_URL` or `MYSQL_URL` | MySQL JDBC connection URL | `jdbc:mysql://localhost:3306/student_management...` | `jdbc:mysql://mysql.railway.internal:3306/railway` |
| `SPRING_DATASOURCE_USERNAME` or `MYSQLUSER` | MySQL database username | `root` | `root` |
| `SPRING_DATASOURCE_PASSWORD` or `MYSQLPASSWORD` | MySQL database password | `lokesh123` | Provided by Railway |
| `JWT_SECRET` | Secret key for signing JWTs | 64-char hex default | Production secret string |
| `JWT_EXPIRATION_MS` | JWT expiration time in ms | `86400000` (24h) | `86400000` |

### Frontend
| Variable | Description | Default (Local) | Production Example |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` or `VITE_API_BASE_URL` | Base URL of Spring Boot REST API | `http://localhost:8080` | `https://your-backend.up.railway.app` |

---

## 14. Production Deployment Process

### Preferred Deployment Model:
- **Backend:** Railway (Spring Boot Maven Application)
- **Database:** Railway MySQL Plugin
- **Frontend:** Render (Static Site)

### Railway Backend & MySQL Setup:
1. Log in to [Railway](https://railway.app).
2. Create a new Project and add a **MySQL** service.
3. Add a new Service from the GitHub repository: `https://github.com/TLokesh1/Student-management`.
4. In Railway service **Settings**:
   - **Root Directory:** `backend`
   - **Build Command:** `mvn clean package -DskipTests`
   - **Start Command:** `java -jar target/student-management-0.0.1-SNAPSHOT.jar`
5. Under **Variables**, link Railway MySQL database variables or supply:
   - `SPRING_DATASOURCE_URL`: `${{MySQL.MYSQL_URL}}` (or standard JDBC connection string)
   - `SPRING_DATASOURCE_USERNAME`: `${{MySQL.MYSQLUSER}}`
   - `SPRING_DATASOURCE_PASSWORD`: `${{MySQL.MYSQLPASSWORD}}`
   - `JWT_SECRET`: Generate a secure random 256-bit secret.
   - `PORT`: `${{PORT}}`
6. Deploy the service and generate a public Railway domain (e.g., `https://student-management-backend-production.up.railway.app`).

### Render Frontend Setup:
1. Log in to [Render](https://render.com).
2. Click **New +** > **Static Site**.
3. Connect the GitHub repository `TLokesh1/Student-management`.
4. Configure site settings:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`
5. In **Environment Variables**, set:
   - `VITE_API_URL`: `<YOUR_RAILWAY_BACKEND_PUBLIC_URL>` (e.g. `https://student-management-backend-production.up.railway.app`)
6. Under **Redirects/Rewrites**:
   - Add rewrite rule: Source `/*` -> Destination `/index.html` (Action: `Rewrite`) to support React Router client-side routing.
7. Deploy the frontend static site.

---

## 15. Testing Performed

- **Backend Unit & Integration Tests:**
  - Ran `mvn test` verifying 6 test suites across authentication, student controller, and academic workflows (`BUILD SUCCESS`).
- **Backend Packaging:**
  - Ran `mvn clean package -DskipTests` verifying production executable fat JAR creation.
- **Frontend Build Test:**
  - Executed `npm run build` verifying clean production bundle compilation with Vite and Rollup without errors.
- **Student Deletion Cascade Test:**
  - Verified transactional deletion of student records with existing attendance, mark records, and course enrollments.
- **CORS Configuration:**
  - Verified `SecurityConfig` allows cross-origin requests from any frontend domain with credentials enabled.

---

---

## 16. Live Deployments

- **Live Frontend Application (Render):** [https://student-management-app-ipur.onrender.com](https://student-management-app-ipur.onrender.com) *(React SPA Static Site)*
- **Live Backend REST API (Render):** [https://student-management1-u69f.onrender.com](https://student-management1-u69f.onrender.com) *(Spring Boot + Docker)*
- **Live MySQL Database:** Managed MySQL on Aiven Cloud

---

## 17. Repository Source of Truth

- **GitHub Repository:** [https://github.com/TLokesh1/Student-management](https://github.com/TLokesh1/Student-management)

