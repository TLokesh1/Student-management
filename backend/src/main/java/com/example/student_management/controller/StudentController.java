package com.example.student_management.controller;

import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.student_management.entity.Course;
import com.example.student_management.entity.Student;
import com.example.student_management.service.StudentService;

import jakarta.validation.Valid;

@RestController
@RequestMapping({"/students", "/api/students"})
@CrossOrigin(origins = "*")
public class StudentController {

    private final StudentService studentService;

    @Autowired
    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping
    public ResponseEntity<?> getAllStudents(
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        if (page != null && size != null) {
            Page<Student> paged = studentService.getStudentsPaged(departmentId, name, PageRequest.of(page, size));
            return ResponseEntity.ok(paged);
        }
        List<Student> list = studentService.getAllStudents(departmentId, name);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Student> getStudentById(@PathVariable Long id) {
        return studentService.getStudentById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Student> createStudent(@Valid @RequestBody Student student) {
        Student savedStudent = studentService.saveStudent(student);
        return new ResponseEntity<>(savedStudent, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Student> updateStudent(@PathVariable Long id, @Valid @RequestBody Student student) {
        Student updatedStudent = studentService.updateStudent(id, student);
        return ResponseEntity.ok(updatedStudent);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteStudent(@PathVariable Long id) {
        boolean deleted = studentService.deleteStudent(id);
        if (deleted) {
            return ResponseEntity.ok("Student deleted successfully");
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Student not found");
    }

    // --- Phase 7: Enrollment Endpoints ---

    @PostMapping("/{studentId}/courses/{courseId}")
    public ResponseEntity<Student> enrollStudentInCourse(
            @PathVariable Long studentId,
            @PathVariable Long courseId
    ) {
        Student updated = studentService.enrollStudentInCourse(studentId, courseId);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{studentId}/courses/{courseId}")
    public ResponseEntity<Student> removeStudentFromCourse(
            @PathVariable Long studentId,
            @PathVariable Long courseId
    ) {
        Student updated = studentService.removeStudentFromCourse(studentId, courseId);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{studentId}/courses")
    public ResponseEntity<Set<Course>> getStudentCourses(@PathVariable Long studentId) {
        Set<Course> courses = studentService.getStudentCourses(studentId);
        return ResponseEntity.ok(courses);
    }
}
