-- Stored Procedures for Veterinary Clinic Chain Management System

DELIMITER //

-- -------------------------------------------------------
-- check_appointment_limit
-- Logic: count non-cancelled appointments for a vet on
-- the given date; set p_can_book = TRUE if count < 15
-- -------------------------------------------------------
DROP PROCEDURE IF EXISTS check_appointment_limit //

CREATE PROCEDURE check_appointment_limit(
    IN  p_vet_id    INT,
    IN  p_date_time DATETIME,
    OUT p_can_book  BOOLEAN
)
BEGIN
    DECLARE v_count INT DEFAULT 0;

    SELECT COUNT(*) INTO v_count
    FROM   Appointment
    WHERE  vet_id = p_vet_id
      AND  DATE(date_time) = DATE(p_date_time)
      AND  status <> 'Cancelled';

    IF v_count < 15 THEN
        SET p_can_book = TRUE;
    ELSE
        SET p_can_book = FALSE;
    END IF;
END //

DELIMITER ;
