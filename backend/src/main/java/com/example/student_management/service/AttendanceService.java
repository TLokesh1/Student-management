package com.example.student_management.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.student_management.dto.request.AttendanceRequestDTO;
import com.example.student_management.entity.Attendance;
import com.example.student_management.entity.Course;
import com.example.student_management.entity.Student;
import com.example.student_management.exception.ResourceNotFoundException;
import com.example.student_management.repository.AttendanceRepository;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final StudentService studentService;
    private final CourseService courseService;

    @Autowired
    public AttendanceService(AttendanceRepository attendanceRepository, StudentService studentService, CourseService courseService) {
        this.attendanceRepository = attendanceRepository;
        this.studentService = studentService;
        this.courseService = courseService;
    }

    public List<Attendance> getAllAttendance(LocalDate date) {
        if (date != null) {
            return attendanceRepository.findByDate(date);
        }
        return attendanceRepository.findAll();
    }

    public Attendance getAttendanceById(Long id) {
        return attendanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found with id: " + id));
    }

    public List<Attendance> getAttendanceByStudent(Long studentId) {
        studentService.getStudentEntityById(studentId); // ensure student exists
        return attendanceRepository.findByStudentId(studentId);
    }

    public List<Attendance> getAttendanceByCourse(Long courseId) {
        courseService.getCourseById(courseId); // ensure course exists
        return attendanceRepository.findByCourseId(courseId);
    }

    public Attendance markAttendance(AttendanceRequestDTO dto) {
        Student student = studentService.getStudentEntityById(dto.getStudentId());
        Course course = courseService.getCourseById(dto.getCourseId());
        Attendance attendance = new Attendance(student, course, dto.getDate(), dto.getStatus());
        return attendanceRepository.save(attendance);
    }

    public Attendance updateAttendance(Long id, AttendanceRequestDTO dto) {
        Attendance existing = getAttendanceById(id);
        Student student = studentService.getStudentEntityById(dto.getStudentId());
        Course course = courseService.getCourseById(dto.getCourseId());
        existing.setStudent(student);
        existing.setCourse(course);
        existing.setDate(dto.getDate());
        existing.setStatus(dto.getStatus());
        return attendanceRepository.save(existing);
    }

    public void deleteAttendance(Long id) {
        Attendance existing = getAttendanceById(id);
        attendanceRepository.delete(existing);
    }
}
