-- Triggers for Veterinary Clinic Chain Management System

DELIMITER //

-- -------------------------------------------------------
-- 1. after_prescription_deduct_stock
--    AFTER INSERT on PresMed: deduct dosage from BranchStock
--    at the vet's branch
-- -------------------------------------------------------
DROP TRIGGER IF EXISTS after_prescription_deduct_stock //

CREATE TRIGGER after_prescription_deduct_stock
AFTER INSERT ON PresMed
FOR EACH ROW
BEGIN
    DECLARE v_branch_id INT;

    SELECT v.branch_id INTO v_branch_id
    FROM Prescription pr
    JOIN Veterinarian v ON v.user_id = pr.vet_id
    WHERE pr.prescription_id = NEW.prescription_id
    LIMIT 1;

    IF v_branch_id IS NOT NULL THEN
        UPDATE BranchStock
        SET stock_count = GREATEST(0, stock_count - NEW.dosage)
        WHERE branch_id = v_branch_id
          AND barcode_no = NEW.medicine_id;
    END IF;
END //


-- -------------------------------------------------------
-- 2. after_appointment_complete_generate_bill
--    AFTER UPDATE on Appointment: when status changes to
--    'Completed', calculate total and insert a Bill as 'Unpaid'
-- -------------------------------------------------------
DROP TRIGGER IF EXISTS after_appointment_complete_generate_bill //

CREATE TRIGGER after_appointment_complete_generate_bill
AFTER UPDATE ON Appointment
FOR EACH ROW
BEGIN
    DECLARE v_med_total   DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_consult_fee DECIMAL(10,2) DEFAULT 100.00;
    DECLARE v_total       DECIMAL(10,2);
    DECLARE v_bill_exists INT DEFAULT 0;

    IF NEW.status = 'Completed' AND OLD.status <> 'Completed' THEN
        -- Check no bill already exists
        SELECT COUNT(*) INTO v_bill_exists
        FROM Bill WHERE appointment_id = NEW.appointment_id;

        IF v_bill_exists = 0 THEN
            -- Sum unit_cost * dosage for all medicines prescribed for this pet
            -- by the vet who handled this appointment (latest prescription)
            SELECT COALESCE(SUM(m.unit_cost * pm.dosage), 0.00)
            INTO   v_med_total
            FROM   Prescription pr
            JOIN   PresMed      pm ON pm.prescription_id = pr.prescription_id
            JOIN   Medicine     m  ON m.barcode_no        = pm.medicine_id
            WHERE  pr.pet_id = NEW.pet_id
              AND  pr.vet_id = NEW.vet_id
              AND  DATE(pr.date_time) = DATE(NEW.date_time);

            SET v_total = v_consult_fee + v_med_total;

            INSERT INTO Bill (generated_date, payment_status, total_amount, appointment_id)
            VALUES (CURDATE(), 'Unpaid', v_total, NEW.appointment_id);
        END IF;
    END IF;
END //


-- -------------------------------------------------------
-- 3. before_vaccination_set_next_due
--    BEFORE INSERT on Vaccination: if next_due_date is NULL,
--    set it to vac_date + 12 months
-- -------------------------------------------------------
DROP TRIGGER IF EXISTS before_vaccination_set_next_due //

CREATE TRIGGER before_vaccination_set_next_due
BEFORE INSERT ON Vaccination
FOR EACH ROW
BEGIN
    IF NEW.next_due_date IS NULL THEN
        SET NEW.next_due_date = DATE_ADD(NEW.vac_date, INTERVAL 12 MONTH);
    END IF;
END //


-- -------------------------------------------------------
-- 4. after_branchstock_flag_low_stock
--    AFTER UPDATE on BranchStock: when stock_count drops
--    below min_threshold, raise a warning signal
-- -------------------------------------------------------
DROP TRIGGER IF EXISTS after_branchstock_flag_low_stock //

CREATE TRIGGER after_branchstock_flag_low_stock
AFTER UPDATE ON BranchStock
FOR EACH ROW
BEGIN
    IF NEW.stock_count < NEW.min_threshold
       AND OLD.stock_count >= OLD.min_threshold THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'LOW_STOCK_ALERT: stock dropped below minimum threshold';
    END IF;
END //

DELIMITER ;

-- Trigger for low stock alert
CREATE OR REPLACE FUNCTION create_low_stock_alert()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO LowStockAlert (medicine_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_low_stock
AFTER UPDATE ON medicine
FOR EACH ROW
WHEN (NEW.current_stock < NEW.min_stock)
EXECUTE FUNCTION create_low_stock_alert();

-- Logic to automatically generate a bill
CREATE OR REPLACE FUNCTION generate_bill_on_completion()
RETURNS TRIGGER AS $$
DECLARE
    total_prescription_cost DECIMAL(10,2);
BEGIN
    IF NEW.status = 'Completed' AND OLD.status IS DISTINCT FROM 'Completed' THEN
        SELECT COALESCE(SUM(cost), 0) INTO total_prescription_cost
        FROM prescription WHERE appointment_id = NEW.id;

        INSERT INTO bill (appointment_id, total_amount)
        VALUES (NEW.id, NEW.consultation_fee + total_prescription_cost);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_bill
AFTER UPDATE OF status ON appointment
FOR EACH ROW
EXECUTE FUNCTION generate_bill_on_completion();
