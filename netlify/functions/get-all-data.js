const oracledb = require('oracledb');

exports.handler = async () => {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONN_STRING
    });

    const students = await connection.execute(`SELECT student_id, student_name, matric_no, email, program_id FROM STUDENT`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const programs = await connection.execute(`SELECT program_id, program_name, faculty, total_credits FROM PROGRAM`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const courses = await connection.execute(`SELECT course_id, course_name, course_code FROM COURSE`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const skills = await connection.execute(`SELECT skill_id, skill_name, category FROM EMPLOYABILITY_SKILL`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const outcomes = await connection.execute(`SELECT lo_id, lo_code, domain, description FROM LEARNING_OUTCOME`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const enrollments = await connection.execute(`SELECT enrollment_id, student_id, course_id, semester, status, grade FROM ENROLLMENT`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        students: students.rows.map(r => ({ student_id: r.STUDENT_ID, full_name: r.STUDENT_NAME, matric_no: r.MATRIC_NO, email: r.EMAIL, program_id: r.PROGRAM_ID })),
        programs: programs.rows.map(r => ({ program_id: r.PROGRAM_ID, program_name: r.PROGRAM_NAME, faculty: r.FACULTY, total_credits: r.TOTAL_CREDITS })),
        courses: courses.rows.map(r => ({ course_id: r.COURSE_ID, course_name: r.COURSE_NAME, course_code: r.COURSE_CODE })),
        employabilitySkills: skills.rows.map(r => ({ skill_id: r.SKILL_ID, skill_name: r.SKILL_NAME, category: r.CATEGORY })),
        learningOutcomes: outcomes.rows.map(r => ({ lo_id: r.LO_ID, lo_code: r.LO_CODE, domain: r.DOMAIN, description: r.DESCRIPTION })),
        enrollments: enrollments.rows.map(r => ({ enrollment_id: r.ENROLLMENT_ID, student_id: r.STUDENT_ID, course_id: r.COURSE_ID, semester: r.SEMESTER, status: r.STATUS, grade: r.GRADE })),
        coCurriculum: [], loSkillMappings: [], coCurrSkillMappings: [], studentCoCurriculum: []
      })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  } finally {
    if (connection) await connection.close();
  }
};
