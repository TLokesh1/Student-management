package com.example.student_management.entity;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "assignments")
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String description;

    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne
    @JoinColumn(name = "faculty_id", nullable = false)
    private Faculty faculty;

    @Column(nullable = false)
    private LocalDate dueDate;

    private LocalDate createdDate;

    @PrePersist
    public void onPrePersist() {
        if (this.createdDate == null) {
            this.createdDate = LocalDate.now();
        }
    }

    public Assignment() {
    }

    public Assignment(String title, String description, Course course, Faculty faculty, LocalDate dueDate) {
        this.title = title;
        this.description = description;
        this.course = course;
        this.faculty = faculty;
        this.dueDate = dueDate;
        this.createdDate = LocalDate.now();
    }

    public Assignment(Long id, String title, String description, Course course, Faculty faculty, LocalDate dueDate, LocalDate createdDate) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.course = course;
        this.faculty = faculty;
        this.dueDate = dueDate;
        this.createdDate = createdDate != null ? createdDate : LocalDate.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course course) {
        this.course = course;
    }

    public Faculty getFaculty() {
        return faculty;
    }

    public void setFaculty(Faculty faculty) {
        this.faculty = faculty;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public LocalDate getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(LocalDate createdDate) {
        this.createdDate = createdDate;
    }
}
