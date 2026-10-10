package com.example.student_management.service;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.student_management.dto.request.StudentRequestDTO;
import com.example.student_management.entity.Course;
import com.example.student_management.entity.Department;
import com.example.student_management.entity.Student;
import com.example.student_management.exception.DuplicateResourceException;
import com.example.student_management.exception.ResourceNotFoundException;
import com.example.student_management.repository.AttendanceRepository;
import com.example.student_management.repository.MarksRepository;
import com.example.student_management.repository.StudentRepository;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final DepartmentService departmentService;
    private final CourseService courseService;
private final AttendanceRepository attendanceRepository;
private final MarksRepository marksRepository;
   @Autowired
public StudentService(
        StudentRepository studentRepository,
        DepartmentService departmentService,
        CourseService courseService,
        AttendanceRepository attendanceRepository,
        MarksRepository marksRepository) {

    this.studentRepository = studentRepository;
    this.departmentService = departmentService;
    this.courseService = courseService;
    this.attendanceRepository = attendanceRepository;
    this.marksRepository = marksRepository;
}

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public List<Student> getAllStudents(Long departmentId, String name) {
        if (departmentId != null) {
            return studentRepository.findByDepartmentId(departmentId);
        }
        if (name != null && !name.isBlank()) {
            return studentRepository.findByNameContainingIgnoreCase(name);
        }
        return studentRepository.findAll();
    }

    public Page<Student> getStudentsPaged(Long departmentId, String name, Pageable pageable) {
        if (departmentId != null) {
            return studentRepository.findByDepartmentId(departmentId, pageable);
        }
        if (name != null && !name.isBlank()) {
            return studentRepository.findByNameContainingIgnoreCase(name, pageable);
        }
        return studentRepository.findAll(pageable);
    }

    public Optional<Student> getStudentById(Long id) {
        return studentRepository.findById(id);
    }

    public Student getStudentEntityById(Long id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));
    }

    public Student saveStudent(Student student) {
        if (student.getEmail() != null && studentRepository.existsByEmail(student.getEmail())) {
            throw new DuplicateResourceException("Student with email '" + student.getEmail() + "' already exists");
        }
        return studentRepository.save(student);
    }

    public Student createStudent(StudentRequestDTO dto) {
        if (studentRepository.existsByEmail(dto.getEmail())) {
            throw new DuplicateResourceException("Student with email '" + dto.getEmail() + "' already exists");
        }
        Department department = dto.getDepartmentId() != null ? departmentService.getDepartmentById(dto.getDepartmentId()) : null;
        Student student = new Student(dto.getName(), dto.getEmail(), dto.getAge(), dto.getCourse(), department);
        return studentRepository.save(student);
    }

    public Student updateStudent(Long id, Student updatedStudent) {
        return studentRepository.findById(id).map(existingStudent -> {
            if (updatedStudent.getEmail() != null && !updatedStudent.getEmail().equalsIgnoreCase(existingStudent.getEmail())
                    && studentRepository.existsByEmail(updatedStudent.getEmail())) {
                throw new DuplicateResourceException("Student with email '" + updatedStudent.getEmail() + "' already exists");
            }
            existingStudent.setName(updatedStudent.getName());
            existingStudent.setEmail(updatedStudent.getEmail());
            existingStudent.setAge(updatedStudent.getAge());
            existingStudent.setCourse(updatedStudent.getCourse());
            if (updatedStudent.getDepartment() != null) {
                existingStudent.setDepartment(updatedStudent.getDepartment());
            }
            return studentRepository.save(existingStudent);
        }).orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));
    }

   @Transactional
public boolean deleteStudent(Long id) {
    if (!studentRepository.existsById(id)) {
        return false;
    }

    // Delete records that reference this student
    attendanceRepository.deleteByStudentId(id);
    marksRepository.deleteByStudentId(id);

    // Remove student from student_courses
    Student student = studentRepository.findById(id).get();
    student.getEnrolledCourses().clear();
    studentRepository.save(student);

    // Finally delete the student
    studentRepository.deleteById(id);

    return true;
}

    // --- Phase 7: Enrollment Operations ---

    public Student enrollStudentInCourse(Long studentId, Long courseId) {
        Student student = getStudentEntityById(studentId);
        Course course = courseService.getCourseById(courseId);
        student.enrollCourse(course);
        return studentRepository.save(student);
    }

    public Student removeStudentFromCourse(Long studentId, Long courseId) {
        Student student = getStudentEntityById(studentId);
        Course course = courseService.getCourseById(courseId);
        student.removeCourse(course);
        return studentRepository.save(student);
    }

    public Set<Course> getStudentCourses(Long studentId) {
        Student student = getStudentEntityById(studentId);
        return student.getEnrolledCourses();
    }

    public List<Student> getStudentsInCourse(Long courseId) {
        courseService.getCourseById(courseId); // ensure course exists
        return studentRepository.findByEnrolledCoursesId(courseId);
    }
}
