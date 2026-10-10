package com.example.student_management.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.student_management.entity.Marks;

@Repository
public interface MarksRepository extends JpaRepository<Marks, Long> {
    List<Marks> findByStudentId(Long studentId);
    void deleteByStudentId(Long studentId);
    List<Marks> findByCourseId(Long courseId);
    List<Marks> findByStudentIdAndCourseId(Long studentId, Long courseId);
}
