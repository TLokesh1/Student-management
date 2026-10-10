package com.example.student_management.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.student_management.entity.Student;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByEmail(String email);
    boolean existsByEmail(String email);
    List<Student> findByDepartmentId(Long departmentId);
    Page<Student> findByDepartmentId(Long departmentId, Pageable pageable);
    List<Student> findByNameContainingIgnoreCase(String name);
    Page<Student> findByNameContainingIgnoreCase(String name, Pageable pageable);
    List<Student> findByEnrolledCoursesId(Long courseId);
}
