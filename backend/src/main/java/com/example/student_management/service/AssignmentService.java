package com.example.student_management.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.student_management.dto.request.AssignmentRequestDTO;
import com.example.student_management.entity.Assignment;
import com.example.student_management.entity.Course;
import com.example.student_management.entity.Faculty;
import com.example.student_management.exception.ResourceNotFoundException;
import com.example.student_management.repository.AssignmentRepository;

@Service
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final CourseService courseService;
    private final FacultyService facultyService;

    @Autowired
    public AssignmentService(AssignmentRepository assignmentRepository, CourseService courseService, FacultyService facultyService) {
        this.assignmentRepository = assignmentRepository;
        this.courseService = courseService;
        this.facultyService = facultyService;
    }

    public List<Assignment> getAllAssignments() {
        return assignmentRepository.findAll();
    }

    public Assignment getAssignmentById(Long id) {
        return assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + id));
    }

    public List<Assignment> getAssignmentsByCourse(Long courseId) {
        courseService.getCourseById(courseId);
        return assignmentRepository.findByCourseId(courseId);
    }

    public List<Assignment> getAssignmentsByFaculty(Long facultyId) {
        facultyService.getFacultyById(facultyId);
        return assignmentRepository.findByFacultyId(facultyId);
    }

    public Assignment createAssignment(AssignmentRequestDTO dto) {
        Course course = courseService.getCourseById(dto.getCourseId());
        Faculty faculty = facultyService.getFacultyById(dto.getFacultyId());
        Assignment assignment = new Assignment(dto.getTitle(), dto.getDescription(), course, faculty, dto.getDueDate());
        return assignmentRepository.save(assignment);
    }

    public Assignment updateAssignment(Long id, AssignmentRequestDTO dto) {
        Assignment existing = getAssignmentById(id);
        Course course = courseService.getCourseById(dto.getCourseId());
        Faculty faculty = facultyService.getFacultyById(dto.getFacultyId());
        existing.setTitle(dto.getTitle());
        existing.setDescription(dto.getDescription());
        existing.setCourse(course);
        existing.setFaculty(faculty);
        existing.setDueDate(dto.getDueDate());
        return assignmentRepository.save(existing);
    }

    public void deleteAssignment(Long id) {
        Assignment existing = getAssignmentById(id);
        assignmentRepository.delete(existing);
    }
}
