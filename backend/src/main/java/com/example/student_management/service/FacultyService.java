package com.example.student_management.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.example.student_management.dto.request.FacultyRequestDTO;
import com.example.student_management.entity.Assignment;
import com.example.student_management.entity.Course;
import com.example.student_management.entity.Department;
import com.example.student_management.entity.Faculty;
import com.example.student_management.exception.DuplicateResourceException;
import com.example.student_management.exception.ResourceNotFoundException;
import com.example.student_management.repository.AssignmentRepository;
import com.example.student_management.repository.CourseRepository;
import com.example.student_management.repository.FacultyRepository;

@Service
public class FacultyService {

    private final FacultyRepository facultyRepository;
    private final DepartmentService departmentService;
    private final CourseRepository courseRepository;
    private final AssignmentRepository assignmentRepository;

    @Autowired
    public FacultyService(FacultyRepository facultyRepository,
                          DepartmentService departmentService,
                          CourseRepository courseRepository,
                          AssignmentRepository assignmentRepository) {
        this.facultyRepository = facultyRepository;
        this.departmentService = departmentService;
        this.courseRepository = courseRepository;
        this.assignmentRepository = assignmentRepository;
    }

    public List<Faculty> getAllFaculty(Long departmentId, String name) {
        if (departmentId != null) {
            return facultyRepository.findByDepartmentId(departmentId);
        }
        if (name != null && !name.isBlank()) {
            return facultyRepository.findByNameContainingIgnoreCase(name);
        }
        return facultyRepository.findAll();
    }

    public Page<Faculty> getFacultyPaged(Long departmentId, String name, Pageable pageable) {
        if (departmentId != null) {
            return facultyRepository.findByDepartmentId(departmentId, pageable);
        }
        if (name != null && !name.isBlank()) {
            return facultyRepository.findByNameContainingIgnoreCase(name, pageable);
        }
        return facultyRepository.findAll(pageable);
    }

    public Faculty getFacultyById(Long id) {
        return facultyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty member not found with id: " + id));
    }

    public Faculty createFaculty(FacultyRequestDTO dto) {
        if (facultyRepository.existsByEmail(dto.getEmail())) {
            throw new DuplicateResourceException("Faculty member with email '" + dto.getEmail() + "' already exists");
        }
        Department department = departmentService.getDepartmentById(dto.getDepartmentId());
        Faculty faculty = new Faculty(dto.getName(), dto.getEmail(), dto.getPhone(), dto.getDesignation(), department);
        return facultyRepository.save(faculty);
    }

    public Faculty updateFaculty(Long id, FacultyRequestDTO dto) {
        Faculty existing = getFacultyById(id);
        if (!existing.getEmail().equalsIgnoreCase(dto.getEmail()) && facultyRepository.existsByEmail(dto.getEmail())) {
            throw new DuplicateResourceException("Faculty member with email '" + dto.getEmail() + "' already exists");
        }
        Department department = departmentService.getDepartmentById(dto.getDepartmentId());
        existing.setName(dto.getName());
        existing.setEmail(dto.getEmail());
        existing.setPhone(dto.getPhone());
        existing.setDesignation(dto.getDesignation());
        existing.setDepartment(department);
        return facultyRepository.save(existing);
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteFaculty(Long id) {
        Faculty existing = getFacultyById(id);
        List<Course> courses = courseRepository.findByFacultyId(id);
        for (Course course : courses) {
            course.setFaculty(null);
            courseRepository.save(course);
        }
        List<Assignment> assignments = assignmentRepository.findByFacultyId(id);
        if (!assignments.isEmpty()) {
            assignmentRepository.deleteAll(assignments);
        }
        facultyRepository.delete(existing);
    }
}
