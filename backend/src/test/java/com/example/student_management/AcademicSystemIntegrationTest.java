package com.example.student_management;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.example.student_management.repository.AssignmentRepository;
import com.example.student_management.repository.AttendanceRepository;
import com.example.student_management.repository.CourseRepository;
import com.example.student_management.repository.DepartmentRepository;
import com.example.student_management.repository.FacultyRepository;
import com.example.student_management.repository.MarksRepository;
import com.example.student_management.repository.StudentRepository;
import com.example.student_management.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
public class AcademicSystemIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MarksRepository marksRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void cleanUp() {
        marksRepository.deleteAll();
        attendanceRepository.deleteAll();
        assignmentRepository.deleteAll();
        studentRepository.deleteAll();
        courseRepository.deleteAll();
        facultyRepository.deleteAll();
        userRepository.findByUsername("admin_flow").ifPresent(userRepository::delete);
        departmentRepository.findByCode("IT_FLOW").ifPresent(departmentRepository::delete);
    }

    @Test
    void testEndToEndAcademicFlowWithAuthentication() throws Exception {
        // 1. Register a test admin user
        String registerJson = """
            {
                "username": "admin_flow",
                "password": "password123",
                "email": "admin_flow@university.edu",
                "role": "ADMIN"
            }
        """;

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty());

        // 2. Login as admin to get JWT token
        String loginJson = """
            {
                "username": "admin_flow",
                "password": "password123"
            }
        """;

        MvcResult loginResult = mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn();

        String responseStr = loginResult.getResponse().getContentAsString();
        JsonNode jsonNode = objectMapper.readTree(responseStr);
        String token = "Bearer " + jsonNode.get("token").asText();

        // 3. Create Department
        String deptJson = """
            {
                "name": "Information Technology",
                "code": "IT_FLOW",
                "description": "IT Dept"
            }
        """;

        MvcResult deptResult = mockMvc.perform(post("/departments")
                .header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(deptJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andReturn();

        Long deptId = objectMapper.readTree(deptResult.getResponse().getContentAsString()).get("id").asLong();

        // 4. Create Faculty in this Department
        String facultyJson = String.format("""
            {
                "name": "Prof. Alan Turing",
                "email": "turing_flow@university.edu",
                "phone": "9876543210",
                "designation": "Professor",
                "departmentId": %d
            }
        """, deptId);

        MvcResult facultyResult = mockMvc.perform(post("/faculty")
                .header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(facultyJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andReturn();

        Long facultyId = objectMapper.readTree(facultyResult.getResponse().getContentAsString()).get("id").asLong();

        // 5. Create Course in this Department with Faculty
        String courseJson = String.format("""
            {
                "courseName": "Algorithms",
                "courseCode": "CS201_FLOW",
                "description": "Design & Analysis of Algorithms",
                "departmentId": %d,
                "facultyId": %d
            }
        """, deptId, facultyId);

        MvcResult courseResult = mockMvc.perform(post("/courses")
                .header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(courseJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andReturn();

        Long courseId = objectMapper.readTree(courseResult.getResponse().getContentAsString()).get("id").asLong();

        // 6. Create Student
        String studentJson = """
            {
                "name": "Grace Hopper",
                "email": "grace_flow@university.edu",
                "age": 20,
                "course": "IT"
            }
        """;

        MvcResult studentResult = mockMvc.perform(post("/students")
                .header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(studentJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andReturn();

        Long studentId = objectMapper.readTree(studentResult.getResponse().getContentAsString()).get("id").asLong();

        // 7. Enroll Student in Course
        mockMvc.perform(post("/students/" + studentId + "/courses/" + courseId)
                .header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enrolledCourses[0].courseCode").value("CS201_FLOW"));

        // 8. Mark Attendance
        String attendanceJson = String.format("""
            {
                "studentId": %d,
                "courseId": %d,
                "date": "2026-09-21",
                "status": "PRESENT"
            }
        """, studentId, courseId);

        mockMvc.perform(post("/attendance")
                .header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(attendanceJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PRESENT"));

        // 9. Enter Marks
        String marksJson = String.format("""
            {
                "studentId": %d,
                "courseId": %d,
                "marksObtained": 95.0,
                "maxMarks": 100.0,
                "examType": "MIDTERM",
                "semester": 3,
                "academicYear": "2026"
            }
        """, studentId, courseId);

        mockMvc.perform(post("/marks")
                .header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(marksJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.marksObtained").value(95.0));

        // 10. Create Assignment
        String assignmentJson = String.format("""
            {
                "title": "Dynamic Programming Problem Set",
                "description": "Complete problems 1 to 5",
                "courseId": %d,
                "facultyId": %d,
                "dueDate": "2026-10-15"
            }
        """, courseId, facultyId);

        mockMvc.perform(post("/assignments")
                .header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(assignmentJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Dynamic Programming Problem Set"));

        // 11. Verify query endpoints with filters
        mockMvc.perform(get("/attendance/student/" + studentId)
                .header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        mockMvc.perform(get("/marks/course/" + courseId)
                .header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        mockMvc.perform(get("/assignments/course/" + courseId)
                .header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void testValidationAndDuplicateHandling() throws Exception {
        // Test validation failure with blank fields
        String invalidDeptJson = """
            {
                "name": "",
                "code": ""
            }
        """;

        // Admin login
        String loginJson = """
            {
                "username": "admin",
                "password": "admin123"
            }
        """;

        MvcResult loginResult = mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson))
                .andExpect(status().isOk())
                .andReturn();

        String token = "Bearer " + objectMapper.readTree(loginResult.getResponse().getContentAsString()).get("token").asText();

        mockMvc.perform(post("/departments")
                .header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidDeptJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors").isArray());
    }
}
