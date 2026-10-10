package com.example.student_management.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.student_management.entity.Faculty;

@Repository
public interface FacultyRepository extends JpaRepository<Faculty, Long> {
    Optional<Faculty> findByEmail(String email);
    boolean existsByEmail(String email);
    List<Faculty> findByDepartmentId(Long departmentId);
    Page<Faculty> findByDepartmentId(Long departmentId, Pageable pageable);
    List<Faculty> findByNameContainingIgnoreCase(String name);
    Page<Faculty> findByNameContainingIgnoreCase(String name, Pageable pageable);
}
