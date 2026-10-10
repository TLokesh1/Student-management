package com.example.student_management.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.student_management.entity.Department;
import com.example.student_management.entity.Role;
import com.example.student_management.entity.User;
import com.example.student_management.repository.DepartmentRepository;
import com.example.student_management.repository.UserRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public DataInitializer(UserRepository userRepository, DepartmentRepository departmentRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // Seed default Department if none exists
        if (departmentRepository.count() == 0) {
            Department cse = new Department("Computer Science and Engineering", "CSE", "Department of Computer Science & Engineering");
            departmentRepository.save(cse);
        }

        // Seed default Admin if none exists
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User("admin", passwordEncoder.encode("admin123"), "admin@university.edu", Role.ADMIN);
            userRepository.save(admin);
        }

        // Seed default Faculty if none exists
        if (!userRepository.existsByUsername("faculty")) {
            User faculty = new User("faculty", passwordEncoder.encode("faculty123"), "faculty@university.edu", Role.FACULTY);
            userRepository.save(faculty);
        }

        // Seed default Student if none exists
        if (!userRepository.existsByUsername("student")) {
            User student = new User("student", passwordEncoder.encode("student123"), "student@university.edu", Role.STUDENT);
            userRepository.save(student);
        }
    }
}
