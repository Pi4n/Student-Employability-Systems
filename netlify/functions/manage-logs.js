const oracledb = require('oracledb');

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONN_STRING
    });
    const body = JSON.parse(event.body || "{}");
    await connection.execute(
      `INSERT INTO ENROLLMENT (student_id, course_id, semester, status, grade) VALUES (:1, :2, :3, :4, :5)`,
      [Number(body.student_id), Number(body.course_id), body.semester, body.status, body.grade]
    );
    await connection.commit();
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  } finally {
    if (connection) await connection.close();
  }
};
