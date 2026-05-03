-- Views for Veterinary Clinic Chain Management System

-- -------------------------------------------------------
-- 1. PetMedicalTimeline
--    Union of appointments, vaccinations, and referrals per pet
-- -------------------------------------------------------
CREATE OR REPLACE VIEW PetMedicalTimeline AS
    SELECT
        p.pet_id,
        p.name          AS pet_name,
        'Appointment'   AS event_type,
        a.date_time     AS event_date,
        CONCAT('Appointment - ', a.status)       AS description,
        u.full_name     AS vet_name,
        NULL            AS extra_info
    FROM Appointment a
    JOIN Pet          p ON p.pet_id   = a.pet_id
    JOIN Veterinarian v ON v.user_id  = a.vet_id
    JOIN User         u ON u.user_id  = v.user_id

UNION ALL

    SELECT
        p.pet_id,
        p.name          AS pet_name,
        'Vaccination'   AS event_type,
        CAST(vac.vac_date AS DATETIME) AS event_date,
        CONCAT('Vaccination: ', m.med_name) AS description,
        u.full_name     AS vet_name,
        CONCAT('Next due: ', IFNULL(vac.next_due_date, 'N/A')) AS extra_info
    FROM Vaccination vac
    JOIN Pet          p ON p.pet_id    = vac.pet_id
    JOIN Veterinarian v ON v.user_id   = vac.vet_id
    JOIN User         u ON u.user_id   = v.user_id
    JOIN Medicine     m ON m.barcode_no = vac.barcode_no

UNION ALL

    SELECT
        p.pet_id,
        p.name          AS pet_name,
        'Referral'      AS event_type,
        CAST(r.referral_date AS DATETIME) AS event_date,
        CONCAT('Referral to Dr. ', ur.full_name, ': ', LEFT(r.reason, 100)) AS description,
        us.full_name    AS vet_name,
        CONCAT('Status: ', r.status) AS extra_info
    FROM Referral r
    JOIN Pet          p  ON p.pet_id   = r.pet_id
    JOIN Veterinarian vs ON vs.user_id = r.sender_vet_id
    JOIN User         us ON us.user_id = vs.user_id
    JOIN Veterinarian vr ON vr.user_id = r.receiver_vet_id
    JOIN User         ur ON ur.user_id = vr.user_id;


-- -------------------------------------------------------
-- 2. LowStockAlert
--    Medicines at or below min_threshold per branch
-- -------------------------------------------------------
CREATE OR REPLACE VIEW LowStockAlert AS
    SELECT
        bs.branch_id,
        b.name          AS branch_name,
        bs.barcode_no,
        m.med_name,
        m.med_type,
        bs.stock_count,
        bs.min_threshold,
        (bs.min_threshold - bs.stock_count) AS deficit,
        bs.expiration_date,
        bs.batch_number
    FROM BranchStock bs
    JOIN Branch   b ON b.branch_id  = bs.branch_id
    JOIN Medicine m ON m.barcode_no = bs.barcode_no
    WHERE bs.stock_count <= bs.min_threshold;


-- -------------------------------------------------------
-- 3. OutstandingBills
--    Unpaid bills with owner / pet / vet information
-- -------------------------------------------------------
CREATE OR REPLACE VIEW OutstandingBills AS
    SELECT
        bi.bill_id,
        bi.generated_date,
        bi.total_amount,
        bi.payment_status,
        a.appointment_id,
        a.date_time     AS appointment_date,
        p.pet_id,
        p.name          AS pet_name,
        uo.full_name    AS owner_name,
        uo.email        AS owner_email,
        po.user_id      AS owner_id,
        uv.full_name    AS vet_name,
        v.specialization
    FROM Bill bi
    JOIN Appointment  a  ON a.appointment_id = bi.appointment_id
    JOIN Pet          p  ON p.pet_id          = a.pet_id
    JOIN Pet_Owner    po ON po.user_id         = p.owner_id
    JOIN User         uo ON uo.user_id         = po.user_id
    JOIN Veterinarian v  ON v.user_id          = a.vet_id
    JOIN User         uv ON uv.user_id         = v.user_id
    WHERE bi.payment_status = 'Unpaid';


-- -------------------------------------------------------
-- 4. VetDailySchedule
--    Appointment counts per vet per calendar day
-- -------------------------------------------------------
CREATE OR REPLACE VIEW VetDailySchedule AS
    SELECT
        a.vet_id,
        u.full_name     AS vet_name,
        v.specialization,
        v.branch_id,
        DATE(a.date_time) AS schedule_date,
        COUNT(*)          AS total_appointments,
        SUM(CASE WHEN a.status = 'Scheduled'  THEN 1 ELSE 0 END) AS scheduled_count,
        SUM(CASE WHEN a.status = 'Completed'  THEN 1 ELSE 0 END) AS completed_count,
        SUM(CASE WHEN a.status = 'Cancelled'  THEN 1 ELSE 0 END) AS cancelled_count
    FROM Appointment a
    JOIN Veterinarian v ON v.user_id = a.vet_id
    JOIN User         u ON u.user_id = v.user_id
    GROUP BY a.vet_id, u.full_name, v.specialization, v.branch_id, DATE(a.date_time);


-- -------------------------------------------------------
-- 5. VaccinationStatus
--    Per vaccination record with a computed status label
-- -------------------------------------------------------
CREATE OR REPLACE VIEW VaccinationStatus AS
    SELECT
        vac.vac_id,
        vac.pet_id,
        p.name          AS pet_name,
        p.breed,
        vac.vac_date,
        vac.next_due_date,
        m.med_name      AS vaccine_name,
        vc.vac_type,
        u.full_name     AS vet_name,
        CASE
            WHEN vac.next_due_date IS NULL                          THEN 'Up to Date'
            WHEN vac.next_due_date < CURDATE()                     THEN 'Overdue'
            WHEN vac.next_due_date BETWEEN CURDATE()
                                       AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'Due Soon'
            WHEN vac.next_due_date > DATE_ADD(CURDATE(), INTERVAL 30 DAY)       THEN 'Upcoming'
            ELSE 'Up to Date'
        END AS vaccination_status
    FROM Vaccination  vac
    JOIN Pet          p  ON p.pet_id    = vac.pet_id
    JOIN Medicine     m  ON m.barcode_no = vac.barcode_no
    JOIN Vaccine      vc ON vc.barcode_no = vac.barcode_no
    JOIN Veterinarian v  ON v.user_id   = vac.vet_id
    JOIN User         u  ON u.user_id   = v.user_id;


-- -------------------------------------------------------
-- 6. OverdueVaccinations
--    Vaccinations past next_due_date with owner contact info
-- -------------------------------------------------------
CREATE OR REPLACE VIEW OverdueVaccinations AS
    SELECT
        vac.vac_id,
        vac.pet_id,
        p.name          AS pet_name,
        p.breed,
        vac.vac_date,
        vac.next_due_date,
        DATEDIFF(CURDATE(), vac.next_due_date) AS days_overdue,
        m.med_name      AS vaccine_name,
        vc.vac_type,
        uo.full_name    AS owner_name,
        uo.email        AS owner_email,
        uo.phone        AS owner_phone,
        po.address      AS owner_address,
        uv.full_name    AS vet_name,
        v.branch_id
    FROM Vaccination  vac
    JOIN Pet          p  ON p.pet_id     = vac.pet_id
    JOIN Pet_Owner    po ON po.user_id   = p.owner_id
    JOIN User         uo ON uo.user_id   = po.user_id
    JOIN Medicine     m  ON m.barcode_no  = vac.barcode_no
    JOIN Vaccine      vc ON vc.barcode_no = vac.barcode_no
    JOIN Veterinarian v  ON v.user_id    = vac.vet_id
    JOIN User         uv ON uv.user_id   = v.user_id
    WHERE vac.next_due_date IS NOT NULL
      AND vac.next_due_date < CURDATE();


-- -------------------------------------------------------
-- 7. PetVaccinationSchedule
--    Generates vaccination schedule for each pet based on applied plan
--    This is the core view for feature (a)
-- -------------------------------------------------------
CREATE OR REPLACE VIEW PetVaccinationSchedule AS
    SELECT
        p.pet_id,
        p.name                  AS pet_name,
        p.species,
        p.breed,
        p.gender,
        p.birth_date,
        pvp.plan_id,
        vp_table.plan_name,
        vpi.item_id,
        vpi.vaccine_barcode,
        m.med_name              AS vaccine_name,
        vc.vac_type,
        vpi.age_weeks,
        vpi.sequence_number,
        vpi.repeat_every_months,
        vpi.gender_applicable,
        vpi.notes,
        -- Calculate recommended date: birth_date + age_weeks
        DATE_ADD(p.birth_date, INTERVAL vpi.age_weeks WEEK) AS recommended_date,
        -- Get last administered date for this vaccine
        (SELECT MAX(vac.vac_date)
         FROM Vaccination vac
         WHERE vac.pet_id = p.pet_id
         AND vac.barcode_no = vpi.vaccine_barcode
         LIMIT 1) AS last_admin_date,
        -- Calculate next due date (for boosters)
        CASE
            WHEN vpi.repeat_every_months IS NULL THEN NULL
            WHEN (SELECT COUNT(*) FROM Vaccination WHERE pet_id = p.pet_id AND barcode_no = vpi.vaccine_barcode) = 0
                THEN DATE_ADD(p.birth_date, INTERVAL vpi.age_weeks WEEK)
            ELSE DATE_ADD(
                (SELECT MAX(vac.vac_date) FROM Vaccination vac 
                 WHERE vac.pet_id = p.pet_id AND vac.barcode_no = vpi.vaccine_barcode),
                INTERVAL vpi.repeat_every_months MONTH
            )
        END AS next_due_date,
        -- Vaccination status
        CASE
            WHEN vpi.gender_applicable IS NOT NULL AND vpi.gender_applicable != p.gender THEN 'Not Applicable'
            WHEN (SELECT COUNT(*) FROM Vaccination WHERE pet_id = p.pet_id AND barcode_no = vpi.vaccine_barcode) > 0 THEN 'Administered'
            WHEN DATE_ADD(p.birth_date, INTERVAL vpi.age_weeks WEEK) < CURDATE() THEN 'Overdue'
            WHEN DATE_ADD(p.birth_date, INTERVAL vpi.age_weeks WEEK) <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'Due Soon'
            ELSE 'Upcoming'
        END AS vaccination_status,
        u_vet.full_name         AS plan_created_by,
        pvp.applied_date        AS plan_applied_date
    FROM Pet p
    JOIN PetVaccinationPlan pvp ON pvp.pet_id = p.pet_id
    JOIN VaccinationPlan vp_table ON vp_table.plan_id = pvp.plan_id
    JOIN VaccinationPlanItem vpi ON vpi.plan_id = vp_table.plan_id
    JOIN Medicine m ON m.barcode_no = vpi.vaccine_barcode
    JOIN Vaccine vc ON vc.barcode_no = vpi.vaccine_barcode
    LEFT JOIN Veterinarian v_vet ON v_vet.user_id = vp_table.created_by
    LEFT JOIN User u_vet ON u_vet.user_id = v_vet.user_id
    LEFT JOIN Veterinarian v ON v.user_id = pvp.applied_by
    LEFT JOIN User u ON u.user_id = v.user_id
    WHERE pvp.pet_id IS NOT NULL;


-- -------------------------------------------------------
-- 8. PetUpcomingVaccinations
--    Get vaccinations due within next 30 days (filterable)
-- -------------------------------------------------------
CREATE OR REPLACE VIEW PetUpcomingVaccinations AS
    SELECT
        pet_id,
        pet_name,
        species,
        breed,
        gender,
        plan_id,
        plan_name,
        vaccine_barcode,
        vaccine_name,
        vac_type,
        next_due_date,
        vaccination_status,
        plan_applied_date,
        DATEDIFF(next_due_date, CURDATE()) AS days_until_due
    FROM PetVaccinationSchedule
    WHERE vaccination_status = 'Due Soon'
       OR (vaccination_status = 'Upcoming' 
           AND next_due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY));


-- -------------------------------------------------------
-- 9. PetOverdueVaccinations
--    Get vaccinations that are overdue based on plan
-- -------------------------------------------------------
CREATE OR REPLACE VIEW PetOverdueVaccinations AS
    SELECT
        pvs.pet_id,
        pvs.pet_name,
        pvs.species,
        pvs.breed,
        pvs.gender,
        pvs.plan_id,
        pvs.plan_name,
        pvs.vaccine_barcode,
        pvs.vaccine_name,
        pvs.vac_type,
        pvs.next_due_date,
        DATEDIFF(CURDATE(), pvs.next_due_date) AS days_overdue,
        po.address,
        uo.full_name        AS owner_name,
        uo.email            AS owner_email,
        uo.phone            AS owner_phone
    FROM PetVaccinationSchedule pvs
    JOIN Pet p ON p.pet_id = pvs.pet_id
    JOIN Pet_Owner po ON po.user_id = p.owner_id
    JOIN User uo ON uo.user_id = po.user_id
    WHERE pvs.vaccination_status = 'Overdue';


-- -------------------------------------------------------
-- 10. ApplicablePlansForPet
--     Get vaccination plans applicable to a pet's species and breed
-- -------------------------------------------------------
CREATE OR REPLACE VIEW ApplicablePlansForPet AS
    SELECT DISTINCT
        vp.plan_id,
        vp.plan_name,
        vp.species,
        vp.breed,
        vp.description,
        vp.created_date,
        u.full_name        AS created_by_name,
        COUNT(vpi.item_id) AS vaccine_count
    FROM VaccinationPlan vp
    LEFT JOIN VaccinationPlanItem vpi ON vpi.plan_id = vp.plan_id
    LEFT JOIN Veterinarian v ON v.user_id = vp.created_by
    LEFT JOIN User u ON u.user_id = v.user_id
    GROUP BY vp.plan_id, vp.plan_name, vp.species, vp.breed, vp.description, vp.created_date, u.full_name;
