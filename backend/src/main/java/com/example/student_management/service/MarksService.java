package com.example.student_management.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.student_management.dto.request.MarksRequestDTO;
import com.example.student_management.entity.Course;
import com.example.student_management.entity.Marks;
import com.example.student_management.entity.Student;
import com.example.student_management.exception.BadRequestException;
import com.example.student_management.exception.ResourceNotFoundException;
import com.example.student_management.repository.MarksRepository;

@Service
public class MarksService {

    private final MarksRepository marksRepository;
    private final StudentService studentService;
    private final CourseService courseService;

    @Autowired
    public MarksService(MarksRepository marksRepository, StudentService studentService, CourseService courseService) {
        this.marksRepository = marksRepository;
        this.studentService = studentService;
        this.courseService = courseService;
    }

    public List<Marks> getAllMarks() {
        return marksRepository.findAll();
    }

    public Marks getMarksById(Long id) {
        return marksRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Marks record not found with id: " + id));
    }

    public List<Marks> getMarksByStudent(Long studentId) {
        studentService.getStudentEntityById(studentId);
        return marksRepository.findByStudentId(studentId);
    }

    public List<Marks> getMarksByCourse(Long courseId) {
        courseService.getCourseById(courseId);
        return marksRepository.findByCourseId(courseId);
    }

    public Marks createMarks(MarksRequestDTO dto) {
        if (dto.getMarksObtained() > dto.getMaxMarks()) {
            throw new BadRequestException("Marks obtained cannot exceed maximum marks");
        }
        Student student = studentService.getStudentEntityById(dto.getStudentId());
        Course course = courseService.getCourseById(dto.getCourseId());

        Marks marks = new Marks(
                student,
                course,
                dto.getMarksObtained(),
                dto.getMaxMarks(),
                dto.getExamType(),
                dto.getSemester(),
                dto.getAcademicYear()
        );
        return marksRepository.save(marks);
    }

    public Marks updateMarks(Long id, MarksRequestDTO dto) {
        Marks existing = getMarksById(id);
        if (dto.getMarksObtained() > dto.getMaxMarks()) {
            throw new BadRequestException("Marks obtained cannot exceed maximum marks");
        }
        Student student = studentService.getStudentEntityById(dto.getStudentId());
        Course course = courseService.getCourseById(dto.getCourseId());

        existing.setStudent(student);
        existing.setCourse(course);
        existing.setMarksObtained(dto.getMarksObtained());
        existing.setMaxMarks(dto.getMaxMarks());
        existing.setExamType(dto.getExamType());
        existing.setSemester(dto.getSemester());
        existing.setAcademicYear(dto.getAcademicYear());
        return marksRepository.save(existing);
    }

    public void deleteMarks(Long id) {
        Marks existing = getMarksById(id);
        marksRepository.delete(existing);
    }
}
