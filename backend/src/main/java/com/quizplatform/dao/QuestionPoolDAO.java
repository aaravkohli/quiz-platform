package com.quizplatform.dao;

import com.quizplatform.models.Question;
import com.quizplatform.models.QuestionPool;
import org.jdbi.v3.sqlobject.config.RegisterRowMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.customizer.BindBean;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;
import org.jdbi.v3.sqlobject.transaction.Transaction;

import java.util.List;

@RegisterRowMapper(QuestionPoolMapper.class)
public interface QuestionPoolDAO {
    @SqlUpdate("INSERT INTO question_pools (name, description, instructor_id) VALUES (:name, :description, :instructorId)")
    @Transaction
    void create(@BindBean QuestionPool pool);

    @SqlQuery("SELECT * FROM question_pools WHERE id = :id")
    QuestionPool findById(@Bind("id") Integer id);

    @SqlQuery("SELECT * FROM question_pools WHERE instructor_id = :instructorId")
    List<QuestionPool> findByInstructorId(@Bind("instructorId") Integer instructorId);

    @SqlUpdate("UPDATE question_pools SET name = :name, description = :description, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    @Transaction
    void update(@BindBean QuestionPool pool);

    @SqlUpdate("DELETE FROM question_pools WHERE id = :id")
    @Transaction
    void delete(@Bind("id") Integer id);

    @SqlUpdate("INSERT INTO pool_questions (pool_id, question_id) VALUES (:poolId, :questionId)")
    @Transaction
    void addQuestionToPool(@Bind("poolId") Integer poolId, @Bind("questionId") Integer questionId);

    @SqlUpdate("DELETE FROM pool_questions WHERE pool_id = :poolId AND question_id = :questionId")
    @Transaction
    void removeQuestionFromPool(@Bind("poolId") Integer poolId, @Bind("questionId") Integer questionId);

    @SqlQuery("SELECT q.* FROM questions q " +
             "JOIN pool_questions pq ON q.id = pq.question_id " +
             "WHERE pq.pool_id = :poolId")
    List<Question> getQuestionsInPool(@Bind("poolId") Integer poolId);
} 