const oracledb = require('oracledb');

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  let connection;

  try {
    // Connect using environment configurations
    connection = await oracledb.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONN_STRING
    });

    // --- 1. CLEAN EXISTING TABLE DATA (ORDER DEPENDS ON FOREIGN KEYS) ---
    const deleteTables = [
      'COCURR_SKILL_MAPPING', 'SKILL_MAPPING', 'EMPLOYABILITY_SKILL', 
      'LEARNING_OUTCOME', 'STUDENT_COCURRICULUM', 'CO_CURRICULUM', 
      'ENROLLMENT', 'COURSE', 'STUDENT', 'PROGRAM'
    ];
    for (const table of deleteTables) {
      await connection.execute(`DELETE FROM ${table}`);
    }

    // --- 2. INSERT SEED DATA ---
    
    // Program
    const progResult = await connection.execute(
      `INSERT INTO PROGRAM (program_name, faculty, total_credits) 
       VALUES ('Bachelor of Computer Science', 'Faculty of Computing', 120) 
       RETURNING program_id INTO :id`,
      { id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } }
    );
    const programId = progResult.outBinds.id[0];

    // Student
    const stuResult = await connection.execute(
      `INSERT INTO STUDENT (full_name, matric_no, email, program_id) 
       VALUES ('Demo Student', 'A22CS9999', 'demo@student.edu', :1) 
       RETURNING student_id INTO :id`,
      [programId],
      { id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } }
    );
    const studentId = stuResult.outBinds.id[0];

    // Courses (Mapped to match Oracle check constraints: 'Academic','Technical','Elective')
    const course1Result = await connection.execute(
      `INSERT INTO COURSE (course_code, course_name, credit_hours, course_type, program_id) 
       VALUES ('CSW101', 'Web Systems', 3, 'Technical', :1) RETURNING course_id INTO :id`,
      [programId], { id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } }
    );
    const course1Id = course1Result.outBinds.id[0];

    const course2Result = await connection.execute(
      `INSERT INTO COURSE (course_code, course_name, credit_hours, course_type, program_id) 
       VALUES ('CSW202', 'Database Systems', 3, 'Technical', :1) RETURNING course_id INTO :id`,
      [programId], { id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } }
    );
    const course2Id = course2Result.outBinds.id[0];

    // Learning Outcomes (Mapped to match Oracle check constraints: 'Knowledge','Skills','Values')
    const loResult1 = await connection.execute(
      `INSERT INTO LEARNING_OUTCOME (lo_code, description, domain, course_id) 
       VALUES ('LO1', 'Apply computing fundamentals to solve problems.', 'Knowledge', :1) RETURNING lo_id INTO :id`,
      [course1Id], { id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } }
    );
    const lo1Id = loResult1.outBinds.id[0];

    const loResult2 = await connection.execute(
      `INSERT INTO LEARNING_OUTCOME (lo_code, description, domain, course_id) 
       VALUES ('LO2', 'Communicate effectively in professional contexts.', 'Skills', :1) RETURNING lo_id INTO :id`,
      [course2Id], { id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } }
    );
    const lo2Id = loResult2.outBinds.id[0];

    // Employability Skills (Mapped to match Oracle check constraints: 'Academic Knowledge','Technical Skills','Marketability Values')
    const skillResult1 = await connection.execute(
      `INSERT INTO EMPLOYABILITY_SKILL (skill_name, skill_type, description) 
       VALUES ('Problem Solving', 'Technical Skills', 'Analyze and solve complex issues.') RETURNING skill_id INTO :id`,
      [], { id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } }
    );
    const skill1Id = skillResult1.outBinds.id[0];

    const skillResult2 = await connection.execute(
      `INSERT INTO EMPLOYABILITY_SKILL (skill_name, skill_type, description) 
       VALUES ('Communication', 'Academic Knowledge', 'Clear written and verbal communication.') RETURNING skill_id INTO :id`,
      [], { id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } }
    );
    const skill2Id = skillResult2.outBinds.id[0];

    // Skill Mappings (Mapped to match Oracle constraints: 'Low','Medium','High')
    await connection.execute(
      `INSERT INTO SKILL_MAPPING (lo_id, skill_id, knowledge_type, mapping_strength) 
       VALUES (:1, :2, 'Technical Skills', 'High')`,
      [lo1Id, skill1Id]
    );
    await connection.execute(
      `INSERT INTO SKILL_MAPPING (lo_id, skill_id, knowledge_type, mapping_strength) 
       VALUES (:1, :2, 'Academic Knowledge', 'High')`,
      [lo2Id, skill2Id]
    );

    // Co-Curriculum Activities
    const cocurrResult = await connection.execute(
      `INSERT INTO CO_CURRICULUM (activity_name, category, credit_hours, organizer, is_credit_bearing) 
       VALUES ('University Hackathon', 'Competition', 0, 'Student Affairs', 0) RETURNING cocurr_id INTO :id`,
      [], { id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } }
    );
    const cocurrId = cocurrResult.outBinds.id[0];

    // Co-Curriculum Skill Mapping
    await connection.execute(
      `INSERT INTO COCURR_SKILL_MAPPING (cocurr_id, skill_id, knowledge_type, mapping_strength) 
       VALUES (:1, :2, 'Technical Skills', 'High')`,
      [cocurrId, skill1Id]
    );

    // Enrollments
    await connection.execute(
      `INSERT INTO ENROLLMENT (student_id, course_id, semester, grade, status) 
       VALUES (:1, :2, '2026S1', 'A-', 'Completed')`,
      [studentId, course1Id]
    );

    // Student Co-Curriculum
    await connection.execute(
      `INSERT INTO STUDENT_COCURRICULUM (student_id, cocurr_id, semester, role, achievement) 
       VALUES (:1, :2, '2026S1', 'Participant', '0.75')`,
      [studentId, cocurrId]
    );

    // Commit changes to database
    await connection.commit();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Oracle SQL Database seeded perfectly!" })
    };

  } catch (err) {
    if (connection) await connection.rollback();
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message })
    };
  } finally {
    if (connection) await connection.close();
  }
};
