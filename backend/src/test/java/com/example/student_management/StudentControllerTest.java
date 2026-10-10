package com.example.student_management;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import com.example.student_management.entity.Student;
import com.example.student_management.repository.AttendanceRepository;
import com.example.student_management.repository.MarksRepository;
import com.example.student_management.repository.StudentRepository;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
public class StudentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private MarksRepository marksRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @BeforeEach
    void setUp() {
        marksRepository.deleteAll();
        attendanceRepository.deleteAll();
        studentRepository.deleteAll();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldCreateAndRetrieveStudentWithAge() throws Exception {
        String studentJson = """
            {
                "name": "Lokesh",
                "email": "lokesh_ctrl@gmail.com",
                "age": 21,
                "course": "CSE"
            }
        """;

        // Create student at /students
        mockMvc.perform(post("/students")
                .contentType(MediaType.APPLICATION_JSON)
                .content(studentJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.name").value("Lokesh"))
                .andExpect(jsonPath("$.email").value("lokesh_ctrl@gmail.com"))
                .andExpect(jsonPath("$.age").value(21))
                .andExpect(jsonPath("$.course").value("CSE"));

        // Retrieve all students from /students
        mockMvc.perform(get("/students"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Lokesh"))
                .andExpect(jsonPath("$[0].age").value(21));

        // Also test /api/students alias works
        mockMvc.perform(get("/api/students"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldUpdateStudent() throws Exception {
        Student student = new Student("Jane Doe", "jane_ctrl@example.com", 20, "Mathematics");
        Student saved = studentRepository.save(student);

        String updateJson = """
            {
                "name": "Jane Smith",
                "email": "jane_smith_ctrl@example.com",
                "age": 22,
                "course": "Data Science"
            }
        """;

        mockMvc.perform(put("/students/" + saved.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(updateJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Jane Smith"))
                .andExpect(jsonPath("$.age").value(22))
                .andExpect(jsonPath("$.course").value("Data Science"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldDeleteStudent() throws Exception {
        Student student = new Student("Bob Smith", "bob_ctrl@example.com", 23, "Physics");
        Student saved = studentRepository.save(student);

        mockMvc.perform(delete("/students/" + saved.getId()))
                .andExpect(status().isOk());

        mockMvc.perform(get("/students/" + saved.getId()))
                .andExpect(status().isNotFound());
    }
}
