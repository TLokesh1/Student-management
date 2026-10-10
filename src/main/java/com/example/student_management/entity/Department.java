package com.example.student_management.entity;

import jakarta.annotation.Generated;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;

@Entity 
public class Department {
    @Id 
    @GeneratedValue(strategy= = GeneratationType.IDENTITY)

    private long id;
    private String name;
    private Sting code;
    public long getId() {
        return id;
    }
    public void setId(long id) {
        this.id = id;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public Sting getCode() {
        return code;
    }
    public void setCode(Sting code) {
        this.code = code;
    }

}
