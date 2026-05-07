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
                SELECT bu.*, p.name AS pet_name, b.name AS branch_name,
                       u.full_name AS owner_name
                FROM BoardingUnit bu
                LEFT JOIN Pet p ON p.pet_id = bu.pet_id
                LEFT JOIN Pet_Owner po ON po.user_id = p.owner_id
                LEFT JOIN User u ON u.user_id = po.user_id
                JOIN Branch b ON b.branch_id = bu.branch_id
                WHERE bu.branch_id = %s
                ORDER BY bu.is_occupied DESC, bu.size, bu.boarding_unit_id
                """,
                (branch_id,),
            )
            return cur.fetchall()

    @staticmethod
    def list_by_owner(owner_id: int):
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT bu.*, p.name AS pet_name, b.name AS branch_name
                FROM BoardingUnit bu
                JOIN Pet p ON p.pet_id = bu.pet_id
                JOIN Branch b ON b.branch_id = bu.branch_id
                WHERE p.owner_id = %s AND bu.is_occupied = 1 AND bu.pet_id IS NOT NULL
                ORDER BY bu.check_in_date
                """,
                (owner_id,),
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
    def list_available(branch_id: int, size: str = None, check_in: str = None, check_out: str = None):
        with DBContext() as (conn, cur):
            # A unit is available if:
            # - truly empty (is_occupied=0), OR
            # - occupied by a pet but that booking doesn't overlap with the requested dates
            # Maintenance units (is_occupied=1, pet_id=NULL) are always excluded.
            if check_in and check_out:
                query = """
                    SELECT bu.*, b.name AS branch_name
                    FROM BoardingUnit bu
                    JOIN Branch b ON b.branch_id = bu.branch_id
                    WHERE bu.branch_id = %s
                      AND NOT (bu.is_occupied = 1 AND bu.pet_id IS NULL)
                      AND NOT (bu.is_occupied = 1 AND bu.check_in_date < %s AND bu.check_out_date > %s)
                """
                params = [branch_id, check_out, check_in]
            else:
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
    def pet_has_overlapping_booking(pet_id: int, check_in: str, check_out: str) -> bool:
        """Returns True if the pet already has a booking that overlaps with the given dates."""
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT COUNT(*) AS cnt FROM BoardingUnit
                WHERE pet_id = %s AND is_occupied = 1
                  AND check_in_date < %s AND check_out_date > %s
                """,
                (pet_id, check_out, check_in),
            )
            row = cur.fetchone()
            return row["cnt"] > 0

    @staticmethod
    def book(boarding_unit_id: int, pet_id: int, check_in_date: str, check_out_date: str, feeding_instructions: str = None):
        with DBContext() as (conn, cur):
            # Allow booking if the unit is free OR has a non-overlapping booking.
            # Block if: under maintenance (pet_id IS NULL, is_occupied=1)
            #        or: existing booking overlaps with requested dates.
            cur.execute(
                """
                UPDATE BoardingUnit
                SET is_occupied = 1, pet_id = %s,
                    check_in_date = %s, check_out_date = %s,
                    feeding_instructions = %s
                WHERE boarding_unit_id = %s
                  AND NOT (is_occupied = 1 AND pet_id IS NULL)
                  AND NOT (is_occupied = 1 AND check_in_date < %s AND check_out_date > %s)
                """,
                (pet_id, check_in_date, check_out_date, feeding_instructions,
                 boarding_unit_id, check_out_date, check_in_date),
            )
            conn.commit()
            return cur.rowcount > 0

    @staticmethod
    def checkout(boarding_unit_id: int):
        with DBContext() as (conn, cur):
            # Save to history before clearing
            cur.execute(
                """
                INSERT INTO BoardingHistory (boarding_unit_id, pet_id, branch_id, size, check_in_date, check_out_date, feeding_instructions)
                SELECT boarding_unit_id, pet_id, branch_id, size, check_in_date, check_out_date, feeding_instructions
                FROM BoardingUnit
                WHERE boarding_unit_id = %s AND pet_id IS NOT NULL
                """,
                (boarding_unit_id,),
            )
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
    def past_stays_by_owner(owner_id: int):
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT bh.*, p.name AS pet_name, b.name AS branch_name
                FROM BoardingHistory bh
                JOIN Pet p ON p.pet_id = bh.pet_id
                JOIN Branch b ON b.branch_id = bh.branch_id
                WHERE p.owner_id = %s
                ORDER BY bh.checked_out_at DESC
                """,
                (owner_id,),
            )
            return cur.fetchall()

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
