package com.example.student_management.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.student_management.dto.request.MarksRequestDTO;
import com.example.student_management.entity.Marks;
import com.example.student_management.service.MarksService;

import jakarta.validation.Valid;

@RestController
@RequestMapping({"/marks", "/api/marks"})
@CrossOrigin(origins = "*")
public class MarksController {

    private final MarksService marksService;

    @Autowired
    public MarksController(MarksService marksService) {
        this.marksService = marksService;
    }

    @GetMapping
    public ResponseEntity<List<Marks>> getAllMarks() {
        return ResponseEntity.ok(marksService.getAllMarks());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Marks> getMarksById(@PathVariable Long id) {
        return ResponseEntity.ok(marksService.getMarksById(id));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Marks>> getMarksByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(marksService.getMarksByStudent(studentId));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<Marks>> getMarksByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(marksService.getMarksByCourse(courseId));
    }

    @PostMapping
    public ResponseEntity<Marks> createMarks(@Valid @RequestBody MarksRequestDTO dto) {
        Marks created = marksService.createMarks(dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Marks> updateMarks(@PathVariable Long id, @Valid @RequestBody MarksRequestDTO dto) {
        Marks updated = marksService.updateMarks(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteMarks(@PathVariable Long id) {
        marksService.deleteMarks(id);
        return ResponseEntity.ok("Marks record deleted successfully");
    }
}
