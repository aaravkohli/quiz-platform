package com.quizplatform.dao;

import com.quizplatform.models.Question;
import com.quizplatform.models.QuestionOption;
import org.jdbi.v3.sqlobject.config.RegisterRowMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.customizer.BindBean;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;
import org.jdbi.v3.sqlobject.transaction.Transaction;

import java.util.List;

@RegisterRowMapper(QuestionMapper.class)
public interface QuestionDAO {
    @SqlUpdate("INSERT INTO questions (quiz_id, question_text, question_type, time_limit, file_upload_url) " +
               "VALUES (:quizId, :questionText, :questionType, :timeLimit, :fileUploadUrl)")
    @Transaction
    void create(@BindBean Question question);

    @SqlQuery("SELECT * FROM questions WHERE id = :id")
    Question findById(@Bind("id") Integer id);

    @SqlQuery("SELECT * FROM questions WHERE quiz_id = :quizId")
    List<Question> findByQuizId(@Bind("quizId") Integer quizId);

    @SqlUpdate("UPDATE questions SET question_text = :questionText, question_type = :questionType, " +
               "time_limit = :timeLimit, file_upload_url = :fileUploadUrl, updated_at = CURRENT_TIMESTAMP " +
               "WHERE id = :id")
    @Transaction
    void update(@BindBean Question question);

    @SqlUpdate("DELETE FROM questions WHERE id = :id")
    @Transaction
    void delete(@Bind("id") Integer id);

    @SqlUpdate("INSERT INTO question_options (question_id, option_text, is_correct) " +
               "VALUES (:questionId, :optionText, :isCorrect)")
    @Transaction
    void addOption(@BindBean QuestionOption option);

    @SqlQuery("SELECT * FROM question_options WHERE question_id = :questionId")
    List<QuestionOption> getOptions(@Bind("questionId") Integer questionId);

    @SqlUpdate("DELETE FROM question_options WHERE question_id = :questionId")
    @Transaction
    void deleteOptions(@Bind("questionId") Integer questionId);

    @SqlQuery("SELECT * FROM questions WHERE quiz_id = :quizId ORDER BY RANDOM()")
    List<Question> getRandomizedQuestions(@Bind("quizId") Integer quizId);
} 