package com.example.student_management.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.example.student_management.dto.request.CourseRequestDTO;
import com.example.student_management.entity.Course;
import com.example.student_management.entity.Department;
import com.example.student_management.entity.Faculty;
import com.example.student_management.exception.DuplicateResourceException;
import com.example.student_management.exception.ResourceNotFoundException;
import com.example.student_management.repository.CourseRepository;

@Service
public class CourseService {

    private final CourseRepository courseRepository;
    private final DepartmentService departmentService;
    private final FacultyService facultyService;

    @Autowired
    public CourseService(CourseRepository courseRepository, DepartmentService departmentService, FacultyService facultyService) {
        this.courseRepository = courseRepository;
        this.departmentService = departmentService;
        this.facultyService = facultyService;
    }

    public List<Course> getAllCourses(Long departmentId, String name) {
        if (departmentId != null) {
            return courseRepository.findByDepartmentId(departmentId);
        }
        if (name != null && !name.isBlank()) {
            return courseRepository.findByCourseNameContainingIgnoreCase(name);
        }
        return courseRepository.findAll();
    }

    public Page<Course> getCoursesPaged(Long departmentId, String name, Pageable pageable) {
        if (departmentId != null) {
            return courseRepository.findByDepartmentId(departmentId, pageable);
        }
        if (name != null && !name.isBlank()) {
            return courseRepository.findByCourseNameContainingIgnoreCase(name, pageable);
        }
        return courseRepository.findAll(pageable);
    }

    public Course getCourseById(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + id));
    }

    public Course createCourse(CourseRequestDTO dto) {
        if (courseRepository.existsByCourseCode(dto.getCourseCode())) {
            throw new DuplicateResourceException("Course with code '" + dto.getCourseCode() + "' already exists");
        }
        Department department = departmentService.getDepartmentById(dto.getDepartmentId());
        Faculty faculty = dto.getFacultyId() != null ? facultyService.getFacultyById(dto.getFacultyId()) : null;

        Course course = new Course(dto.getCourseName(), dto.getCourseCode(), dto.getDescription(), department, faculty);
        return courseRepository.save(course);
    }

    public Course updateCourse(Long id, CourseRequestDTO dto) {
        Course existing = getCourseById(id);
        if (!existing.getCourseCode().equalsIgnoreCase(dto.getCourseCode()) && courseRepository.existsByCourseCode(dto.getCourseCode())) {
            throw new DuplicateResourceException("Course with code '" + dto.getCourseCode() + "' already exists");
        }
        Department department = departmentService.getDepartmentById(dto.getDepartmentId());
        Faculty faculty = dto.getFacultyId() != null ? facultyService.getFacultyById(dto.getFacultyId()) : null;

        existing.setCourseName(dto.getCourseName());
        existing.setCourseCode(dto.getCourseCode());
        existing.setDescription(dto.getDescription());
        existing.setDepartment(department);
        existing.setFaculty(faculty);
        return courseRepository.save(existing);
    }

    public void deleteCourse(Long id) {
        Course existing = getCourseById(id);
        courseRepository.delete(existing);
    }
}
