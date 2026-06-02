const oracledb = require('oracledb');

exports.handler = async (event) => {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONN_STRING
    });

    const body = JSON.parse(event.body || "{}");

    // Handle Deletions
    if (body.action === "delete") {
      await connection.execute(
        `DELETE FROM PROGRAM WHERE program_id = :1`,
        [Number(body.id)]
      );
      await connection.commit();
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    // Handle Inserts/Updates
    if (body.action === "upsert") {
      const { program_name, faculty, total_credits } = body.entity;
      
      await connection.execute(
        `INSERT INTO PROGRAM (program_name, faculty, total_credits) 
         VALUES (:1, :2, :3)`,
        [program_name, faculty, Number(total_credits)]
      );
      await connection.commit();
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  } finally {
    if (connection) await connection.close();
  }
};
