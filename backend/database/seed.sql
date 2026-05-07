-- Seed data for Veterinary Clinic Chain Management System
-- Passwords are bcrypt hashes of "password123"

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE WasteLog;
TRUNCATE TABLE BoardingUnit;
TRUNCATE TABLE Medical_History;
TRUNCATE TABLE Evaluation;
TRUNCATE TABLE Referral;
TRUNCATE TABLE Vaccination;
TRUNCATE TABLE PetVaccinationPlan;
TRUNCATE TABLE PresMed;
TRUNCATE TABLE Prescription;
TRUNCATE TABLE BranchStock;
TRUNCATE TABLE Vaccine;
TRUNCATE TABLE Medicine;
TRUNCATE TABLE Bill;
TRUNCATE TABLE Appointment;
TRUNCATE TABLE Pet;
TRUNCATE TABLE Clinic_Manager;
TRUNCATE TABLE Veterinarian;
TRUNCATE TABLE Pet_Owner;
TRUNCATE TABLE User;
TRUNCATE TABLE Branch;

SET FOREIGN_KEY_CHECKS = 1;

-- -------------------------
-- Branches (3)
-- -------------------------
INSERT INTO Branch (branch_id, name, address, phone_number) VALUES
(1, 'Downtown Vet Clinic',   '123 Main St, Cityville',     '555-0101'),
(2, 'Westside Animal Care',  '456 West Ave, Cityville',    '555-0102'),
(3, 'Northpark Pet Hospital','789 North Blvd, Cityville',  '555-0103');

-- -------------------------
-- Users (12 total)
-- password_hash = werkzeug pbkdf2:sha256 hash of "password123"
-- -------------------------
INSERT INTO User (user_id, full_name, email, phone, password_hash) VALUES
-- Vets
(1,  'Dr. Alice Johnson',   'alice@vetclinic.com',    '555-1001', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(2,  'Dr. Bob Martinez',    'bob@vetclinic.com',      '555-1002', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(3,  'Dr. Carol Lee',       'carol@vetclinic.com',    '555-1003', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(4,  'Dr. David Kim',       'david@vetclinic.com',    '555-1004', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(5,  'Dr. Eva Patel',       'eva@vetclinic.com',      '555-1005', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
-- Managers
(6,  'Manager Frank Brown', 'frank@vetclinic.com',    '555-1006', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(7,  'Manager Grace Wilson','grace@vetclinic.com',    '555-1007', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
-- Pet Owners
(8,  'Henry Clark',         'henry@example.com',      '555-2001', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(9,  'Irene Davis',         'irene@example.com',      '555-2002', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(10, 'Jack Evans',          'jack@example.com',       '555-2003', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(11, 'Karen Foster',        'karen@example.com',      '555-2004', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(12, 'Leo Garcia',          'leo@example.com',        '555-2005', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8');

-- -------------------------
-- Veterinarians (5)
-- -------------------------
INSERT INTO Veterinarian (user_id, specialization, license_number, branch_id) VALUES
(1, 'General Practice',  'LIC-001', 1),
(2, 'Surgery',           'LIC-002', 1),
(3, 'Dermatology',       'LIC-003', 2),
(4, 'Orthopedics',       'LIC-004', 2),
(5, 'Oncology',          'LIC-005', 3);

-- -------------------------
-- Clinic Managers (2)
-- -------------------------
INSERT INTO Clinic_Manager (user_id, experience, branch_id) VALUES
(6, 8, 1),
(7, 5, 2);

-- -------------------------
-- Pet Owners (5)
-- -------------------------
INSERT INTO Pet_Owner (user_id, address) VALUES
(8,  '10 Oak St, Cityville'),
(9,  '22 Pine Ave, Cityville'),
(10, '34 Maple Rd, Cityville'),
(11, '56 Birch Ln, Cityville'),
(12, '78 Cedar Dr, Cityville');

-- -------------------------
-- Pets (8)
-- -------------------------
INSERT INTO Pet (pet_id, name, breed, birth_date, allergies, owner_id) VALUES
(1, 'Buddy',   'Golden Retriever', '2019-03-15', 'Penicillin',    8),
(2, 'Whiskers','Siamese Cat',      '2020-07-22', NULL,            8),
(3, 'Max',     'German Shepherd',  '2018-11-05', 'Aspirin',       9),
(4, 'Bella',   'Labrador',         '2021-01-30', NULL,            9),
(5, 'Charlie', 'Bulldog',          '2020-05-18', 'Sulfonamides',  10),
(6, 'Luna',    'Persian Cat',      '2022-08-12', NULL,            11),
(7, 'Rocky',   'Beagle',           '2019-09-25', NULL,            11),
(8, 'Daisy',   'Poodle',           '2021-04-10', 'NSAIDs',        12);

-- -------------------------
-- Medicines (5)
-- -------------------------
INSERT INTO Medicine (barcode_no, med_name, med_type, unit_cost, description) VALUES
('MED-001', 'Amoxicillin',     'Antibiotic',    15.00, 'Broad-spectrum antibiotic for bacterial infections'),
('MED-002', 'Metacam',         'Anti-inflammatory', 22.50, 'NSAID for pain and inflammation'),
('MED-003', 'Heartgard',       'Antiparasitic', 35.00, 'Monthly heartworm preventive'),
('MED-004', 'Prednisone',      'Corticosteroid',12.00, 'Immunosuppressant for allergies and inflammation'),
('VAC-001', 'Rabies Vaccine',  'Vaccine',       25.00, 'Annual rabies vaccination'),
('VAC-002', 'DHPP Vaccine',    'Vaccine',       30.00, 'Distemper, Hepatitis, Parainfluenza, Parvovirus'),
('VAC-003', 'Bordetella',      'Vaccine',       20.00, 'Kennel cough prevention');

-- -------------------------
-- Vaccines (3)
-- -------------------------
INSERT INTO Vaccine (barcode_no, vac_type, side_effect) VALUES
('VAC-001', 'Core',     'Mild soreness at injection site, lethargy for 1-2 days'),
('VAC-002', 'Core',     'Mild fever, reduced appetite for 24 hours'),
('VAC-003', 'Non-core', 'Sneezing, mild nasal discharge for a few days');

-- -------------------------
-- BranchStock
-- -------------------------
INSERT INTO BranchStock (branch_id, barcode_no, stock_count, min_threshold, batch_number, expiration_date) VALUES
(1, 'MED-001', 50, 10, 'BATCH-A1', '2026-12-31'),
(1, 'MED-002', 30, 10, 'BATCH-A2', '2026-06-30'),
(1, 'MED-003',  8, 15, 'BATCH-A3', '2026-09-30'),
(1, 'VAC-001', 20, 10, 'BATCH-A4', '2026-03-31'),
(1, 'VAC-002', 25, 10, 'BATCH-A5', '2026-03-31'),
(2, 'MED-001', 40, 10, 'BATCH-B1', '2026-12-31'),
(2, 'MED-004', 15, 10, 'BATCH-B2', '2026-08-31'),
(2, 'VAC-003',  5, 10, 'BATCH-B3', '2026-03-31'),
(3, 'MED-002', 20, 10, 'BATCH-C1', '2026-06-30'),
(3, 'VAC-001', 18, 10, 'BATCH-C2', '2026-03-31');

-- -------------------------
-- Appointments (10)
-- -------------------------
INSERT INTO Appointment (appointment_id, date_time, status, pet_id, vet_id) VALUES
(1,  '2026-04-01 09:00:00', 'Completed',  1, 1),
(2,  '2026-04-02 10:00:00', 'Completed',  3, 2),
(3,  '2026-04-03 11:00:00', 'Cancelled',  2, 1),
(4,  '2026-04-10 09:30:00', 'Completed',  5, 3),
(5,  '2026-04-15 14:00:00', 'Scheduled',  4, 1),
(6,  '2026-04-20 10:00:00', 'Scheduled',  7, 2),
(7,  '2026-04-22 11:00:00', 'Scheduled',  6, 5),
(8,  '2026-04-25 15:00:00', 'Scheduled',  8, 4),
(9,  '2026-03-20 09:00:00', 'Completed',  1, 1),
(10, '2026-03-25 10:00:00', 'Cancelled',  3, 3);

-- -------------------------
-- Bills (3 – for completed appointments)
-- -------------------------
INSERT INTO Bill (bill_id, generated_date, payment_status, total_amount, appointment_id) VALUES
(1, '2026-04-01', 'Paid',   145.00, 1),
(2, '2026-04-02', 'Unpaid', 137.50, 2),
(3, '2026-04-10', 'Unpaid', 112.00, 4),
(4, '2026-03-20', 'Paid',   100.00, 9);

-- -------------------------
-- Prescriptions (5)
-- -------------------------
INSERT INTO Prescription (prescription_id, pet_id, date_time, expiration_date, vet_id) VALUES
(1, 1, '2026-04-01 09:30:00', '2026-04-15', 1),
(2, 3, '2026-04-02 10:30:00', '2026-04-16', 2),
(3, 5, '2026-04-10 10:00:00', '2026-04-24', 3),
(4, 1, '2026-03-20 09:30:00', '2026-04-03', 1),
(5, 7, '2026-04-20 11:00:00', '2026-05-04', 2);

-- -------------------------
-- PresMed entries
-- -------------------------
INSERT INTO PresMed (prescription_id, medicine_id, dosage, frequency) VALUES
(1, 'MED-001', 2, 3),
(1, 'MED-002', 1, 2),
(2, 'MED-001', 3, 2),
(2, 'MED-004', 1, 1),
(3, 'MED-002', 2, 2),
(4, 'MED-001', 2, 2),
(5, 'MED-003', 1, 1);

-- -------------------------
-- Vaccinations (10, some overdue)
-- -------------------------
INSERT INTO Vaccination (vac_id, vac_date, next_due_date, pet_id, vet_id, barcode_no) VALUES
(1,  '2025-03-01', '2026-03-01', 1, 1, 'VAC-001'),   -- overdue
(2,  '2025-04-15', '2026-04-15', 1, 1, 'VAC-002'),   -- overdue
(3,  '2025-06-10', '2026-06-10', 3, 2, 'VAC-001'),   -- upcoming
(4,  '2025-09-20', '2026-09-20', 5, 3, 'VAC-003'),   -- upcoming
(5,  '2026-03-01', '2027-03-01', 2, 1, 'VAC-002'),   -- up to date
(6,  '2025-02-14', '2026-02-14', 7, 2, 'VAC-001'),   -- overdue
(7,  '2026-02-01', '2026-05-15', 4, 1, 'VAC-003'),   -- due soon
(8,  '2025-12-01', '2026-12-01', 6, 5, 'VAC-002'),   -- upcoming
(9,  '2025-11-10', '2026-11-10', 8, 4, 'VAC-001'),   -- upcoming
(10, '2026-01-20', '2027-01-20', 7, 2, 'VAC-002');   -- up to date

-- -------------------------
-- Referrals (2)
-- -------------------------
INSERT INTO Referral (referral_id, reason, referral_date, status, sender_vet_id, receiver_vet_id, pet_id) VALUES
(1, 'Suspected bone fracture requiring orthopedic evaluation', '2026-04-05', 'Accepted',  1, 4, 1),
(2, 'Suspicious skin lesion needs oncology consult',           '2026-04-12', 'Pending',   3, 5, 5);

-- -------------------------
-- Evaluations (4)
-- -------------------------
INSERT INTO Evaluation (eval_id, points, date, comment, owner_id, vet_id, man_id) VALUES
(1, 5, '2026-04-02', 'Dr. Johnson was wonderful with Buddy!',              8,  1, NULL),
(2, 4, '2026-04-03', 'Dr. Martinez was thorough and professional.',        9,  2, 6),
(3, 3, '2026-04-11', 'Good visit, waiting room was a bit long.',           10, 3, NULL),
(4, 5, '2026-03-21', 'Outstanding care, highly recommend!',               8,  1, NULL);

-- -------------------------
-- Medical History (for seeded appointments)
-- -------------------------
INSERT INTO Medical_History (pet_id, date_time, diagnosis, symptoms, treatments, notes) VALUES
(1, '2026-04-01 09:15:00', 'Bacterial skin infection',     'Redness, itching, hair loss',    'Amoxicillin 500mg BID x 14 days, topical antiseptic', 'Follow-up in 2 weeks'),
(3, '2026-04-02 10:15:00', 'Post-operative care visit',   'Surgical site healing normally', 'Wound cleaning, pain management with Metacam',         'Stitches to be removed in 7 days'),
(5, '2026-04-10 09:45:00', 'Seasonal allergies',          'Sneezing, watery eyes',          'Prednisone 5mg SID x 7 days',                          'Avoid outdoor activity during high pollen season'),
(1, '2026-03-20 09:15:00', 'Annual wellness check',       'No significant symptoms',        'General physical examination',                          'All vitals normal');

-- -------------------------
-- BoardingUnits
-- -------------------------
INSERT INTO BoardingUnit (boarding_unit_id, size, is_occupied, branch_id, pet_id) VALUES
(1, 'Small',  TRUE,  1, 2),
(2, 'Medium', TRUE,  1, 1),
(3, 'Large',  FALSE, 1, NULL),
(4, 'Small',  FALSE, 2, NULL),
(5, 'Medium', TRUE,  2, 5),
(6, 'Large',  FALSE, 3, NULL);

-- -------------------------
-- WasteLog (2 entries)
-- -------------------------
INSERT INTO WasteLog (log_id, quantity, waste_date, reason, manager_id, barcode_no) VALUES
(1, 5, '2026-04-05', 'Expired batch disposed',          6, 'MED-001'),
(2, 3, '2026-04-10', 'Contaminated vials discarded',    7, 'VAC-003');

