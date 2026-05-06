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

    @staticmethod
    def list_available(branch_id: int, size: str = None):
        with DBContext() as (conn, cur):
            query = """
                SELECT bu.*, b.name AS branch_name
                FROM BoardingUnit bu
                JOIN Branch b ON b.branch_id = bu.branch_id
                WHERE bu.branch_id = %s AND bu.is_occupied = 0
            """
            params = [branch_id]
            if size:
                query += " AND bu.size = %s"
                params.append(size)
            query += " ORDER BY bu.size, bu.boarding_unit_id"
            cur.execute(query, params)
            return cur.fetchall()

    @staticmethod
    def book(boarding_unit_id: int, pet_id: int, check_in_date: str, check_out_date: str, feeding_instructions: str = None):
        with DBContext() as (conn, cur):
            cur.execute(
                """
                UPDATE BoardingUnit
                SET is_occupied = 1, pet_id = %s,
                    check_in_date = %s, check_out_date = %s,
                    feeding_instructions = %s
                WHERE boarding_unit_id = %s AND is_occupied = 0
                """,
                (pet_id, check_in_date, check_out_date, feeding_instructions, boarding_unit_id),
            )
            conn.commit()
            return cur.rowcount > 0

    @staticmethod
    def checkout(boarding_unit_id: int):
        with DBContext() as (conn, cur):
            cur.execute(
                """
                UPDATE BoardingUnit
                SET is_occupied = 0, pet_id = NULL,
                    check_in_date = NULL, check_out_date = NULL,
                    feeding_instructions = NULL
                WHERE boarding_unit_id = %s
                """,
                (boarding_unit_id,),
            )
            conn.commit()
            return cur.rowcount > 0

    @staticmethod
    def set_maintenance(boarding_unit_id: int, under_maintenance: bool):
        # maintenance = is_occupied=1, pet_id=NULL
        with DBContext() as (conn, cur):
            if under_maintenance:
                cur.execute(
                    "UPDATE BoardingUnit SET is_occupied = 1, pet_id = NULL, check_in_date = NULL, check_out_date = NULL WHERE boarding_unit_id = %s",
                    (boarding_unit_id,),
                )
            else:
                cur.execute(
                    "UPDATE BoardingUnit SET is_occupied = 0 WHERE boarding_unit_id = %s AND pet_id IS NULL",
                    (boarding_unit_id,),
                )
            conn.commit()
            return cur.rowcount > 0
