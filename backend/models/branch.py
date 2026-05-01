from database.connection import DBContext


class BranchModel:
    @staticmethod
    def list_all(address_filter=None):
        with DBContext() as (conn, cur):
            if address_filter:
                cur.execute(
                    "SELECT * FROM Branch WHERE address LIKE %s ORDER BY name",
                    (f"%{address_filter}%",),
                )
            else:
                cur.execute("SELECT * FROM Branch ORDER BY name")
            return cur.fetchall()

    @staticmethod
    def find_by_id(branch_id: int):
        with DBContext() as (conn, cur):
            cur.execute("SELECT * FROM Branch WHERE branch_id = %s", (branch_id,))
            return cur.fetchone()


class BoardingUnitModel:
    @staticmethod
    def list_by_branch(branch_id: int):
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT bu.*, p.name AS pet_name
                FROM BoardingUnit bu
                LEFT JOIN Pet p ON p.pet_id = bu.pet_id
                WHERE bu.branch_id = %s
                ORDER BY bu.size, bu.boarding_unit_id
                """,
                (branch_id,),
            )
            return cur.fetchall()

    @staticmethod
    def find_by_id(boarding_unit_id: int):
        with DBContext() as (conn, cur):
            cur.execute(
                "SELECT * FROM BoardingUnit WHERE boarding_unit_id = %s",
                (boarding_unit_id,),
            )
            return cur.fetchone()
