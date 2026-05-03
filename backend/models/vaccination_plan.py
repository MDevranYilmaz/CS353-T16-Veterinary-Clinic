from database.connection import DBContext


class VaccinationPlanModel:
    @staticmethod
    def create(plan_name, species, breed, description, created_by) -> int:
        """Create a new vaccination plan"""
        with DBContext() as (conn, cur):
            cur.execute(
                """
                INSERT INTO VaccinationPlan (plan_name, species, breed, description, created_by)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (plan_name, species, breed, description, created_by),
            )
            return cur.lastrowid

    @staticmethod
    def find_by_id(plan_id: int):
        """Get vaccination plan by ID"""
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT p.*, u.full_name AS created_by_name
                FROM VaccinationPlan p
                LEFT JOIN Veterinarian v ON v.user_id = p.created_by
                LEFT JOIN User u ON u.user_id = v.user_id
                WHERE p.plan_id = %s
                """,
                (plan_id,),
            )
            return cur.fetchone()

    @staticmethod
    def list_by_species(species: str):
        """Get all plans for a specific species"""
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT p.*, u.full_name AS created_by_name
                FROM VaccinationPlan p
                LEFT JOIN Veterinarian v ON v.user_id = p.created_by
                LEFT JOIN User u ON u.user_id = v.user_id
                WHERE p.species = %s
                ORDER BY p.plan_name
                """,
                (species,),
            )
            return cur.fetchall()

    @staticmethod
    def list_by_species_and_breed(species: str, breed: str = None):
        """Get plans for specific species and optionally breed"""
        with DBContext() as (conn, cur):
            if breed:
                cur.execute(
                    """
                    SELECT p.*, u.full_name AS created_by_name
                    FROM VaccinationPlan p
                    LEFT JOIN Veterinarian v ON v.user_id = p.created_by
                    LEFT JOIN User u ON u.user_id = v.user_id
                    WHERE p.species = %s AND (p.breed = %s OR p.breed IS NULL)
                    ORDER BY p.breed DESC, p.plan_name
                    """,
                    (species, breed),
                )
            else:
                cur.execute(
                    """
                    SELECT p.*, u.full_name AS created_by_name
                    FROM VaccinationPlan p
                    LEFT JOIN Veterinarian v ON v.user_id = p.created_by
                    LEFT JOIN User u ON u.user_id = v.user_id
                    WHERE p.species = %s AND p.breed IS NULL
                    ORDER BY p.plan_name
                    """,
                    (species,),
                )
            return cur.fetchall()

    @staticmethod
    def list_all():
        """Get all vaccination plans"""
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT p.*, u.full_name AS created_by_name
                FROM VaccinationPlan p
                LEFT JOIN Veterinarian v ON v.user_id = p.created_by
                LEFT JOIN User u ON u.user_id = v.user_id
                ORDER BY p.species, p.breed, p.plan_name
                """
            )
            return cur.fetchall()

    @staticmethod
    def update(plan_id: int, plan_name=None, description=None):
        """Update a vaccination plan"""
        with DBContext() as (conn, cur):
            updates = []
            values = []
            if plan_name is not None:
                updates.append("plan_name = %s")
                values.append(plan_name)
            if description is not None:
                updates.append("description = %s")
                values.append(description)

            if not updates:
                return

            values.append(plan_id)
            query = f"UPDATE VaccinationPlan SET {', '.join(updates)} WHERE plan_id = %s"
            cur.execute(query, values)

    @staticmethod
    def delete(plan_id: int):
        """Delete a vaccination plan"""
        with DBContext() as (conn, cur):
            cur.execute("DELETE FROM VaccinationPlan WHERE plan_id = %s", (plan_id,))

    @staticmethod
    def add_item(plan_id: int, vaccine_barcode: str, age_weeks: int, sequence_number: int = None, repeat_every_months: int = None, gender_applicable: str = None, notes: str = None) -> int:
        """Add a vaccine item to a plan"""
        with DBContext() as (conn, cur):
            cur.execute(
                """
                INSERT INTO VaccinationPlanItem (plan_id, vaccine_barcode, age_weeks, sequence_number, repeat_every_months, gender_applicable, notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (plan_id, vaccine_barcode, age_weeks, sequence_number, repeat_every_months, gender_applicable, notes),
            )
            return cur.lastrowid

    @staticmethod
    def get_plan_items(plan_id: int):
        """Get all items in a vaccination plan"""
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT i.*, m.med_name, v.vac_type
                FROM VaccinationPlanItem i
                JOIN Medicine m ON m.barcode_no = i.vaccine_barcode
                JOIN Vaccine v ON v.barcode_no = i.vaccine_barcode
                WHERE i.plan_id = %s
                ORDER BY i.age_weeks, i.sequence_number
                """,
                (plan_id,),
            )
            return cur.fetchall()

    @staticmethod
    def delete_item(item_id: int):
        """Delete an item from a plan"""
        with DBContext() as (conn, cur):
            cur.execute("DELETE FROM VaccinationPlanItem WHERE item_id = %s", (item_id,))

    @staticmethod
    def apply_plan_to_pet(pet_id: int, plan_id: int, applied_by: int):
        """Apply a vaccination plan to a pet"""
        with DBContext() as (conn, cur):
            cur.execute(
                """
                INSERT INTO PetVaccinationPlan (pet_id, plan_id, applied_by)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE applied_by = %s, applied_date = CURRENT_TIMESTAMP
                """,
                (pet_id, plan_id, applied_by, applied_by),
            )

    @staticmethod
    def get_pet_plan(pet_id: int):
        """Get the active vaccination plan for a pet"""
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT p.*, u.full_name AS created_by_name, pv.applied_date
                FROM PetVaccinationPlan pv
                JOIN VaccinationPlan p ON p.plan_id = pv.plan_id
                LEFT JOIN Veterinarian v ON v.user_id = p.created_by
                LEFT JOIN User u ON u.user_id = v.user_id
                WHERE pv.pet_id = %s
                LIMIT 1
                """,
                (pet_id,),
            )
            return cur.fetchone()

    @staticmethod
    def remove_plan_from_pet(pet_id: int, plan_id: int):
        """Remove a plan from a pet"""
        with DBContext() as (conn, cur):
            cur.execute(
                "DELETE FROM PetVaccinationPlan WHERE pet_id = %s AND plan_id = %s",
                (pet_id, plan_id),
            )
