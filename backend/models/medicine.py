from database.connection import DBContext


class MedicineModel:
    @staticmethod
    def find_by_barcode(barcode_no: str):
        with DBContext() as (conn, cur):
            cur.execute("SELECT * FROM Medicine WHERE barcode_no = %s", (barcode_no,))
            return cur.fetchone()

    @staticmethod
    def list_all():
        with DBContext() as (conn, cur):
            cur.execute("SELECT * FROM Medicine ORDER BY med_name")
            return cur.fetchall()


class VaccineModel:
    @staticmethod
    def find_by_barcode(barcode_no: str):
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT m.*, vc.vac_type, vc.side_effect
                FROM Medicine m JOIN Vaccine vc ON vc.barcode_no = m.barcode_no
                WHERE m.barcode_no = %s
                """,
                (barcode_no,),
            )
            return cur.fetchone()

    @staticmethod
    def list_all():
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT m.*, vc.vac_type, vc.side_effect
                FROM Medicine m JOIN Vaccine vc ON vc.barcode_no = m.barcode_no
                ORDER BY m.med_name
                """
            )
            return cur.fetchall()


class BranchStockModel:
    @staticmethod
    def list_by_branch(branch_id: int, name_filter=None, type_filter=None):
        with DBContext() as (conn, cur):
            conditions = ["bs.branch_id = %s"]
            params = [branch_id]
            if name_filter:
                conditions.append("m.med_name LIKE %s")
                params.append(f"%{name_filter}%")
            if type_filter:
                conditions.append("m.med_type = %s")
                params.append(type_filter)
            where = " AND ".join(conditions)
            cur.execute(
                f"""
                SELECT bs.*, m.med_name, m.med_type, m.unit_cost, m.description,
                       CASE WHEN bs.stock_count <= bs.min_threshold THEN 'Low Stock'
                            WHEN bs.expiration_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'Expiring Soon'
                            ELSE 'OK'
                       END AS stock_status
                FROM BranchStock bs
                JOIN Medicine m ON m.barcode_no = bs.barcode_no
                WHERE {where}
                ORDER BY m.med_name
                """,
                params,
            )
            return cur.fetchall()

    @staticmethod
    def upsert(branch_id, barcode_no, stock_count, min_threshold, batch_number, expiration_date):
        with DBContext() as (conn, cur):
            cur.execute(
                """
                INSERT INTO BranchStock (branch_id, barcode_no, stock_count, min_threshold, batch_number, expiration_date)
                VALUES (%s,%s,%s,%s,%s,%s)
                ON DUPLICATE KEY UPDATE
                    stock_count     = stock_count + VALUES(stock_count),
                    min_threshold   = VALUES(min_threshold),
                    batch_number    = VALUES(batch_number),
                    expiration_date = VALUES(expiration_date)
                """,
                (branch_id, barcode_no, stock_count, min_threshold, batch_number, expiration_date),
            )

    @staticmethod
    def update_threshold(branch_id, barcode_no, min_threshold):
        with DBContext() as (conn, cur):
            cur.execute(
                "UPDATE BranchStock SET min_threshold = %s WHERE branch_id = %s AND barcode_no = %s",
                (min_threshold, branch_id, barcode_no),
            )

    @staticmethod
    def deduct(branch_id, barcode_no, quantity):
        with DBContext() as (conn, cur):
            cur.execute(
                """
                UPDATE BranchStock
                SET stock_count = GREATEST(0, stock_count - %s)
                WHERE branch_id = %s AND barcode_no = %s
                """,
                (quantity, branch_id, barcode_no),
            )

    @staticmethod
    def get_stock(branch_id, barcode_no):
        with DBContext() as (conn, cur):
            cur.execute(
                "SELECT stock_count FROM BranchStock WHERE branch_id = %s AND barcode_no = %s",
                (branch_id, barcode_no),
            )
            row = cur.fetchone()
            return row["stock_count"] if row else 0


class WasteLogModel:
    @staticmethod
    def create(quantity, waste_date, reason, manager_id, barcode_no) -> int:
        with DBContext() as (conn, cur):
            cur.execute(
                "INSERT INTO WasteLog (quantity, waste_date, reason, manager_id, barcode_no) VALUES (%s,%s,%s,%s,%s)",
                (quantity, waste_date, reason, manager_id, barcode_no),
            )
            return cur.lastrowid

    @staticmethod
    def list_by_branch(branch_id: int, from_date=None, to_date=None):
        with DBContext() as (conn, cur):
            conditions = ["cm.branch_id = %s"]
            params = [branch_id]
            if from_date:
                conditions.append("wl.waste_date >= %s")
                params.append(from_date)
            if to_date:
                conditions.append("wl.waste_date <= %s")
                params.append(to_date)
            where = " AND ".join(conditions)
            cur.execute(
                f"""
                SELECT wl.*, m.med_name, m.med_type, m.unit_cost,
                       u.full_name AS manager_name
                FROM WasteLog wl
                JOIN Clinic_Manager cm ON cm.user_id = wl.manager_id
                JOIN Medicine m ON m.barcode_no = wl.barcode_no
                JOIN User u ON u.user_id = wl.manager_id
                WHERE {where}
                ORDER BY wl.waste_date DESC
                """,
                params,
            )
            return cur.fetchall()
