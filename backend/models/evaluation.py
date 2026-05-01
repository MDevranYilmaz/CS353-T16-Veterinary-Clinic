from database.connection import DBContext


class EvaluationModel:
    @staticmethod
    def create(points, date, comment, owner_id, vet_id, man_id=None) -> int:
        with DBContext() as (conn, cur):
            cur.execute(
                "INSERT INTO Evaluation (points, date, comment, owner_id, vet_id, man_id) VALUES (%s,%s,%s,%s,%s,%s)",
                (points, date, comment, owner_id, vet_id, man_id),
            )
            return cur.lastrowid

    @staticmethod
    def list_by_vet(vet_id: int, limit: int = 10):
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT e.*, u.full_name AS owner_name
                FROM Evaluation e
                JOIN Pet_Owner po ON po.user_id = e.owner_id
                JOIN User u ON u.user_id = po.user_id
                WHERE e.vet_id = %s
                ORDER BY e.date DESC
                LIMIT %s
                """,
                (vet_id, limit),
            )
            return cur.fetchall()

    @staticmethod
    def avg_rating(vet_id: int):
        with DBContext() as (conn, cur):
            cur.execute(
                "SELECT ROUND(AVG(points),2) AS avg_rating, COUNT(*) AS total FROM Evaluation WHERE vet_id = %s",
                (vet_id,),
            )
            return cur.fetchone()
