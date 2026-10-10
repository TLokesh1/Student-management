package com.example.student_management.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.student_management.entity.Course;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    Optional<Course> findByCourseCode(String courseCode);
    boolean existsByCourseCode(String courseCode);
    List<Course> findByDepartmentId(Long departmentId);
    Page<Course> findByDepartmentId(Long departmentId, Pageable pageable);
    List<Course> findByCourseNameContainingIgnoreCase(String courseName);
    Page<Course> findByCourseNameContainingIgnoreCase(String courseName, Pageable pageable);
    List<Course> findByFacultyId(Long facultyId);
}
