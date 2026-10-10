# Complete Backend Verification Script for Student Management System
$baseUrl = "http://localhost:8080"
$ErrorActionPreference = "Continue"

$results = [System.Collections.Generic.List[PSCustomObject]]::new()

function Record-Result {
    param($Category, $TestName, $Endpoint, $ExpectedStatus, $ActualStatus, $Status, $Details)
    $results.Add([PSCustomObject]@{
        Category       = $Category
        TestName       = $TestName
        Endpoint       = $Endpoint
        ExpectedStatus = $ExpectedStatus
        ActualStatus   = $ActualStatus
        Status         = $Status
        Details        = $Details
    })
}

function Invoke-Api {
    param(
        [string]$Method,
        [string]$Uri,
        [hashtable]$Headers = @{},
        [string]$Body = $null
    )
    $reqHeaders = @{}
    if ($Headers) { foreach ($k in $Headers.Keys) { $reqHeaders[$k] = $Headers[$k] } }
    if ($Body -and -not $reqHeaders.ContainsKey("Content-Type")) {
        $reqHeaders["Content-Type"] = "application/json"
    }

    try {
        if ($Body) {
            $resp = Invoke-WebRequest -Uri $Uri -Method $Method -Headers $reqHeaders -Body $Body -UseBasicParsing
        } else {
            $resp = Invoke-WebRequest -Uri $Uri -Method $Method -Headers $reqHeaders -UseBasicParsing
        }
        return @{
            StatusCode = [int]$resp.StatusCode
            Content    = $resp.Content
            Json       = (try { $resp.Content | ConvertFrom-Json } catch { $null })
        }
    } catch {
        $status = 0
        $content = ""
        if ($_.Exception.Response) {
            $status = [int]$_.Exception.Response.StatusCode
            $stream = $_.Exception.Response.GetResponseStream()
            if ($stream) {
                $reader = New-Object System.IO.StreamReader($stream)
                $content = $reader.ReadToEnd()
            }
        }
        return @{
            StatusCode = $status
            Content    = $content
            Json       = (try { $content | ConvertFrom-Json } catch { $null })
            Error      = $_.Exception.Message
        }
    }
}

Write-Host "=== SECTION 1: AUTHENTICATION & LOGIN TESTS ===" -ForegroundColor Cyan

# 1.1 Login as ADMIN
$adminLogin = Invoke-Api -Method POST -Uri "$baseUrl/auth/login" -Body '{"username":"admin","password":"admin123"}'
$adminToken = $adminLogin.Json.token
if ($adminLogin.StatusCode -eq 200 -and $adminToken) {
    Record-Result "Auth" "Admin Login" "POST /auth/login" 200 $adminLogin.StatusCode "PASS" "Admin token received"
} else {
    Record-Result "Auth" "Admin Login" "POST /auth/login" 200 $adminLogin.StatusCode "FAIL" $adminLogin.Content
}
$adminHeaders = @{ "Authorization" = "Bearer $adminToken" }

# 1.2 Login as FACULTY
$facultyLogin = Invoke-Api -Method POST -Uri "$baseUrl/auth/login" -Body '{"username":"faculty","password":"faculty123"}'
$facultyToken = $facultyLogin.Json.token
if ($facultyLogin.StatusCode -eq 200 -and $facultyToken) {
    Record-Result "Auth" "Faculty Login" "POST /auth/login" 200 $facultyLogin.StatusCode "PASS" "Faculty token received"
} else {
    Record-Result "Auth" "Faculty Login" "POST /auth/login" 200 $facultyLogin.StatusCode "FAIL" $facultyLogin.Content
}
$facultyHeaders = @{ "Authorization" = "Bearer $facultyToken" }

# 1.3 Login as STUDENT
$studentLogin = Invoke-Api -Method POST -Uri "$baseUrl/auth/login" -Body '{"username":"student","password":"student123"}'
$studentToken = $studentLogin.Json.token
if ($studentLogin.StatusCode -eq 200 -and $studentToken) {
    Record-Result "Auth" "Student Login" "POST /auth/login" 200 $studentLogin.StatusCode "PASS" "Student token received"
} else {
    Record-Result "Auth" "Student Login" "POST /auth/login" 200 $studentLogin.StatusCode "FAIL" $studentLogin.Content
}
$studentHeaders = @{ "Authorization" = "Bearer $studentToken" }

# 1.4 Register New User
$regUsername = "testuser_" + (Get-Random -Minimum 1000 -Maximum 9999)
$regEmail = "$regUsername@university.edu"
$regResp = Invoke-Api -Method POST -Uri "$baseUrl/auth/register" -Body "{`"username`":`"$regUsername`",`"password`":`"pass12345`",`"email`":`"$regEmail`",`"role`":`"STUDENT`"}"
if ($regResp.StatusCode -eq 201 -and $regResp.Json.token) {
    Record-Result "Auth" "Register New User" "POST /auth/register" 201 $regResp.StatusCode "PASS" "User registered with JWT"
} else {
    Record-Result "Auth" "Register New User" "POST /auth/register" 201 $regResp.StatusCode "FAIL" $regResp.Content
}

# 1.5 GET /auth/me
$meResp = Invoke-Api -Method GET -Uri "$baseUrl/auth/me" -Headers $adminHeaders
if ($meResp.StatusCode -eq 200 -and $meResp.Json.username -eq "admin") {
    Record-Result "Auth" "Get Current User Profile" "GET /auth/me" 200 $meResp.StatusCode "PASS" "Returned username=admin, role=ADMIN"
} else {
    Record-Result "Auth" "Get Current User Profile" "GET /auth/me" 200 $meResp.StatusCode "FAIL" $meResp.Content
}

# 1.6 Unauthenticated request rejection (No token)
$unauthResp = Invoke-Api -Method GET -Uri "$baseUrl/departments"
if ($unauthResp.StatusCode -eq 401 -or $unauthResp.StatusCode -eq 403) {
    Record-Result "Auth" "Reject Request Without Token" "GET /departments" "401/403" $unauthResp.StatusCode "PASS" "Unauthenticated request rejected"
} else {
    Record-Result "Auth" "Reject Request Without Token" "GET /departments" "401/403" $unauthResp.StatusCode "FAIL" "Got $($unauthResp.StatusCode)"
}

# 1.7 Invalid token rejection
$badTokenResp = Invoke-Api -Method GET -Uri "$baseUrl/departments" -Headers @{ "Authorization" = "Bearer invalid.jwt.token" }
if ($badTokenResp.StatusCode -eq 401 -or $badTokenResp.StatusCode -eq 403) {
    Record-Result "Auth" "Reject Invalid Token" "GET /departments" "401/403" $badTokenResp.StatusCode "PASS" "Invalid token rejected"
} else {
    Record-Result "Auth" "Reject Invalid Token" "GET /departments" "401/403" $badTokenResp.StatusCode "FAIL" "Got $($badTokenResp.StatusCode)"
}

Write-Host "=== SECTION 2: REALISTIC WORKFLOW & FULL CRUD TESTS ===" -ForegroundColor Cyan

# 2.1 CREATE DEPARTMENT (as ADMIN)
$rnd = Get-Random -Minimum 100 -Maximum 999
$deptCode = "ENG_$rnd"
$deptBody = "{`"name`":`"Engineering Division $rnd`",`"code`":`"$deptCode`",`"description`":`"Engineering Dept`"}"
$createDept = Invoke-Api -Method POST -Uri "$baseUrl/departments" -Headers $adminHeaders -Body $deptBody
$deptId = $createDept.Json.id
if ($createDept.StatusCode -eq 201 -and $deptId) {
    Record-Result "Departments" "Create Department" "POST /departments" 201 $createDept.StatusCode "PASS" "Created ID=$deptId, Code=$deptCode"
} else {
    Record-Result "Departments" "Create Department" "POST /departments" 201 $createDept.StatusCode "FAIL" $createDept.Content
}

# 2.2 GET ALL DEPARTMENTS
$getDepts = Invoke-Api -Method GET -Uri "$baseUrl/departments" -Headers $adminHeaders
if ($getDepts.StatusCode -eq 200 -and ($getDepts.Json.Count -gt 0 -or $getDepts.Json.length -gt 0)) {
    Record-Result "Departments" "Get All Departments" "GET /departments" 200 $getDepts.StatusCode "PASS" "Retrieved departments list"
} else {
    Record-Result "Departments" "Get All Departments" "GET /departments" 200 $getDepts.StatusCode "FAIL" $getDepts.Content
}

# 2.3 GET DEPARTMENT BY ID
$getDept = Invoke-Api -Method GET -Uri "$baseUrl/departments/$deptId" -Headers $adminHeaders
if ($getDept.StatusCode -eq 200 -and $getDept.Json.code -eq $deptCode) {
    Record-Result "Departments" "Get Department By ID" "GET /departments/{id}" 200 $getDept.StatusCode "PASS" "Retrieved dept ID=$deptId"
} else {
    Record-Result "Departments" "Get Department By ID" "GET /departments/{id}" 200 $getDept.StatusCode "FAIL" $getDept.Content
}

# 2.4 UPDATE DEPARTMENT
$updateDeptBody = "{`"name`":`"Updated Engineering $rnd`",`"code`":`"$deptCode`",`"description`":`"Updated Description`"}"
$updateDept = Invoke-Api -Method PUT -Uri "$baseUrl/departments/$deptId" -Headers $adminHeaders -Body $updateDeptBody
if ($updateDept.StatusCode -eq 200 -and $updateDept.Json.name -eq "Updated Engineering $rnd") {
    Record-Result "Departments" "Update Department" "PUT /departments/{id}" 200 $updateDept.StatusCode "PASS" "Updated name verified"
} else {
    Record-Result "Departments" "Update Department" "PUT /departments/{id}" 200 $updateDept.StatusCode "FAIL" $updateDept.Content
}

# 2.5 CREATE FACULTY (as ADMIN)
$facEmail = "prof_$rnd@university.edu"
$facBody = "{`"name`":`"Prof. Robert $rnd`",`"email`":`"$facEmail`",`"phone`":`"9871122334`",`"designation`":`"Professor`",`"departmentId`":$deptId}"
$createFac = Invoke-Api -Method POST -Uri "$baseUrl/faculty" -Headers $adminHeaders -Body $facBody
$facId = $createFac.Json.id
if ($createFac.StatusCode -eq 201 -and $facId) {
    Record-Result "Faculty" "Create Faculty" "POST /faculty" 201 $createFac.StatusCode "PASS" "Created Faculty ID=$facId"
} else {
    Record-Result "Faculty" "Create Faculty" "POST /faculty" 201 $createFac.StatusCode "FAIL" $createFac.Content
}

# 2.6 GET ALL FACULTY
$getFacList = Invoke-Api -Method GET -Uri "$baseUrl/faculty" -Headers $adminHeaders
if ($getFacList.StatusCode -eq 200) {
    Record-Result "Faculty" "Get All Faculty" "GET /faculty" 200 $getFacList.StatusCode "PASS" "Retrieved faculty list"
} else {
    Record-Result "Faculty" "Get All Faculty" "GET /faculty" 200 $getFacList.StatusCode "FAIL" $getFacList.Content
}

# 2.7 GET FACULTY BY ID
$getFac = Invoke-Api -Method GET -Uri "$baseUrl/faculty/$facId" -Headers $adminHeaders
if ($getFac.StatusCode -eq 200 -and $getFac.Json.email -eq $facEmail) {
    Record-Result "Faculty" "Get Faculty By ID" "GET /faculty/{id}" 200 $getFac.StatusCode "PASS" "Retrieved faculty ID=$facId"
} else {
    Record-Result "Faculty" "Get Faculty By ID" "GET /faculty/{id}" 200 $getFac.StatusCode "FAIL" $getFac.Content
}

# 2.8 UPDATE FACULTY
$upFacBody = "{`"name`":`"Prof. Robert Senior $rnd`",`"email`":`"$facEmail`",`"phone`":`"9998887776`",`"designation`":`"Head of Department`",`"departmentId`":$deptId}"
$upFac = Invoke-Api -Method PUT -Uri "$baseUrl/faculty/$facId" -Headers $adminHeaders -Body $upFacBody
if ($upFac.StatusCode -eq 200 -and $upFac.Json.designation -eq "Head of Department") {
    Record-Result "Faculty" "Update Faculty" "PUT /faculty/{id}" 200 $upFac.StatusCode "PASS" "Updated designation verified"
} else {
    Record-Result "Faculty" "Update Faculty" "PUT /faculty/{id}" 200 $upFac.StatusCode "FAIL" $upFac.Content
}

# 2.9 CREATE COURSE (as ADMIN)
$courseCode = "CS_$rnd"
$courseBody = "{`"courseName`":`"Neural Networks $rnd`",`"courseCode`":`"$courseCode`",`"description`":`"Deep Learning Course`",`"departmentId`":$deptId,`"facultyId`":$facId}"
$createCourse = Invoke-Api -Method POST -Uri "$baseUrl/courses" -Headers $adminHeaders -Body $courseBody
$courseId = $createCourse.Json.id
if ($createCourse.StatusCode -eq 201 -and $courseId) {
    Record-Result "Courses" "Create Course" "POST /courses" 201 $createCourse.StatusCode "PASS" "Created Course ID=$courseId, Code=$courseCode"
} else {
    Record-Result "Courses" "Create Course" "POST /courses" 201 $createCourse.StatusCode "FAIL" $createCourse.Content
}

# 2.10 GET ALL COURSES
$getCourses = Invoke-Api -Method GET -Uri "$baseUrl/courses" -Headers $adminHeaders
if ($getCourses.StatusCode -eq 200) {
    Record-Result "Courses" "Get All Courses" "GET /courses" 200 $getCourses.StatusCode "PASS" "Retrieved courses list"
} else {
    Record-Result "Courses" "Get All Courses" "GET /courses" 200 $getCourses.StatusCode "FAIL" $getCourses.Content
}

# 2.11 GET COURSE BY ID
$getCourse = Invoke-Api -Method GET -Uri "$baseUrl/courses/$courseId" -Headers $adminHeaders
if ($getCourse.StatusCode -eq 200 -and $getCourse.Json.courseCode -eq $courseCode) {
    Record-Result "Courses" "Get Course By ID" "GET /courses/{id}" 200 $getCourse.StatusCode "PASS" "Retrieved Course ID=$courseId"
} else {
    Record-Result "Courses" "Get Course By ID" "GET /courses/{id}" 200 $getCourse.StatusCode "FAIL" $getCourse.Content
}

# 2.12 UPDATE COURSE
$upCourseBody = "{`"courseName`":`"Advanced Neural Networks $rnd`",`"courseCode`":`"$courseCode`",`"description`":`"Updated DL Course`",`"departmentId`":$deptId,`"facultyId`":$facId}"
$upCourse = Invoke-Api -Method PUT -Uri "$baseUrl/courses/$courseId" -Headers $adminHeaders -Body $upCourseBody
if ($upCourse.StatusCode -eq 200 -and $upCourse.Json.courseName -eq "Advanced Neural Networks $rnd") {
    Record-Result "Courses" "Update Course" "PUT /courses/{id}" 200 $upCourse.StatusCode "PASS" "Updated course name verified"
} else {
    Record-Result "Courses" "Update Course" "PUT /courses/{id}" 200 $upCourse.StatusCode "FAIL" $upCourse.Content
}

# 2.13 CREATE STUDENT
$stuEmail = "student_$rnd@gmail.com"
$stuBody = "{`"name`":`"Alice $rnd`",`"email`":`"$stuEmail`",`"age`":21,`"course`":`"CSE`"}"
$createStu = Invoke-Api -Method POST -Uri "$baseUrl/students" -Headers $adminHeaders -Body $stuBody
$studentId = $createStu.Json.id
if ($createStu.StatusCode -eq 201 -and $studentId) {
    Record-Result "Students" "Create Student" "POST /students" 201 $createStu.StatusCode "PASS" "Created Student ID=$studentId"
} else {
    Record-Result "Students" "Create Student" "POST /students" 201 $createStu.StatusCode "FAIL" $createStu.Content
}

# 2.14 GET ALL STUDENTS
$getStudents = Invoke-Api -Method GET -Uri "$baseUrl/students" -Headers $adminHeaders
if ($getStudents.StatusCode -eq 200) {
    Record-Result "Students" "Get All Students" "GET /students" 200 $getStudents.StatusCode "PASS" "Retrieved students list"
} else {
    Record-Result "Students" "Get All Students" "GET /students" 200 $getStudents.StatusCode "FAIL" $getStudents.Content
}

# 2.15 GET STUDENT BY ID
$getStu = Invoke-Api -Method GET -Uri "$baseUrl/students/$studentId" -Headers $adminHeaders
if ($getStu.StatusCode -eq 200 -and $getStu.Json.email -eq $stuEmail) {
    Record-Result "Students" "Get Student By ID" "GET /students/{id}" 200 $getStu.StatusCode "PASS" "Retrieved Student ID=$studentId"
} else {
    Record-Result "Students" "Get Student By ID" "GET /students/{id}" 200 $getStu.StatusCode "FAIL" $getStu.Content
}

# 2.16 UPDATE STUDENT
$upStuBody = "{`"name`":`"Alice Cooper $rnd`",`"email`":`"$stuEmail`",`"age`":22,`"course`":`"CSE`"}"
$upStu = Invoke-Api -Method PUT -Uri "$baseUrl/students/$studentId" -Headers $adminHeaders -Body $upStuBody
if ($upStu.StatusCode -eq 200 -and $upStu.Json.name -eq "Alice Cooper $rnd") {
    Record-Result "Students" "Update Student" "PUT /students/{id}" 200 $upStu.StatusCode "PASS" "Updated student name verified"
} else {
    Record-Result "Students" "Update Student" "PUT /students/{id}" 200 $upStu.StatusCode "FAIL" $upStu.Content
}

# 2.17 ENROLL STUDENT IN COURSE
$enroll = Invoke-Api -Method POST -Uri "$baseUrl/students/$studentId/courses/$courseId" -Headers $adminHeaders
if ($enroll.StatusCode -eq 200) {
    Record-Result "Enrollment" "Enroll Student in Course" "POST /students/{sId}/courses/{cId}" 200 $enroll.StatusCode "PASS" "Student $studentId enrolled in Course $courseId"
} else {
    Record-Result "Enrollment" "Enroll Student in Course" "POST /students/{sId}/courses/{cId}" 200 $enroll.StatusCode "FAIL" $enroll.Content
}

# 2.18 GET STUDENT'S ENROLLED COURSES
$stuCourses = Invoke-Api -Method GET -Uri "$baseUrl/students/$studentId/courses" -Headers $adminHeaders
if ($stuCourses.StatusCode -eq 200 -and ($stuCourses.Json.Count -gt 0 -or $stuCourses.Json.length -gt 0)) {
    Record-Result "Enrollment" "Get Student Courses" "GET /students/{id}/courses" 200 $stuCourses.StatusCode "PASS" "Verified enrolled courses"
} else {
    Record-Result "Enrollment" "Get Student Courses" "GET /students/{id}/courses" 200 $stuCourses.StatusCode "FAIL" $stuCourses.Content
}

# 2.19 GET STUDENTS IN COURSE
$courseStudents = Invoke-Api -Method GET -Uri "$baseUrl/courses/$courseId/students" -Headers $adminHeaders
if ($courseStudents.StatusCode -eq 200 -and ($courseStudents.Json.Count -gt 0 -or $courseStudents.Json.length -gt 0)) {
    Record-Result "Enrollment" "Get Students In Course" "GET /courses/{id}/students" 200 $courseStudents.StatusCode "PASS" "Verified course student list"
} else {
    Record-Result "Enrollment" "Get Students In Course" "GET /courses/{id}/students" 200 $courseStudents.StatusCode "FAIL" $courseStudents.Content
}

# 2.20 MARK ATTENDANCE
$attDate = (Get-Date).ToString("yyyy-MM-dd")
$attBody = "{`"studentId`":$studentId,`"courseId`":$courseId,`"date`":`"$attDate`",`"status`":`"PRESENT`"}"
$createAtt = Invoke-Api -Method POST -Uri "$baseUrl/attendance" -Headers $adminHeaders -Body $attBody
$attId = $createAtt.Json.id
if ($createAtt.StatusCode -eq 201 -and $attId) {
    Record-Result "Attendance" "Mark Attendance" "POST /attendance" 201 $createAtt.StatusCode "PASS" "Marked Attendance ID=$attId"
} else {
    Record-Result "Attendance" "Mark Attendance" "POST /attendance" 201 $createAtt.StatusCode "FAIL" $createAtt.Content
}

# 2.21 GET ALL ATTENDANCE
$getAllAtt = Invoke-Api -Method GET -Uri "$baseUrl/attendance" -Headers $adminHeaders
if ($getAllAtt.StatusCode -eq 200) {
    Record-Result "Attendance" "Get All Attendance" "GET /attendance" 200 $getAllAtt.StatusCode "PASS" "Retrieved attendance records"
} else {
    Record-Result "Attendance" "Get All Attendance" "GET /attendance" 200 $getAllAtt.StatusCode "FAIL" $getAllAtt.Content
}

# 2.22 GET ATTENDANCE BY ID
$getAtt = Invoke-Api -Method GET -Uri "$baseUrl/attendance/$attId" -Headers $adminHeaders
if ($getAtt.StatusCode -eq 200 -and $getAtt.Json.status -eq "PRESENT") {
    Record-Result "Attendance" "Get Attendance By ID" "GET /attendance/{id}" 200 $getAtt.StatusCode "PASS" "Retrieved Attendance ID=$attId"
} else {
    Record-Result "Attendance" "Get Attendance By ID" "GET /attendance/{id}" 200 $getAtt.StatusCode "FAIL" $getAtt.Content
}

# 2.23 GET ATTENDANCE BY STUDENT
$getAttStu = Invoke-Api -Method GET -Uri "$baseUrl/attendance/student/$studentId" -Headers $adminHeaders
if ($getAttStu.StatusCode -eq 200 -and ($getAttStu.Json.Count -gt 0 -or $getAttStu.Json.length -gt 0)) {
    Record-Result "Attendance" "Get Attendance By Student" "GET /attendance/student/{id}" 200 $getAttStu.StatusCode "PASS" "Retrieved student attendance"
} else {
    Record-Result "Attendance" "Get Attendance By Student" "GET /attendance/student/{id}" 200 $getAttStu.StatusCode "FAIL" $getAttStu.Content
}

# 2.24 GET ATTENDANCE BY COURSE
$getAttCourse = Invoke-Api -Method GET -Uri "$baseUrl/attendance/course/$courseId" -Headers $adminHeaders
if ($getAttCourse.StatusCode -eq 200 -and ($getAttCourse.Json.Count -gt 0 -or $getAttCourse.Json.length -gt 0)) {
    Record-Result "Attendance" "Get Attendance By Course" "GET /attendance/course/{id}" 200 $getAttCourse.StatusCode "PASS" "Retrieved course attendance"
} else {
    Record-Result "Attendance" "Get Attendance By Course" "GET /attendance/course/{id}" 200 $getAttCourse.StatusCode "FAIL" $getAttCourse.Content
}

# 2.25 UPDATE ATTENDANCE
$upAttBody = "{`"studentId`":$studentId,`"courseId`":$courseId,`"date`":`"$attDate`",`"status`":`"ABSENT`"}"
$upAtt = Invoke-Api -Method PUT -Uri "$baseUrl/attendance/$attId" -Headers $adminHeaders -Body $upAttBody
if ($upAtt.StatusCode -eq 200 -and $upAtt.Json.status -eq "ABSENT") {
    Record-Result "Attendance" "Update Attendance" "PUT /attendance/{id}" 200 $upAtt.StatusCode "PASS" "Updated status to ABSENT"
} else {
    Record-Result "Attendance" "Update Attendance" "PUT /attendance/{id}" 200 $upAtt.StatusCode "FAIL" $upAtt.Content
}

# 2.26 ENTER MARKS
$marksBody = "{`"studentId`":$studentId,`"courseId`":$courseId,`"marksObtained`":88.5,`"maxMarks`":100.0,`"examType`":`"MIDTERM`",`"semester`":3,`"academicYear`":`"2026`"}"
$createMarks = Invoke-Api -Method POST -Uri "$baseUrl/marks" -Headers $adminHeaders -Body $marksBody
$marksId = $createMarks.Json.id
if ($createMarks.StatusCode -eq 201 -and $marksId) {
    Record-Result "Marks" "Enter Marks" "POST /marks" 201 $createMarks.StatusCode "PASS" "Created Marks ID=$marksId"
} else {
    Record-Result "Marks" "Enter Marks" "POST /marks" 201 $createMarks.StatusCode "FAIL" $createMarks.Content
}

# 2.27 GET ALL MARKS
$getAllMarks = Invoke-Api -Method GET -Uri "$baseUrl/marks" -Headers $adminHeaders
if ($getAllMarks.StatusCode -eq 200) {
    Record-Result "Marks" "Get All Marks" "GET /marks" 200 $getAllMarks.StatusCode "PASS" "Retrieved marks list"
} else {
    Record-Result "Marks" "Get All Marks" "GET /marks" 200 $getAllMarks.StatusCode "FAIL" $getAllMarks.Content
}

# 2.28 GET MARKS BY ID
$getMarks = Invoke-Api -Method GET -Uri "$baseUrl/marks/$marksId" -Headers $adminHeaders
if ($getMarks.StatusCode -eq 200 -and $getMarks.Json.marksObtained -eq 88.5) {
    Record-Result "Marks" "Get Marks By ID" "GET /marks/{id}" 200 $getMarks.StatusCode "PASS" "Retrieved Marks ID=$marksId"
} else {
    Record-Result "Marks" "Get Marks By ID" "GET /marks/{id}" 200 $getMarks.StatusCode "FAIL" $getMarks.Content
}

# 2.29 GET MARKS BY STUDENT
$getMarksStu = Invoke-Api -Method GET -Uri "$baseUrl/marks/student/$studentId" -Headers $adminHeaders
if ($getMarksStu.StatusCode -eq 200 -and ($getMarksStu.Json.Count -gt 0 -or $getMarksStu.Json.length -gt 0)) {
    Record-Result "Marks" "Get Marks By Student" "GET /marks/student/{id}" 200 $getMarksStu.StatusCode "PASS" "Retrieved student marks list"
} else {
    Record-Result "Marks" "Get Marks By Student" "GET /marks/student/{id}" 200 $getMarksStu.StatusCode "FAIL" $getMarksStu.Content
}

# 2.30 GET MARKS BY COURSE
$getMarksCourse = Invoke-Api -Method GET -Uri "$baseUrl/marks/course/$courseId" -Headers $adminHeaders
if ($getMarksCourse.StatusCode -eq 200 -and ($getMarksCourse.Json.Count -gt 0 -or $getMarksCourse.Json.length -gt 0)) {
    Record-Result "Marks" "Get Marks By Course" "GET /marks/course/{id}" 200 $getMarksCourse.StatusCode "PASS" "Retrieved course marks list"
} else {
    Record-Result "Marks" "Get Marks By Course" "GET /marks/course/{id}" 200 $getMarksCourse.StatusCode "FAIL" $getMarksCourse.Content
}

# 2.31 UPDATE MARKS
$upMarksBody = "{`"studentId`":$studentId,`"courseId`":$courseId,`"marksObtained`":95.0,`"maxMarks`":100.0,`"examType`":`"FINAL`",`"semester`":3,`"academicYear`":`"2026`"}"
$upMarks = Invoke-Api -Method PUT -Uri "$baseUrl/marks/$marksId" -Headers $adminHeaders -Body $upMarksBody
if ($upMarks.StatusCode -eq 200 -and $upMarks.Json.marksObtained -eq 95.0) {
    Record-Result "Marks" "Update Marks" "PUT /marks/{id}" 200 $upMarks.StatusCode "PASS" "Updated marks to 95.0"
} else {
    Record-Result "Marks" "Update Marks" "PUT /marks/{id}" 200 $upMarks.StatusCode "FAIL" $upMarks.Content
}

# 2.32 CREATE ASSIGNMENT
$dueDate = (Get-Date).AddDays(14).ToString("yyyy-MM-dd")
$assignBody = "{`"title`":`"CNN Project $rnd`",`"description`":`"Build image classifier`",`"courseId`":$courseId,`"facultyId`":$facId,`"dueDate`":`"$dueDate`"}"
$createAssign = Invoke-Api -Method POST -Uri "$baseUrl/assignments" -Headers $adminHeaders -Body $assignBody
$assignId = $createAssign.Json.id
if ($createAssign.StatusCode -eq 201 -and $assignId) {
    Record-Result "Assignments" "Create Assignment" "POST /assignments" 201 $createAssign.StatusCode "PASS" "Created Assignment ID=$assignId"
} else {
    Record-Result "Assignments" "Create Assignment" "POST /assignments" 201 $createAssign.StatusCode "FAIL" $createAssign.Content
}

# 2.33 GET ALL ASSIGNMENTS
$getAllAssign = Invoke-Api -Method GET -Uri "$baseUrl/assignments" -Headers $adminHeaders
if ($getAllAssign.StatusCode -eq 200) {
    Record-Result "Assignments" "Get All Assignments" "GET /assignments" 200 $getAllAssign.StatusCode "PASS" "Retrieved assignments list"
} else {
    Record-Result "Assignments" "Get All Assignments" "GET /assignments" 200 $getAllAssign.StatusCode "FAIL" $getAllAssign.Content
}

# 2.34 GET ASSIGNMENT BY ID
$getAssign = Invoke-Api -Method GET -Uri "$baseUrl/assignments/$assignId" -Headers $adminHeaders
if ($getAssign.StatusCode -eq 200 -and $getAssign.Json.title -eq "CNN Project $rnd") {
    Record-Result "Assignments" "Get Assignment By ID" "GET /assignments/{id}" 200 $getAssign.StatusCode "PASS" "Retrieved Assignment ID=$assignId"
} else {
    Record-Result "Assignments" "Get Assignment By ID" "GET /assignments/{id}" 200 $getAssign.StatusCode "FAIL" $getAssign.Content
}

# 2.35 GET ASSIGNMENTS BY COURSE
$getAssignCourse = Invoke-Api -Method GET -Uri "$baseUrl/assignments/course/$courseId" -Headers $adminHeaders
if ($getAssignCourse.StatusCode -eq 200 -and ($getAssignCourse.Json.Count -gt 0 -or $getAssignCourse.Json.length -gt 0)) {
    Record-Result "Assignments" "Get Assignments By Course" "GET /assignments/course/{id}" 200 $getAssignCourse.StatusCode "PASS" "Retrieved course assignments"
} else {
    Record-Result "Assignments" "Get Assignments By Course" "GET /assignments/course/{id}" 200 $getAssignCourse.StatusCode "FAIL" $getAssignCourse.Content
}

# 2.36 GET ASSIGNMENTS BY FACULTY
$getAssignFac = Invoke-Api -Method GET -Uri "$baseUrl/assignments/faculty/$facId" -Headers $adminHeaders
if ($getAssignFac.StatusCode -eq 200 -and ($getAssignFac.Json.Count -gt 0 -or $getAssignFac.Json.length -gt 0)) {
    Record-Result "Assignments" "Get Assignments By Faculty" "GET /assignments/faculty/{id}" 200 $getAssignFac.StatusCode "PASS" "Retrieved faculty assignments"
} else {
    Record-Result "Assignments" "Get Assignments By Faculty" "GET /assignments/faculty/{id}" 200 $getAssignFac.StatusCode "FAIL" $getAssignFac.Content
}

# 2.37 UPDATE ASSIGNMENT
$upAssignBody = "{`"title`":`"CNN Project Final $rnd`",`"description`":`"Build image classifier and report`",`"courseId`":$courseId,`"facultyId`":$facId,`"dueDate`":`"$dueDate`"}"
$upAssign = Invoke-Api -Method PUT -Uri "$baseUrl/assignments/$assignId" -Headers $adminHeaders -Body $upAssignBody
if ($upAssign.StatusCode -eq 200 -and $upAssign.Json.title -eq "CNN Project Final $rnd") {
    Record-Result "Assignments" "Update Assignment" "PUT /assignments/{id}" 200 $upAssign.StatusCode "PASS" "Updated assignment title verified"
} else {
    Record-Result "Assignments" "Update Assignment" "PUT /assignments/{id}" 200 $upAssign.StatusCode "FAIL" $upAssign.Content
}

Write-Host "=== SECTION 3: ROLE-BASED AUTHORIZATION TESTS ===" -ForegroundColor Cyan

# 3.1 Faculty creating Course (Allowed)
$facCourseBody = "{`"courseName`":`"Faculty Course $rnd`",`"courseCode`":`"FC_$rnd`",`"description`":`"Taught by faculty`",`"departmentId`":$deptId,`"facultyId`":$facId}"
$facCourse = Invoke-Api -Method POST -Uri "$baseUrl/courses" -Headers $facultyHeaders -Body $facCourseBody
if ($facCourse.StatusCode -eq 201) {
    Record-Result "Security" "Faculty Create Course" "POST /courses" 201 $facCourse.StatusCode "PASS" "Faculty authorized to create course"
} else {
    Record-Result "Security" "Faculty Create Course" "POST /courses" 201 $facCourse.StatusCode "FAIL" $facCourse.Content
}

# 3.2 Faculty creating Department (Forbidden -> 403)
$facDept = Invoke-Api -Method POST -Uri "$baseUrl/departments" -Headers $facultyHeaders -Body "{`"name`":`"Illegal Dept`",`"code`":`"ILL_DEPT`"}"
if ($facDept.StatusCode -eq 403) {
    Record-Result "Security" "Faculty Create Dept (Forbidden)" "POST /departments" 403 $facDept.StatusCode "PASS" "Correctly rejected with 403"
} else {
    Record-Result "Security" "Faculty Create Dept (Forbidden)" "POST /departments" 403 $facDept.StatusCode "FAIL" "Expected 403, got $($facDept.StatusCode)"
}

# 3.3 Student creating Course (Forbidden -> 403)
$stuCourse = Invoke-Api -Method POST -Uri "$baseUrl/courses" -Headers $studentHeaders -Body "{`"courseName`":`"Student Course`",`"courseCode`":`"SC_$rnd`",`"departmentId`":$deptId}"
if ($stuCourse.StatusCode -eq 403) {
    Record-Result "Security" "Student Create Course (Forbidden)" "POST /courses" 403 $stuCourse.StatusCode "PASS" "Correctly rejected with 403"
} else {
    Record-Result "Security" "Student Create Course (Forbidden)" "POST /courses" 403 $stuCourse.StatusCode "FAIL" "Expected 403, got $($stuCourse.StatusCode)"
}

# 3.4 Student marking Attendance (Forbidden -> 403)
$stuAtt = Invoke-Api -Method POST -Uri "$baseUrl/attendance" -Headers $studentHeaders -Body "{`"studentId`":$studentId,`"courseId`":$courseId,`"date`":`"$attDate`",`"status`":`"PRESENT`"}"
if ($stuAtt.StatusCode -eq 403) {
    Record-Result "Security" "Student Mark Attendance (Forbidden)" "POST /attendance" 403 $stuAtt.StatusCode "PASS" "Correctly rejected with 403"
} else {
    Record-Result "Security" "Student Mark Attendance (Forbidden)" "POST /attendance" 403 $stuAtt.StatusCode "FAIL" "Expected 403, got $($stuAtt.StatusCode)"
}

# 3.5 Student entering Marks (Forbidden -> 403)
$stuMarks = Invoke-Api -Method POST -Uri "$baseUrl/marks" -Headers $studentHeaders -Body "{`"studentId`":$studentId,`"courseId`":$courseId,`"marksObtained`":100,`"maxMarks`":100}"
if ($stuMarks.StatusCode -eq 403) {
    Record-Result "Security" "Student Enter Marks (Forbidden)" "POST /marks" 403 $stuMarks.StatusCode "PASS" "Correctly rejected with 403"
} else {
    Record-Result "Security" "Student Enter Marks (Forbidden)" "POST /marks" 403 $stuMarks.StatusCode "FAIL" "Expected 403, got $($stuMarks.StatusCode)"
}

# 3.6 Student viewing own Attendance (Allowed -> 200)
$stuViewAtt = Invoke-Api -Method GET -Uri "$baseUrl/attendance/student/$studentId" -Headers $studentHeaders
if ($stuViewAtt.StatusCode -eq 200) {
    Record-Result "Security" "Student Read Attendance (Allowed)" "GET /attendance/student/{id}" 200 $stuViewAtt.StatusCode "PASS" "Student read access permitted"
} else {
    Record-Result "Security" "Student Read Attendance (Allowed)" "GET /attendance/student/{id}" 200 $stuViewAtt.StatusCode "FAIL" $stuViewAtt.Content
}

# 3.7 Non-admin delete operation (Forbidden -> 403)
$facDelete = Invoke-Api -Method DELETE -Uri "$baseUrl/departments/$deptId" -Headers $facultyHeaders
if ($facDelete.StatusCode -eq 403) {
    Record-Result "Security" "Faculty Delete Dept (Forbidden)" "DELETE /departments/{id}" 403 $facDelete.StatusCode "PASS" "Correctly rejected with 403"
} else {
    Record-Result "Security" "Faculty Delete Dept (Forbidden)" "DELETE /departments/{id}" 403 $facDelete.StatusCode "FAIL" "Expected 403, got $($facDelete.StatusCode)"
}

Write-Host "=== SECTION 4: VALIDATION TESTS ===" -ForegroundColor Cyan

# 4.1 Empty required fields
$emptyDept = Invoke-Api -Method POST -Uri "$baseUrl/departments" -Headers $adminHeaders -Body '{"name":"","code":""}'
if ($emptyDept.StatusCode -eq 400 -and $emptyDept.Json.errors) {
    Record-Result "Validation" "Empty Required Fields" "POST /departments" 400 $emptyDept.StatusCode "PASS" "Rejected with validation error list"
} else {
    Record-Result "Validation" "Empty Required Fields" "POST /departments" 400 $emptyDept.StatusCode "FAIL" $emptyDept.Content
}

# 4.2 Invalid Email format
$badEmail = Invoke-Api -Method POST -Uri "$baseUrl/faculty" -Headers $adminHeaders -Body "{`"name`":`"Test`",`"email`":`"not-an-email`",`"departmentId`":$deptId}"
if ($badEmail.StatusCode -eq 400) {
    Record-Result "Validation" "Invalid Email Format" "POST /faculty" 400 $badEmail.StatusCode "PASS" "Rejected invalid email"
} else {
    Record-Result "Validation" "Invalid Email Format" "POST /faculty" 400 $badEmail.StatusCode "FAIL" $badEmail.Content
}

# 4.3 Duplicate Department Code (409)
$dupDept = Invoke-Api -Method POST -Uri "$baseUrl/departments" -Headers $adminHeaders -Body "{`"name`":`"Duplicate Dept`",`"code`":`"$deptCode`"}"
if ($dupDept.StatusCode -eq 409) {
    Record-Result "Validation" "Duplicate Department Code" "POST /departments" 409 $dupDept.StatusCode "PASS" "Rejected with 409 Conflict"
} else {
    Record-Result "Validation" "Duplicate Department Code" "POST /departments" 409 $dupDept.StatusCode "FAIL" "Expected 409, got $($dupDept.StatusCode)"
}

# 4.4 Duplicate Course Code (409)
$dupCourse = Invoke-Api -Method POST -Uri "$baseUrl/courses" -Headers $adminHeaders -Body "{`"courseName`":`"Dup Course`",`"courseCode`":`"$courseCode`",`"departmentId`":$deptId}"
if ($dupCourse.StatusCode -eq 409) {
    Record-Result "Validation" "Duplicate Course Code" "POST /courses" 409 $dupCourse.StatusCode "PASS" "Rejected with 409 Conflict"
} else {
    Record-Result "Validation" "Duplicate Course Code" "POST /courses" 409 $dupCourse.StatusCode "FAIL" "Expected 409, got $($dupCourse.StatusCode)"
}

# 4.5 Duplicate Faculty Email (409)
$dupFac = Invoke-Api -Method POST -Uri "$baseUrl/faculty" -Headers $adminHeaders -Body "{`"name`":`"Dup Faculty`",`"email`":`"$facEmail`",`"departmentId`":$deptId}"
if ($dupFac.StatusCode -eq 409) {
    Record-Result "Validation" "Duplicate Faculty Email" "POST /faculty" 409 $dupFac.StatusCode "PASS" "Rejected with 409 Conflict"
} else {
    Record-Result "Validation" "Duplicate Faculty Email" "POST /faculty" 409 $dupFac.StatusCode "FAIL" "Expected 409, got $($dupFac.StatusCode)"
}

# 4.6 Nonexistent Department ID (404)
$badDeptId = Invoke-Api -Method POST -Uri "$baseUrl/courses" -Headers $adminHeaders -Body '{"courseName":"Ghost Course","courseCode":"GHOST101","departmentId":999999}'
if ($badDeptId.StatusCode -eq 404) {
    Record-Result "Validation" "Nonexistent Department ID" "POST /courses" 404 $badDeptId.StatusCode "PASS" "Rejected with 404 Not Found"
} else {
    Record-Result "Validation" "Nonexistent Department ID" "POST /courses" 404 $badDeptId.StatusCode "FAIL" "Expected 404, got $($badDeptId.StatusCode)"
}

# 4.7 Nonexistent Student ID in Marks (404)
$badStuMarks = Invoke-Api -Method POST -Uri "$baseUrl/marks" -Headers $adminHeaders -Body "{`"studentId`":999999,`"courseId`":$courseId,`"marksObtained`":80,`"maxMarks`":100,`"examType`":`"MID`"}"
if ($badStuMarks.StatusCode -eq 404) {
    Record-Result "Validation" "Nonexistent Student ID" "POST /marks" 404 $badStuMarks.StatusCode "PASS" "Rejected with 404 Not Found"
} else {
    Record-Result "Validation" "Nonexistent Student ID" "POST /marks" 404 $badStuMarks.StatusCode "FAIL" "Expected 404, got $($badStuMarks.StatusCode)"
}

# 4.8 Marks Obtained > Max Marks (400)
$invalidMarks = Invoke-Api -Method POST -Uri "$baseUrl/marks" -Headers $adminHeaders -Body "{`"studentId`":$studentId,`"courseId`":$courseId,`"marksObtained`":120,`"maxMarks`":100,`"examType`":`"MID`"}"
if ($invalidMarks.StatusCode -eq 400) {
    Record-Result "Validation" "Marks > MaxMarks" "POST /marks" 400 $invalidMarks.StatusCode "PASS" "Rejected marksObtained > maxMarks"
} else {
    Record-Result "Validation" "Marks > MaxMarks" "POST /marks" 400 $invalidMarks.StatusCode "FAIL" "Expected 400, got $($invalidMarks.StatusCode)"
}

# 4.9 Negative Marks (400)
$negMarks = Invoke-Api -Method POST -Uri "$baseUrl/marks" -Headers $adminHeaders -Body "{`"studentId`":$studentId,`"courseId`":$courseId,`"marksObtained`":-10,`"maxMarks`":100,`"examType`":`"MID`"}"
if ($negMarks.StatusCode -eq 400) {
    Record-Result "Validation" "Negative Marks" "POST /marks" 400 $negMarks.StatusCode "PASS" "Rejected negative marks"
} else {
    Record-Result "Validation" "Negative Marks" "POST /marks" 400 $negMarks.StatusCode "FAIL" "Expected 400, got $($negMarks.StatusCode)"
}

Write-Host "=== SECTION 5: SEARCH & PAGINATION TESTS ===" -ForegroundColor Cyan

# 5.1 Pagination on Students
$pageResp = Invoke-Api -Method GET -Uri "$baseUrl/students?page=0&size=2" -Headers $adminHeaders
if ($pageResp.StatusCode -eq 200 -and $pageResp.Json.content -ne $null) {
    Record-Result "Pagination" "Students Pagination" "GET /students?page=0&size=2" 200 $pageResp.StatusCode "PASS" "Paged response received (size=2)"
} else {
    Record-Result "Pagination" "Students Pagination" "GET /students?page=0&size=2" 200 $pageResp.StatusCode "FAIL" $pageResp.Content
}

# 5.2 Filter Faculty by Department
$facDeptFilter = Invoke-Api -Method GET -Uri "$baseUrl/faculty?departmentId=$deptId" -Headers $adminHeaders
if ($facDeptFilter.StatusCode -eq 200) {
    Record-Result "Search" "Filter Faculty by Dept" "GET /faculty?departmentId={id}" 200 $facDeptFilter.StatusCode "PASS" "Filtered faculty by dept"
} else {
    Record-Result "Search" "Filter Faculty by Dept" "GET /faculty?departmentId={id}" 200 $facDeptFilter.StatusCode "FAIL" $facDeptFilter.Content
}

# 5.3 Filter Course by Name
$courseNameFilter = Invoke-Api -Method GET -Uri "$baseUrl/courses?name=Neural" -Headers $adminHeaders
if ($courseNameFilter.StatusCode -eq 200) {
    Record-Result "Search" "Search Course by Name" "GET /courses?name=..." 200 $courseNameFilter.StatusCode "PASS" "Search by course name verified"
} else {
    Record-Result "Search" "Search Course by Name" "GET /courses?name=..." 200 $courseNameFilter.StatusCode "FAIL" $courseNameFilter.Content
}

# 5.4 Filter Attendance by Date
$attDateFilter = Invoke-Api -Method GET -Uri "$baseUrl/attendance?date=$attDate" -Headers $adminHeaders
if ($attDateFilter.StatusCode -eq 200) {
    Record-Result "Search" "Filter Attendance by Date" "GET /attendance?date=..." 200 $attDateFilter.StatusCode "PASS" "Filtered attendance by date"
} else {
    Record-Result "Search" "Filter Attendance by Date" "GET /attendance?date=..." 200 $attDateFilter.StatusCode "FAIL" $attDateFilter.Content
}

Write-Host "=== SECTION 6: DELETE ENDPOINTS CLEANUP VERIFICATION ===" -ForegroundColor Cyan

# 6.1 Delete Attendance
$delAtt = Invoke-Api -Method DELETE -Uri "$baseUrl/attendance/$attId" -Headers $adminHeaders
if ($delAtt.StatusCode -eq 200) {
    Record-Result "Attendance" "Delete Attendance" "DELETE /attendance/{id}" 200 $delAtt.StatusCode "PASS" "Deleted attendance record"
} else {
    Record-Result "Attendance" "Delete Attendance" "DELETE /attendance/{id}" 200 $delAtt.StatusCode "FAIL" $delAtt.Content
}

# 6.2 Delete Marks
$delMarks = Invoke-Api -Method DELETE -Uri "$baseUrl/marks/$marksId" -Headers $adminHeaders
if ($delMarks.StatusCode -eq 200) {
    Record-Result "Marks" "Delete Marks" "DELETE /marks/{id}" 200 $delMarks.StatusCode "PASS" "Deleted marks record"
} else {
    Record-Result "Marks" "Delete Marks" "DELETE /marks/{id}" 200 $delMarks.StatusCode "FAIL" $delMarks.Content
}

# 6.3 Delete Assignment
$delAssign = Invoke-Api -Method DELETE -Uri "$baseUrl/assignments/$assignId" -Headers $adminHeaders
if ($delAssign.StatusCode -eq 200) {
    Record-Result "Assignments" "Delete Assignment" "DELETE /assignments/{id}" 200 $delAssign.StatusCode "PASS" "Deleted assignment record"
} else {
    Record-Result "Assignments" "Delete Assignment" "DELETE /assignments/{id}" 200 $delAssign.StatusCode "FAIL" $delAssign.Content
}

# 6.4 Remove Student from Course (Enrollment DELETE)
$unenroll = Invoke-Api -Method DELETE -Uri "$baseUrl/students/$studentId/courses/$courseId" -Headers $adminHeaders
if ($unenroll.StatusCode -eq 200) {
    Record-Result "Enrollment" "Drop Course for Student" "DELETE /students/{sId}/courses/{cId}" 200 $unenroll.StatusCode "PASS" "Student dropped course"
} else {
    Record-Result "Enrollment" "Drop Course for Student" "DELETE /students/{sId}/courses/{cId}" 200 $unenroll.StatusCode "FAIL" $unenroll.Content
}

# 6.5 Delete Student
$delStu = Invoke-Api -Method DELETE -Uri "$baseUrl/students/$studentId" -Headers $adminHeaders
if ($delStu.StatusCode -eq 200) {
    Record-Result "Students" "Delete Student" "DELETE /students/{id}" 200 $delStu.StatusCode "PASS" "Deleted student record"
} else {
    Record-Result "Students" "Delete Student" "DELETE /students/{id}" 200 $delStu.StatusCode "FAIL" $delStu.Content
}

# 6.6 Delete Course
$delCourse = Invoke-Api -Method DELETE -Uri "$baseUrl/courses/$courseId" -Headers $adminHeaders
if ($delCourse.StatusCode -eq 200) {
    Record-Result "Courses" "Delete Course" "DELETE /courses/{id}" 200 $delCourse.StatusCode "PASS" "Deleted course record"
} else {
    Record-Result "Courses" "Delete Course" "DELETE /courses/{id}" 200 $delCourse.StatusCode "FAIL" $delCourse.Content
}

# 6.7 Delete Faculty
$delFac = Invoke-Api -Method DELETE -Uri "$baseUrl/faculty/$facId" -Headers $adminHeaders
if ($delFac.StatusCode -eq 200) {
    Record-Result "Faculty" "Delete Faculty" "DELETE /faculty/{id}" 200 $delFac.StatusCode "PASS" "Deleted faculty record"
} else {
    Record-Result "Faculty" "Delete Faculty" "DELETE /faculty/{id}" 200 $delFac.StatusCode "FAIL" $delFac.Content
}

# 6.8 Delete Department
$delDept = Invoke-Api -Method DELETE -Uri "$baseUrl/departments/$deptId" -Headers $adminHeaders
if ($delDept.StatusCode -eq 200) {
    Record-Result "Departments" "Delete Department" "DELETE /departments/{id}" 200 $delDept.StatusCode "PASS" "Deleted department record"
} else {
    Record-Result "Departments" "Delete Department" "DELETE /departments/{id}" 200 $delDept.StatusCode "FAIL" $delDept.Content
}

Write-Host "=== TEST SUMMARY ===" -ForegroundColor Green
$results | Format-Table -AutoSize Category, TestName, Endpoint, ExpectedStatus, ActualStatus, Status
$passCount = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
$totalCount = $results.Count
Write-Host "Total Tests: $totalCount | Passed: $passCount | Failed: $failCount" -ForegroundColor Yellow

$results | ConvertTo-Json -Depth 5 | Out-File -FilePath "d:/student-management/test_results.json" -Encoding utf8
