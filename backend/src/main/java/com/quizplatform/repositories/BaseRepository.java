package com.quizplatform.repositories;

import java.util.List;
import java.util.Optional;

public interface BaseRepository<T> {
    T create(T entity);
    Optional<T> findById(Long id);
    List<T> findAll();
    T update(T entity);
    void delete(Long id);
} 