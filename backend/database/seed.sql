-- Seed data for Veterinary Clinic Chain Management System
-- Expanded: 30 vets in branch 1, Henry has 10 pets, 30+ overdue vaccinations, 35+ evaluations
-- All passwords are "password123"

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE WasteLog;
TRUNCATE TABLE BoardingHistory;
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
(1, 'Downtown Vet Clinic',    '123 Main St, Cityville',    '555-0101'),
(2, 'Westside Animal Care',   '456 West Ave, Cityville',   '555-0102'),
(3, 'Northpark Pet Hospital', '789 North Blvd, Cityville', '555-0103');

-- -------------------------
-- Users
-- 1-5: original vets  6-7: managers  8-12: original owners
-- 13-40: new vets branch 1 (total 30)  41-45: new vets branch 2  46-47: new vets branch 3
-- 48: manager branch 3  49-61: new owners
-- -------------------------
INSERT INTO User (user_id, full_name, email, phone, password_hash) VALUES
(1,  'Dr. Alice Johnson',      'alice@vetclinic.com',      '555-1001', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(2,  'Dr. Bob Martinez',       'bob@vetclinic.com',        '555-1002', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(3,  'Dr. Carol Lee',          'carol@vetclinic.com',      '555-1003', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(4,  'Dr. David Kim',          'david@vetclinic.com',      '555-1004', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(5,  'Dr. Eva Patel',          'eva@vetclinic.com',        '555-1005', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(6,  'Manager Frank Brown',    'frank@vetclinic.com',      '555-1006', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(7,  'Manager Grace Wilson',   'grace@vetclinic.com',      '555-1007', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(8,  'Henry Clark',            'henry@example.com',        '555-2001', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(9,  'Irene Davis',            'irene@example.com',        '555-2002', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(10, 'Jack Evans',             'jack@example.com',         '555-2003', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(11, 'Karen Foster',           'karen@example.com',        '555-2004', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(12, 'Leo Garcia',             'leo@example.com',          '555-2005', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(13, 'Dr. Oliver Hayes',       'oliver@vetclinic.com',     '555-1013', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(14, 'Dr. Patricia Stone',     'patricia@vetclinic.com',   '555-1014', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(15, 'Dr. Quinn Adams',        'quinn@vetclinic.com',      '555-1015', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(16, 'Dr. Rachel Barnes',      'rachel@vetclinic.com',     '555-1016', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(17, 'Dr. Samuel Carter',      'samuel@vetclinic.com',     '555-1017', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(18, 'Dr. Tina Dixon',         'tina@vetclinic.com',       '555-1018', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(19, 'Dr. Uma Ellis',          'uma@vetclinic.com',        '555-1019', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(20, 'Dr. Victor Ford',        'victor@vetclinic.com',     '555-1020', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(21, 'Dr. Wendy Grant',        'wendy@vetclinic.com',      '555-1021', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(22, 'Dr. Xavier Hughes',      'xavier@vetclinic.com',     '555-1022', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(23, 'Dr. Yvonne Irving',      'yvonne@vetclinic.com',     '555-1023', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(24, 'Dr. Zachary Jones',      'zachary@vetclinic.com',    '555-1024', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(25, 'Dr. Aaron King',         'aaron@vetclinic.com',      '555-1025', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(26, 'Dr. Brittany Long',      'brittany@vetclinic.com',   '555-1026', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(27, 'Dr. Connor Moore',       'connor@vetclinic.com',     '555-1027', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(28, 'Dr. Diana Nash',         'diana@vetclinic.com',      '555-1028', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(29, 'Dr. Ethan Owen',         'ethan@vetclinic.com',      '555-1029', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(30, 'Dr. Fiona Page',         'fiona@vetclinic.com',      '555-1030', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(31, 'Dr. George Quinn',       'georgeq@vetclinic.com',    '555-1031', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(32, 'Dr. Hannah Reed',        'hannahv@vetclinic.com',    '555-1032', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(33, 'Dr. Ivan Shaw',          'ivan@vetclinic.com',       '555-1033', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(34, 'Dr. Julia Turner',       'juliav@vetclinic.com',     '555-1034', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(35, 'Dr. Kevin Underwood',    'kevinv@vetclinic.com',     '555-1035', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(36, 'Dr. Laura Vance',        'laura@vetclinic.com',      '555-1036', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(37, 'Dr. Mark Webb',          'mark@vetclinic.com',       '555-1037', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(38, 'Dr. Nina Xavier',        'nina@vetclinic.com',       '555-1038', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(39, 'Dr. Oscar Young',        'oscar@vetclinic.com',      '555-1039', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(40, 'Dr. Penelope Zimmer',    'penelope@vetclinic.com',   '555-1040', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(41, 'Dr. Ryan Anderson',      'ryan@vetclinic.com',       '555-1041', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(42, 'Dr. Sophie Bennett',     'sophie@vetclinic.com',     '555-1042', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(43, 'Dr. Thomas Coleman',     'thomas@vetclinic.com',     '555-1043', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(44, 'Dr. Ursula Dean',        'ursula@vetclinic.com',     '555-1044', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(45, 'Dr. Vincent Edwards',    'vincent@vetclinic.com',    '555-1045', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(46, 'Dr. Wanda Fisher',       'wanda@vetclinic.com',      '555-1046', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(47, 'Dr. Andrew Green',       'andrew@vetclinic.com',     '555-1047', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(48, 'Manager Helen Hart',     'helen@vetclinic.com',      '555-1048', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(49, 'Peter Morgan',           'peter@example.com',        '555-2006', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(50, 'Olivia Nelson',          'olivia@example.com',       '555-2007', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(51, 'Nathan OBrien',          'nathan@example.com',       '555-2008', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(52, 'Mia Parker',             'mia@example.com',          '555-2009', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(53, 'Lucas Quinn',            'lucas@example.com',        '555-2010', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(54, 'Lily Roberts',           'lilyowner@example.com',    '555-2011', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(55, 'Kyle Sullivan',          'kyle@example.com',         '555-2012', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(56, 'Julia Thomas',           'juliaowner@example.com',   '555-2013', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(57, 'Ian Underwood',          'ian@example.com',          '555-2014', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(58, 'Hannah Vance',           'hannahowner@example.com',  '555-2015', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(59, 'Greg Williams',          'greg@example.com',         '555-2016', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(60, 'Emma Xavier',            'emma@example.com',         '555-2017', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8'),
(61, 'Dylan Young',            'dylan@example.com',        '555-2018', 'scrypt:32768:8:1$EcLroY7QTNDBb7R9$c546a06fb5cb872cdf30173657b17941ffb9e88939d1fe45da710bfc5632996a34494339eb94756caa3dd3f4a3c8b2cd30dd202f87d1ec873aa99c0f64ff94f8');

-- -------------------------
-- Veterinarians
-- Branch 1: 1,2,13-40 (30 total)  Branch 2: 3,4,41-45 (7 total)  Branch 3: 5,46,47 (3 total)
-- -------------------------
INSERT INTO Veterinarian (user_id, specialization, license_number, branch_id) VALUES
(1,  'General Practice',   'LIC-001', 1),
(2,  'Surgery',            'LIC-002', 1),
(3,  'Dermatology',        'LIC-003', 2),
(4,  'Orthopedics',        'LIC-004', 2),
(5,  'Oncology',           'LIC-005', 3),
(13, 'Internal Medicine',  'LIC-013', 1),
(14, 'Cardiology',         'LIC-014', 1),
(15, 'Neurology',          'LIC-015', 1),
(16, 'Ophthalmology',      'LIC-016', 1),
(17, 'Dentistry',          'LIC-017', 1),
(18, 'Radiology',          'LIC-018', 1),
(19, 'Anesthesiology',     'LIC-019', 1),
(20, 'Emergency Care',     'LIC-020', 1),
(21, 'Exotic Animals',     'LIC-021', 1),
(22, 'Avian Medicine',     'LIC-022', 1),
(23, 'Feline Medicine',    'LIC-023', 1),
(24, 'Canine Medicine',    'LIC-024', 1),
(25, 'Rehabilitation',     'LIC-025', 1),
(26, 'Pathology',          'LIC-026', 1),
(27, 'General Practice',   'LIC-027', 1),
(28, 'Surgery',            'LIC-028', 1),
(29, 'Internal Medicine',  'LIC-029', 1),
(30, 'Dermatology',        'LIC-030', 1),
(31, 'Orthopedics',        'LIC-031', 1),
(32, 'Oncology',           'LIC-032', 1),
(33, 'Cardiology',         'LIC-033', 1),
(34, 'Neurology',          'LIC-034', 1),
(35, 'Dentistry',          'LIC-035', 1),
(36, 'Emergency Care',     'LIC-036', 1),
(37, 'Exotic Animals',     'LIC-037', 1),
(38, 'Feline Medicine',    'LIC-038', 1),
(39, 'Canine Medicine',    'LIC-039', 1),
(40, 'Rehabilitation',     'LIC-040', 1),
(41, 'General Practice',   'LIC-041', 2),
(42, 'Surgery',            'LIC-042', 2),
(43, 'Internal Medicine',  'LIC-043', 2),
(44, 'Cardiology',         'LIC-044', 2),
(45, 'Oncology',           'LIC-045', 2),
(46, 'General Practice',   'LIC-046', 3),
(47, 'Surgery',            'LIC-047', 3);

-- -------------------------
-- Clinic Managers
-- -------------------------
INSERT INTO Clinic_Manager (user_id, experience, branch_id) VALUES
(6,  8, 1),
(7,  5, 2),
(48, 3, 3);

-- -------------------------
-- Pet Owners
-- -------------------------
INSERT INTO Pet_Owner (user_id, address) VALUES
(8,  '10 Oak St, Cityville'),
(9,  '22 Pine Ave, Cityville'),
(10, '34 Maple Rd, Cityville'),
(11, '56 Birch Ln, Cityville'),
(12, '78 Cedar Dr, Cityville'),
(49, '90 Elm St, Cityville'),
(50, '12 Walnut Ave, Cityville'),
(51, '34 Chestnut Rd, Cityville'),
(52, '56 Willow Ln, Cityville'),
(53, '78 Poplar Dr, Cityville'),
(54, '100 Spruce St, Cityville'),
(55, '120 Ash Ave, Cityville'),
(56, '140 Hickory Rd, Cityville'),
(57, '160 Sycamore Ln, Cityville'),
(58, '180 Magnolia Dr, Cityville'),
(59, '200 Dogwood St, Cityville'),
(60, '220 Redwood Ave, Cityville'),
(61, '240 Cypress Rd, Cityville');

-- -------------------------
-- Pets (48 total)
-- Henry (8): 1,2,9-16 (10 pets)  Irene (9): 3,4,17  Jack (10): 5,18,19
-- Karen (11): 6,7,20  Leo (12): 8,21,22  New owners (49-61): 2 each = 23-48
-- -------------------------
INSERT INTO Pet (pet_id, name, species, breed, gender, birth_date, allergies, owner_id) VALUES
-- Henry's pets (10 total)
(1,  'Buddy',   'Dog', 'Golden Retriever',  'M', '2019-03-15', 'Penicillin',   8),
(2,  'Whiskers','Cat', 'Siamese',           'F', '2020-07-22', NULL,           8),
(9,  'Rex',     'Dog', 'German Shepherd',   'M', '2021-05-10', NULL,           8),
(10, 'Nala',    'Cat', 'Maine Coon',        'F', '2022-02-18', NULL,           8),
(11, 'Coco',    'Dog', 'French Bulldog',    'F', '2020-11-30', 'Sulfonamides', 8),
(12, 'Thor',    'Dog', 'Husky',             'M', '2019-08-14', NULL,           8),
(13, 'Mochi',   'Rabbit','Mini Lop',        'M', '2023-01-07', NULL,           8),
(14, 'Pearl',   'Bird', 'Cockatiel',        'F', '2022-06-20', NULL,           8),
(15, 'Shadow',  'Dog', 'Black Labrador',    'M', '2020-03-25', NULL,           8),
(16, 'Lily',    'Dog', 'Shih Tzu',          'F', '2021-09-12', 'NSAIDs',       8),
-- Irene's pets
(3,  'Max',     'Dog', 'German Shepherd',   'M', '2018-11-05', 'Aspirin',      9),
(4,  'Bella',   'Dog', 'Labrador',          'F', '2021-01-30', NULL,           9),
(17, 'Tiger',   'Cat', 'Bengal',            'M', '2020-04-15', NULL,           9),
-- Jack's pets
(5,  'Charlie', 'Dog', 'Bulldog',           'M', '2020-05-18', 'Sulfonamides', 10),
(18, 'Scout',   'Dog', 'Border Collie',     'M', '2021-07-22', NULL,           10),
(19, 'Cleo',    'Cat', 'Abyssinian',        'F', '2022-03-10', NULL,           10),
-- Karen's pets
(6,  'Luna',    'Cat', 'Persian',           'F', '2022-08-12', NULL,           11),
(7,  'Rocky',   'Dog', 'Beagle',            'M', '2019-09-25', NULL,           11),
(20, 'Bruno',   'Dog', 'Rottweiler',        'M', '2020-12-05', NULL,           11),
-- Leo's pets
(8,  'Daisy',   'Dog', 'Poodle',            'F', '2021-04-10', 'NSAIDs',       12),
(21, 'Molly',   'Dog', 'Cavalier Spaniel',  'F', '2022-01-18', NULL,           12),
(22, 'Simba',   'Cat', 'Tabby',             'M', '2020-10-30', NULL,           12),
-- New owners' pets (2 each)
(23, 'Duke',    'Dog', 'Doberman',          'M', '2020-06-14', NULL,           49),
(24, 'Ellie',   'Dog', 'Golden Retriever',  'F', '2021-11-02', NULL,           49),
(25, 'Finn',    'Dog', 'Australian Shepherd','M','2019-04-20', NULL,           50),
(26, 'Ginger',  'Cat', 'Domestic Shorthair','F', '2021-08-08', NULL,           50),
(27, 'Hank',    'Dog', 'Boxer',             'M', '2020-02-14', NULL,           51),
(28, 'Ivy',     'Cat', 'Ragdoll',           'F', '2022-05-25', NULL,           51),
(29, 'Jake',    'Dog', 'Dachshund',         'M', '2019-07-30', 'Aspirin',      52),
(30, 'Kiki',    'Dog', 'Lhasa Apso',        'F', '2021-03-15', NULL,           52),
(31, 'Leo',     'Dog', 'Labrador',          'M', '2020-09-05', NULL,           53),
(32, 'Mia',     'Cat', 'Siamese',           'F', '2022-11-20', NULL,           53),
(33, 'Noah',    'Dog', 'Great Dane',        'M', '2019-12-10', NULL,           54),
(34, 'Olive',   'Cat', 'Burmese',           'F', '2021-06-28', NULL,           54),
(35, 'Penny',   'Dog', 'Pomeranian',        'F', '2022-04-03', NULL,           55),
(36, 'Quinn',   'Cat', 'Scottish Fold',     'M', '2020-08-19', NULL,           55),
(37, 'Rex',     'Dog', 'Akita',             'M', '2019-10-07', NULL,           56),
(38, 'Sasha',   'Cat', 'Norwegian Forest',  'F', '2021-02-14', NULL,           56),
(39, 'Toby',    'Dog', 'Cocker Spaniel',    'M', '2020-07-11', 'Penicillin',   57),
(40, 'Uma',     'Cat', 'Birman',            'F', '2022-09-30', NULL,           57),
(41, 'Vince',   'Dog', 'Maltese',           'M', '2021-05-05', NULL,           58),
(42, 'Wendy',   'Cat', 'Himalayan',         'F', '2020-03-22', NULL,           58),
(43, 'Xander',  'Dog', 'Jack Russell',      'M', '2019-11-15', NULL,           59),
(44, 'Yara',    'Cat', 'British Shorthair', 'F', '2021-07-07', NULL,           59),
(45, 'Zeus',    'Dog', 'Bullmastiff',       'M', '2020-01-28', NULL,           60),
(46, 'Arya',    'Cat', 'Bengal',            'F', '2022-10-14', NULL,           60),
(47, 'Benny',   'Dog', 'Corgi',             'M', '2021-08-23', NULL,           61),
(48, 'Cara',    'Cat', 'Turkish Angora',    'F', '2020-05-16', NULL,           61);

-- -------------------------
-- Medicines (23 total: 15 non-vaccine + 8 vaccines)
-- -------------------------
INSERT INTO Medicine (barcode_no, med_name, med_type, unit_cost, description) VALUES
('MED-001', 'Amoxicillin',       'Antibiotic',       15.00, 'Broad-spectrum antibiotic for bacterial infections'),
('MED-002', 'Metacam',           'Anti-inflammatory',22.50, 'NSAID for pain and inflammation'),
('MED-003', 'Heartgard',         'Antiparasitic',    35.00, 'Monthly heartworm preventive'),
('MED-004', 'Prednisone',        'Corticosteroid',   12.00, 'Immunosuppressant for allergies and inflammation'),
('MED-005', 'Doxycycline',       'Antibiotic',       18.00, 'Broad-spectrum antibiotic for tick-borne diseases'),
('MED-006', 'Metronidazole',     'Antibiotic',       14.50, 'Antibiotic for gastrointestinal infections'),
('MED-007', 'Furosemide',        'Diuretic',         10.00, 'Diuretic for congestive heart failure and edema'),
('MED-008', 'Enalapril',         'Cardiac',          25.00, 'ACE inhibitor for heart disease management'),
('MED-009', 'Phenobarbital',     'Anticonvulsant',   30.00, 'Anticonvulsant for seizure control'),
('MED-010', 'Tramadol',          'Analgesic',        20.00, 'Opioid analgesic for post-surgical pain'),
('MED-011', 'Clindamycin',       'Antibiotic',       16.00, 'Antibiotic for dental and skin infections'),
('MED-012', 'Omeprazole',        'Gastroprotective', 12.00, 'Proton pump inhibitor for gastric ulcers'),
('MED-013', 'Cyclosporine',      'Immunosuppressant',45.00, 'Immunosuppressant for immune-mediated diseases'),
('MED-014', 'Ivermectin',        'Antiparasitic',    22.00, 'Broad-spectrum antiparasitic for mange and parasites'),
('MED-015', 'Fluconazole',       'Antifungal',       28.00, 'Antifungal for systemic fungal infections'),
('VAC-001', 'Rabies Vaccine',    'Vaccine',          25.00, 'Annual rabies vaccination'),
('VAC-002', 'DHPP Vaccine',      'Vaccine',          30.00, 'Distemper, Hepatitis, Parainfluenza, Parvovirus'),
('VAC-003', 'Bordetella',        'Vaccine',          20.00, 'Kennel cough prevention'),
('VAC-004', 'Feline Leukemia',   'Vaccine',          35.00, 'Feline leukemia virus prevention'),
('VAC-005', 'Leptospirosis',     'Vaccine',          28.00, 'Bacterial disease prevention in dogs'),
('VAC-006', 'Lyme Disease',      'Vaccine',          32.00, 'Lyme disease prevention for outdoor dogs'),
('VAC-007', 'Canine Influenza',  'Vaccine',          24.00, 'Canine influenza H3N2 and H3N8 prevention'),
('VAC-008', 'FVRCP Vaccine',     'Vaccine',          30.00, 'Feline viral rhinotracheitis, calicivirus, panleukopenia');

-- -------------------------
-- Vaccines
-- -------------------------
INSERT INTO Vaccine (barcode_no, vac_type, side_effect) VALUES
('VAC-001', 'Core',     'Mild soreness at injection site, lethargy for 1-2 days'),
('VAC-002', 'Core',     'Mild fever, reduced appetite for 24 hours'),
('VAC-003', 'Non-core', 'Sneezing, mild nasal discharge for a few days'),
('VAC-004', 'Non-core', 'Mild lethargy and soreness at injection site'),
('VAC-005', 'Non-core', 'Mild swelling at injection site, reduced appetite'),
('VAC-006', 'Non-core', 'Mild fever and lethargy for 24-48 hours'),
('VAC-007', 'Non-core', 'Mild cough, nasal discharge for 2-3 days'),
('VAC-008', 'Core',     'Mild fever, sneezing, reduced appetite for 24 hours');

-- -------------------------
-- BranchStock (40 entries)
-- -------------------------
INSERT INTO BranchStock (branch_id, barcode_no, stock_count, min_threshold, batch_number, expiration_date) VALUES
(1, 'MED-001', 80,  10, 'B1-A01', '2026-12-31'),
(1, 'MED-002', 55,  10, 'B1-A02', '2026-06-30'),
(1, 'MED-003', 12,  15, 'B1-A03', '2026-09-30'),
(1, 'MED-004', 40,  10, 'B1-A04', '2026-08-31'),
(1, 'MED-005', 35,  10, 'B1-A05', '2026-11-30'),
(1, 'MED-006', 28,  10, 'B1-A06', '2026-10-31'),
(1, 'MED-007', 20,  10, 'B1-A07', '2027-01-31'),
(1, 'MED-008', 15,  10, 'B1-A08', '2026-09-30'),
(1, 'MED-009', 18,  10, 'B1-A09', '2026-12-31'),
(1, 'MED-010', 25,  10, 'B1-A10', '2026-07-31'),
(1, 'MED-011', 30,  10, 'B1-A11', '2026-11-30'),
(1, 'MED-012', 22,  10, 'B1-A12', '2027-02-28'),
(1, 'MED-013',  8,  10, 'B1-A13', '2026-08-31'),
(1, 'MED-014', 45,  10, 'B1-A14', '2026-12-31'),
(1, 'MED-015', 16,  10, 'B1-A15', '2026-10-31'),
(1, 'VAC-001', 40,  10, 'B1-V01', '2026-06-30'),
(1, 'VAC-002', 35,  10, 'B1-V02', '2026-06-30'),
(1, 'VAC-003', 20,  10, 'B1-V03', '2026-06-30'),
(1, 'VAC-005', 25,  10, 'B1-V05', '2026-09-30'),
(1, 'VAC-007', 18,  10, 'B1-V07', '2026-09-30'),
(2, 'MED-001', 50,  10, 'B2-A01', '2026-12-31'),
(2, 'MED-002', 30,  10, 'B2-A02', '2026-06-30'),
(2, 'MED-004', 20,  10, 'B2-A04', '2026-08-31'),
(2, 'MED-005', 25,  10, 'B2-A05', '2026-11-30'),
(2, 'MED-006', 15,   8, 'B2-A06', '2026-10-31'),
(2, 'MED-011', 18,  10, 'B2-A11', '2026-11-30'),
(2, 'MED-013',  5,  10, 'B2-A13', '2026-08-31'),
(2, 'VAC-001', 30,  10, 'B2-V01', '2026-06-30'),
(2, 'VAC-002', 25,  10, 'B2-V02', '2026-06-30'),
(2, 'VAC-003', 10,  10, 'B2-V03', '2026-06-30'),
(2, 'VAC-004', 20,  10, 'B2-V04', '2026-09-30'),
(2, 'VAC-008', 22,  10, 'B2-V08', '2026-09-30'),
(3, 'MED-001', 35,  10, 'B3-A01', '2026-12-31'),
(3, 'MED-002', 25,  10, 'B3-A02', '2026-06-30'),
(3, 'MED-003', 10,  10, 'B3-A03', '2026-09-30'),
(3, 'MED-010', 15,  10, 'B3-A10', '2026-07-31'),
(3, 'MED-015', 12,  10, 'B3-A15', '2026-10-31'),
(3, 'VAC-001', 25,  10, 'B3-V01', '2026-06-30'),
(3, 'VAC-006', 18,  10, 'B3-V06', '2026-09-30'),
(3, 'VAC-008', 15,  10, 'B3-V08', '2026-09-30');

-- -------------------------
-- Appointments (45 total)
-- -------------------------
INSERT INTO Appointment (appointment_id, date_time, status, type, pet_id, vet_id) VALUES
-- Original appointments
(1,  '2026-04-01 09:00:00', 'Completed', 'checkup',    1, 1),
(2,  '2026-04-02 10:00:00', 'Completed', 'surgery',    3, 2),
(3,  '2026-04-03 11:00:00', 'Cancelled', 'checkup',    2, 1),
(4,  '2026-04-10 09:30:00', 'Completed', 'checkup',    5, 3),
(5,  '2026-04-15 14:00:00', 'Scheduled', 'checkup',    4, 1),
(6,  '2026-04-20 10:00:00', 'Scheduled', 'checkup',    7, 2),
(7,  '2026-04-22 11:00:00', 'Scheduled', 'checkup',    6, 5),
(8,  '2026-04-25 15:00:00', 'Scheduled', 'orthopedics',8, 4),
(9,  '2026-03-20 09:00:00', 'Completed', 'checkup',    1, 1),
(10, '2026-03-25 10:00:00', 'Cancelled', 'checkup',    3, 3),
(11, '2026-05-07 09:00:00', 'Completed', 'checkup',    1, 1),
(12, '2026-05-07 10:30:00', 'Completed', 'checkup',    2, 2),
(13, '2026-05-07 13:00:00', 'Scheduled', 'checkup',    3, 3),
(14, '2026-05-07 15:00:00', 'Scheduled', 'checkup',    4, 1),
(15, '2026-05-07 16:30:00', 'Scheduled', 'checkup',    5, 2),
-- New completed appointments
(16, '2026-04-05 09:00:00', 'Completed', 'checkup',    9,  1),
(17, '2026-04-06 10:00:00', 'Completed', 'checkup',    10, 2),
(18, '2026-04-07 11:00:00', 'Completed', 'surgery',    11, 13),
(19, '2026-04-08 09:30:00', 'Completed', 'checkup',    12, 14),
(20, '2026-04-09 14:00:00', 'Completed', 'checkup',    17, 3),
(21, '2026-04-11 09:00:00', 'Completed', 'dermatology',18, 4),
(22, '2026-04-12 10:00:00', 'Completed', 'orthopedics',23, 15),
(23, '2026-04-13 11:00:00', 'Completed', 'checkup',    24, 16),
(24, '2026-04-14 09:00:00', 'Completed', 'checkup',    25, 3),
(25, '2026-04-15 10:00:00', 'Completed', 'checkup',    29, 17),
(26, '2026-04-16 11:00:00', 'Completed', 'surgery',    33, 2),
(27, '2026-04-17 09:30:00', 'Completed', 'orthopedics',37, 4),
(28, '2026-04-18 14:00:00', 'Completed', 'oncology',   41, 5),
(29, '2026-04-19 10:00:00', 'Completed', 'checkup',    45, 1),
(30, '2026-04-21 09:00:00', 'Completed', 'checkup',    47, 18),
-- New scheduled appointments
(31, '2026-05-09 09:00:00', 'Scheduled', 'checkup',    13, 21),
(32, '2026-05-10 10:00:00', 'Scheduled', 'checkup',    15, 2),
(33, '2026-05-11 11:00:00', 'Scheduled', 'checkup',    16, 19),
(34, '2026-05-12 09:30:00', 'Scheduled', 'checkup',    20, 3),
(35, '2026-05-13 14:00:00', 'Scheduled', 'checkup',    22, 4),
(36, '2026-05-14 10:00:00', 'Scheduled', 'checkup',    26, 5),
(37, '2026-05-15 09:00:00', 'Scheduled', 'checkup',    30, 1),
(38, '2026-05-16 10:00:00', 'Scheduled', 'checkup',    34, 2),
(39, '2026-05-17 11:00:00', 'Scheduled', 'checkup',    38, 42),
(40, '2026-05-18 09:30:00', 'Scheduled', 'checkup',    42, 44),
-- Cancelled appointments
(41, '2026-03-15 09:00:00', 'Cancelled', 'checkup',    19, 1),
(42, '2026-03-16 10:00:00', 'Cancelled', 'checkup',    21, 2),
(43, '2026-03-17 11:00:00', 'Cancelled', 'checkup',    27, 3),
(44, '2026-03-18 09:30:00', 'Cancelled', 'checkup',    31, 5),
(45, '2026-03-19 14:00:00', 'Cancelled', 'checkup',    35, 46),
-- Dr. Bob test appointments (today) for testing prescriptions & billing
(46, '2026-05-08 09:00:00', 'Scheduled', 'checkup',    1,  2),
(47, '2026-05-08 10:30:00', 'Scheduled', 'surgery',    7,  2),
(48, '2026-05-08 14:00:00', 'Scheduled', 'vaccination', 6, 2);

-- -------------------------
-- Bills (19 total - for completed appointments)
-- -------------------------
INSERT INTO Bill (bill_id, generated_date, payment_status, total_amount, appointment_id) VALUES
(1,  '2026-04-01', 'Paid',   145.00, 1),
(2,  '2026-04-02', 'Unpaid', 137.50, 2),
(3,  '2026-04-10', 'Unpaid', 112.00, 4),
(4,  '2026-03-20', 'Paid',   100.00, 9),
(5,  '2026-05-07', 'Paid',    95.00, 11),
(6,  '2026-05-07', 'Unpaid', 110.00, 12),
(7,  '2026-04-05', 'Paid',   160.00, 16),
(8,  '2026-04-06', 'Unpaid', 120.00, 17),
(9,  '2026-04-07', 'Paid',   250.00, 18),
(10, '2026-04-08', 'Unpaid', 140.00, 19),
(11, '2026-04-09', 'Paid',   155.00, 20),
(12, '2026-04-11', 'Unpaid', 180.00, 21),
(13, '2026-04-12', 'Paid',   220.00, 22),
(14, '2026-04-13', 'Unpaid', 135.00, 23),
(15, '2026-04-14', 'Paid',   145.00, 24),
(16, '2026-04-15', 'Unpaid', 125.00, 25),
(17, '2026-04-16', 'Paid',   195.00, 26),
(18, '2026-04-17', 'Unpaid', 215.00, 27),
(19, '2026-04-18', 'Paid',   230.00, 28);

-- -------------------------
-- Prescriptions (35 total)
-- -------------------------
INSERT INTO Prescription (prescription_id, pet_id, date_time, expiration_date, vet_id) VALUES
(1,  1,  '2026-04-01 09:30:00', '2026-04-15', 1),
(2,  3,  '2026-04-02 10:30:00', '2026-04-16', 2),
(3,  5,  '2026-04-10 10:00:00', '2026-04-24', 3),
(4,  1,  '2026-03-20 09:30:00', '2026-04-03', 1),
(5,  7,  '2026-04-20 11:00:00', '2026-05-04', 2),
(6,  9,  '2026-04-05 09:30:00', '2026-04-19', 1),
(7,  10, '2026-04-06 10:30:00', '2026-04-20', 2),
(8,  11, '2026-04-07 11:30:00', '2026-04-21', 13),
(9,  12, '2026-04-08 10:00:00', '2026-04-22', 14),
(10, 17, '2026-04-09 14:30:00', '2026-04-23', 3),
(11, 18, '2026-04-11 09:30:00', '2026-04-25', 4),
(12, 23, '2026-04-12 10:30:00', '2026-04-26', 15),
(13, 24, '2026-04-13 11:30:00', '2026-04-27', 16),
(14, 25, '2026-04-14 09:30:00', '2026-04-28', 3),
(15, 29, '2026-04-15 10:30:00', '2026-04-29', 17),
(16, 33, '2026-04-16 11:30:00', '2026-04-30', 2),
(17, 37, '2026-04-17 09:30:00', '2026-05-01', 4),
(18, 41, '2026-04-18 14:30:00', '2026-05-02', 5),
(19, 45, '2026-04-19 10:30:00', '2026-05-03', 1),
(20, 47, '2026-04-21 09:30:00', '2026-05-05', 18),
(21, 14, '2026-04-22 10:00:00', '2026-05-06', 21),
(22, 16, '2026-04-23 11:00:00', '2026-05-07', 19),
(23, 20, '2026-04-24 09:00:00', '2026-05-08', 3),
(24, 22, '2026-04-25 10:00:00', '2026-05-09', 4),
(25, 26, '2026-04-26 11:00:00', '2026-05-10', 5),
(26, 30, '2026-04-27 09:00:00', '2026-05-11', 1),
(27, 34, '2026-04-28 10:00:00', '2026-05-12', 2),
(28, 38, '2026-04-29 11:00:00', '2026-05-13', 42),
(29, 42, '2026-04-30 09:00:00', '2026-05-14', 44),
(30, 27, '2026-03-10 10:00:00', '2026-03-24', 3),
(31, 31, '2026-03-11 11:00:00', '2026-03-25', 5),
(32, 35, '2026-03-12 09:00:00', '2026-03-26', 46),
(33, 43, '2026-03-13 10:00:00', '2026-03-27', 1),
(34, 44, '2026-03-14 11:00:00', '2026-03-28', 3),
(35, 48, '2026-03-15 09:00:00', '2026-03-29', 47);

-- -------------------------
-- PresMed
-- -------------------------
INSERT INTO PresMed (prescription_id, medicine_id, dosage, frequency) VALUES
(1,  'MED-001', 2, 3),
(1,  'MED-002', 1, 2),
(2,  'MED-001', 3, 2),
(2,  'MED-004', 1, 1),
(3,  'MED-002', 2, 2),
(4,  'MED-001', 2, 2),
(5,  'MED-003', 1, 1),
(6,  'MED-005', 1, 2),
(7,  'MED-006', 2, 2),
(8,  'MED-010', 1, 3),
(9,  'MED-001', 2, 2),
(9,  'MED-012', 1, 1),
(10, 'MED-004', 1, 1),
(11, 'MED-002', 2, 2),
(11, 'MED-014', 1, 1),
(12, 'MED-001', 3, 2),
(13, 'MED-005', 1, 2),
(14, 'MED-002', 1, 2),
(15, 'MED-006', 2, 2),
(16, 'MED-010', 1, 2),
(17, 'MED-002', 2, 2),
(17, 'MED-010', 1, 2),
(18, 'MED-009', 1, 1),
(19, 'MED-001', 2, 3),
(20, 'MED-001', 1, 2),
(21, 'MED-007', 1, 2),
(22, 'MED-013', 1, 1),
(23, 'MED-004', 1, 1),
(24, 'MED-011', 2, 3),
(25, 'MED-015', 1, 1),
(26, 'MED-001', 2, 2),
(27, 'MED-002', 1, 2),
(28, 'MED-008', 1, 2),
(29, 'MED-007', 1, 1),
(30, 'MED-006', 2, 2),
(31, 'MED-001', 3, 2),
(32, 'MED-004', 1, 1),
(33, 'MED-002', 2, 3),
(34, 'MED-011', 1, 2),
(35, 'MED-005', 1, 2);

-- -------------------------
-- PetVaccinationPlan
-- Existing pets 1-8: plans 1-32 (auto-increment)
-- New pets 9-48: plans 33-112 (2 per pet)
-- -------------------------
INSERT INTO PetVaccinationPlan (pet_id, vaccine_barcode, age_weeks, sequence_number, repeat_every_months, gender_applicable, notes, created_by, created_date) VALUES
-- Pet 1 (Buddy - Golden Retriever) → plans 1-4
(1, 'VAC-001', 16, 1, 12, NULL, 'Annual rabies booster required by law',         1, '2025-03-01'),
(1, 'VAC-002',  8, 1, 12, NULL, 'Puppy series started at 6-8 weeks',             1, '2025-03-01'),
(1, 'VAC-002', 12, 2, 12, NULL, 'Second dose of DHPP',                           1, '2025-03-01'),
(1, 'VAC-002', 16, 3, 12, NULL, 'Final puppy booster of DHPP',                   1, '2025-03-01'),
-- Pet 2 (Whiskers - Siamese Cat) → plans 5-7
(2, 'VAC-001', 12, 1, 12, NULL, 'Rabies vaccine for indoor cat',                 1, '2026-03-01'),
(2, 'VAC-002',  8, 1, 12, NULL, 'Feline distemper vaccine',                      1, '2026-03-01'),
(2, 'VAC-002', 12, 2, 12, NULL, 'Booster for feline distemper',                  1, '2026-03-01'),
-- Pet 3 (Max - German Shepherd) → plans 8-12
(3, 'VAC-001', 16, 1, 12, NULL, 'Rabies vaccination',                            2, '2025-06-10'),
(3, 'VAC-002',  8, 1, 12, NULL, 'DHPP - first shot',                             2, '2025-06-10'),
(3, 'VAC-002', 12, 2, 12, NULL, 'DHPP - second shot',                            2, '2025-06-10'),
(3, 'VAC-003', 16, 1, 12, NULL, 'Kennel cough vaccine - first dose',             2, '2025-06-10'),
(3, 'VAC-003', 20, 2, 12, NULL, 'Kennel cough vaccine - booster',                2, '2025-06-10'),
-- Pet 4 (Bella - Labrador) → plans 13-17
(4, 'VAC-001', 16, 1, 12, NULL, 'Rabies - primary series',                       1, '2026-02-01'),
(4, 'VAC-002',  6, 1, 12, NULL, 'DHPP - first puppy shot',                       1, '2026-02-01'),
(4, 'VAC-002', 10, 2, 12, NULL, 'DHPP - second puppy shot',                      1, '2026-02-01'),
(4, 'VAC-002', 14, 3, 12, NULL, 'DHPP - third puppy shot',                       1, '2026-02-01'),
(4, 'VAC-003', 12, 1, 12, NULL, 'Bordetella - kennel cough vaccine',             1, '2026-02-01'),
-- Pet 5 (Charlie - Bulldog) → plans 18-20
(5, 'VAC-001', 16, 1, 12, NULL, 'Rabies vaccine required',                       3, '2025-09-20'),
(5, 'VAC-002',  8, 1, 12, NULL, 'Bulldog - DHPP primary',                        3, '2025-09-20'),
(5, 'VAC-002', 12, 2, 12, NULL, 'Bulldog - DHPP booster',                        3, '2025-09-20'),
-- Pet 6 (Luna - Persian Cat) → plans 21-23
(6, 'VAC-001', 12, 1, 12, 'F', 'Rabies vaccine - female cats',                  5, '2025-12-01'),
(6, 'VAC-002',  8, 1, 12, 'F', 'Feline distemper - females',                    5, '2025-12-01'),
(6, 'VAC-002', 12, 2, 12, 'F', 'Feline distemper booster - females',            5, '2025-12-01'),
-- Pet 7 (Rocky - Beagle) → plans 24-27
(7, 'VAC-001', 16, 1, 12, NULL, 'Rabies - annual requirement',                   2, '2025-02-14'),
(7, 'VAC-002',  8, 1, 12, NULL, 'DHPP - beagle puppy series',                   2, '2025-02-14'),
(7, 'VAC-002', 12, 2, 12, NULL, 'DHPP - second booster',                         2, '2025-02-14'),
(7, 'VAC-003', 14, 1, 12, NULL, 'Bordetella - kennel cough',                     2, '2025-02-14'),
-- Pet 8 (Daisy - Poodle) → plans 28-32
(8, 'VAC-001', 16, 1, 12, NULL, 'Rabies vaccination for poodle',                 4, '2025-11-10'),
(8, 'VAC-002',  8, 1, 12, NULL, 'DHPP - first dose',                             4, '2025-11-10'),
(8, 'VAC-002', 12, 2, 12, NULL, 'DHPP - second dose',                            4, '2025-11-10'),
(8, 'VAC-002', 16, 3, 12, NULL, 'DHPP - final booster',                          4, '2025-11-10'),
(8, 'VAC-003', 18, 1, 12, NULL, 'Bordetella vaccine - grooming precaution',      4, '2025-11-10'),
-- New pets: 2 plans each (plan 33+ for pets 9-48)
-- Pet 9 Rex (Dog) → plans 33,34
(9,  'VAC-001', 16, 1, 12, NULL, 'Annual rabies',  1, '2025-01-10'),
(9,  'VAC-002', 8,  1, 12, NULL, 'DHPP series',    1, '2025-01-10'),
-- Pet 10 Nala (Cat) → plans 35,36
(10, 'VAC-001', 12, 1, 12, NULL, 'Annual rabies',  1, '2025-01-10'),
(10, 'VAC-008', 8,  1, 12, NULL, 'FVRCP series',   1, '2025-01-10'),
-- Pet 11 Coco (Dog) → plans 37,38
(11, 'VAC-001', 16, 1, 12, NULL, 'Annual rabies',  1, '2025-01-10'),
(11, 'VAC-002', 8,  1, 12, NULL, 'DHPP series',    1, '2025-01-10'),
-- Pet 12 Thor (Dog) → plans 39,40
(12, 'VAC-001', 16, 1, 12, NULL, 'Annual rabies',  1, '2025-01-10'),
(12, 'VAC-002', 8,  1, 12, NULL, 'DHPP series',    1, '2025-01-10'),
-- Pet 13 Mochi (Rabbit) → plans 41,42
(13, 'VAC-001', 12, 1, 12, NULL, 'Rabies prevention', 1, '2025-01-10'),
(13, 'VAC-005', 12, 1, 12, NULL, 'Leptospirosis prevention', 1, '2025-01-10'),
-- Pet 14 Pearl (Bird) → plans 43,44
(14, 'VAC-001', 12, 1, 12, NULL, 'Rabies prevention', 1, '2025-01-10'),
(14, 'VAC-007', 12, 1, 12, NULL, 'Influenza prevention', 1, '2025-01-10'),
-- Pet 15 Shadow (Dog) → plans 45,46
(15, 'VAC-001', 16, 1, 12, NULL, 'Annual rabies',  1, '2025-01-10'),
(15, 'VAC-002', 8,  1, 12, NULL, 'DHPP series',    1, '2025-01-10'),
-- Pet 16 Lily (Dog) → plans 47,48
(16, 'VAC-001', 16, 1, 12, 'F', 'Annual rabies',   1, '2025-01-10'),
(16, 'VAC-002', 8,  1, 12, 'F', 'DHPP series',     1, '2025-01-10'),
-- Pet 17 Tiger (Cat) → plans 49,50
(17, 'VAC-001', 12, 1, 12, NULL, 'Annual rabies',  3, '2025-01-15'),
(17, 'VAC-008', 8,  1, 12, NULL, 'FVRCP series',   3, '2025-01-15'),
-- Pet 18 Scout (Dog) → plans 51,52
(18, 'VAC-001', 16, 1, 12, NULL, 'Annual rabies',  3, '2025-01-15'),
(18, 'VAC-002', 8,  1, 12, NULL, 'DHPP series',    3, '2025-01-15'),
-- Pet 19 Cleo (Cat) → plans 53,54
(19, 'VAC-001', 12, 1, 12, 'F', 'Annual rabies',   3, '2025-01-15'),
(19, 'VAC-008', 8,  1, 12, 'F', 'FVRCP series',    3, '2025-01-15'),
-- Pet 20 Bruno (Dog) → plans 55,56
(20, 'VAC-001', 16, 1, 12, NULL, 'Annual rabies',  3, '2025-01-15'),
(20, 'VAC-002', 8,  1, 12, NULL, 'DHPP series',    3, '2025-01-15'),
-- Pet 21 Molly (Dog) → plans 57,58
(21, 'VAC-001', 16, 1, 12, 'F', 'Annual rabies',   1, '2025-01-20'),
(21, 'VAC-003', 12, 1, 12, 'F', 'Bordetella',      1, '2025-01-20'),
-- Pet 22 Simba (Cat) → plans 59,60
(22, 'VAC-001', 12, 1, 12, NULL, 'Annual rabies',  2, '2025-01-20'),
(22, 'VAC-008', 8,  1, 12, NULL, 'FVRCP series',   2, '2025-01-20'),
-- Pet 23 Duke (Dog) → plans 61,62
(23, 'VAC-001', 16, 1, 12, NULL, 'Annual rabies',  1, '2025-02-01'),
(23, 'VAC-005', 16, 1, 12, NULL, 'Leptospirosis',  1, '2025-02-01'),
-- Pet 24 Ellie (Dog) → plans 63,64
(24, 'VAC-001', 16, 1, 12, 'F', 'Annual rabies',   2, '2025-02-01'),
(24, 'VAC-002', 8,  1, 12, 'F', 'DHPP series',     2, '2025-02-01'),
-- Pet 25 Finn (Dog) → plans 65,66
(25, 'VAC-001', 16, 1, 12, NULL, 'Annual rabies',  3, '2025-02-05'),
(25, 'VAC-006', 16, 1, 12, NULL, 'Lyme disease',   3, '2025-02-05'),
-- Pet 26 Ginger (Cat) → plans 67,68
(26, 'VAC-001', 12, 1, 12, 'F', 'Annual rabies',   4, '2025-02-05'),
(26, 'VAC-008', 8,  1, 12, 'F', 'FVRCP series',    4, '2025-02-05'),
-- Pet 27 Hank (Dog) → plans 69,70
(27, 'VAC-001', 16, 1, 12, NULL, 'Annual rabies',  3, '2025-02-10'),
(27, 'VAC-002', 8,  1, 12, NULL, 'DHPP series',    3, '2025-02-10'),
-- Pet 28 Ivy (Cat) → plans 71,72
(28, 'VAC-001', 12, 1, 12, 'F', 'Annual rabies',   4, '2025-02-10'),
(28, 'VAC-004', 8,  1, 12, 'F', 'Feline leukemia', 4, '2025-02-10'),
-- Pet 29 Jake (Dog) → plans 73,74
(29, 'VAC-001', 16, 1, 12, NULL, 'Annual rabies',  1, '2025-02-15'),
(29, 'VAC-002', 8,  1, 12, NULL, 'DHPP series',    1, '2025-02-15'),
-- Pet 30 Kiki (Dog) → plans 75,76
(30, 'VAC-001', 16, 1, 12, 'F', 'Annual rabies',   2, '2025-02-15'),
(30, 'VAC-003', 12, 1, 12, 'F', 'Bordetella',      2, '2025-02-15'),
-- Pet 31 Leo (Dog) → plans 77,78
(31, 'VAC-001', 16, 1, 12, NULL, 'Annual rabies',  5, '2025-02-20'),
(31, 'VAC-002', 8,  1, 12, NULL, 'DHPP series',    5, '2025-02-20'),
-- Pet 32 Mia (Cat) → plans 79,80
(32, 'VAC-001', 12, 1, 12, 'F', 'Annual rabies',   3, '2025-02-20'),
(32, 'VAC-008', 8,  1, 12, 'F', 'FVRCP series',    3, '2025-02-20'),
-- Pet 33 Noah (Dog) → plans 81,82
(33, 'VAC-001', 16, 1, 12, NULL, 'Annual rabies',  2, '2025-03-01'),
(33, 'VAC-002', 8,  1, 12, NULL, 'DHPP series',    2, '2025-03-01'),
-- Pet 34 Olive (Cat) → plans 83,84
(34, 'VAC-001', 12, 1, 12, 'F', 'Annual rabies',   4, '2025-03-01'),
(34, 'VAC-008', 8,  1, 12, 'F', 'FVRCP series',    4, '2025-03-01'),
-- Pet 35 Penny (Dog) → plans 85,86
(35, 'VAC-001', 16, 1, 12, 'F', 'Annual rabies',   46,'2025-03-05'),
(35, 'VAC-007', 12, 1, 12, 'F', 'Canine influenza',46,'2025-03-05'),
-- Pet 36 Quinn (Cat) → plans 87,88
(36, 'VAC-001', 12, 1, 12, NULL, 'Annual rabies',  3, '2025-03-05'),
(36, 'VAC-004', 8,  1, 12, NULL, 'Feline leukemia',3, '2025-03-05'),
-- Pet 37 Rex (Dog) → plans 89,90
(37, 'VAC-001', 16, 1, 12, NULL, 'Annual rabies',  1, '2025-03-10'),
(37, 'VAC-005', 16, 1, 12, NULL, 'Leptospirosis',  1, '2025-03-10'),
-- Pet 38 Sasha (Cat) → plans 91,92
(38, 'VAC-001', 12, 1, 12, 'F', 'Annual rabies',   5, '2025-03-10'),
(38, 'VAC-008', 8,  1, 12, 'F', 'FVRCP series',    5, '2025-03-10'),
-- Pet 39 Toby (Dog) → plans 93,94
(39, 'VAC-001', 16, 1, 12, NULL, 'Annual rabies',  2, '2025-03-15'),
(39, 'VAC-003', 12, 1, 12, NULL, 'Bordetella',     2, '2025-03-15'),
-- Pet 40 Uma (Cat) → plans 95,96
(40, 'VAC-001', 12, 1, 12, 'F', 'Annual rabies',   4, '2025-03-15'),
(40, 'VAC-008', 8,  1, 12, 'F', 'FVRCP series',    4, '2025-03-15'),
-- Pet 41 Vince (Dog) → plans 97,98
(41, 'VAC-001', 16, 1, 12, NULL, 'Annual rabies',  1, '2025-03-20'),
(41, 'VAC-002', 8,  1, 12, NULL, 'DHPP series',    1, '2025-03-20'),
-- Pet 42 Wendy (Cat) → plans 99,100
(42, 'VAC-001', 12, 1, 12, 'F', 'Annual rabies',   3, '2025-03-20'),
(42, 'VAC-004', 8,  1, 12, 'F', 'Feline leukemia', 3, '2025-03-20'),
-- Pet 43 Xander (Dog) → plans 101,102
(43, 'VAC-001', 16, 1, 12, NULL, 'Annual rabies',  1, '2025-03-25'),
(43, 'VAC-006', 16, 1, 12, NULL, 'Lyme disease',   1, '2025-03-25'),
-- Pet 44 Yara (Cat) → plans 103,104
(44, 'VAC-001', 12, 1, 12, 'F', 'Annual rabies',   3, '2025-03-25'),
(44, 'VAC-008', 8,  1, 12, 'F', 'FVRCP series',    3, '2025-03-25'),
-- Pet 45 Zeus (Dog) → plans 105,106
(45, 'VAC-001', 16, 1, 12, NULL, 'Annual rabies',  1, '2025-04-01'),
(45, 'VAC-002', 8,  1, 12, NULL, 'DHPP series',    1, '2025-04-01'),
-- Pet 46 Arya (Cat) → plans 107,108
(46, 'VAC-001', 12, 1, 12, 'F', 'Annual rabies',   5, '2025-04-01'),
(46, 'VAC-008', 8,  1, 12, 'F', 'FVRCP series',    5, '2025-04-01'),
-- Pet 47 Benny (Dog) → plans 109,110
(47, 'VAC-001', 16, 1, 12, NULL, 'Annual rabies',  18,'2025-04-05'),
(47, 'VAC-002', 8,  1, 12, NULL, 'DHPP series',    18,'2025-04-05'),
-- Pet 48 Cara (Cat) → plans 111,112
(48, 'VAC-001', 12, 1, 12, 'F', 'Annual rabies',   47,'2025-04-05'),
(48, 'VAC-008', 8,  1, 12, 'F', 'FVRCP series',    47,'2025-04-05');

-- -------------------------
-- Vaccinations (50 total, 30+ overdue with next_due_date < 2026-05-08)
-- -------------------------
INSERT INTO Vaccination (vac_id, vac_date, next_due_date, pet_id, vet_id, barcode_no, pet_vaccination_plan_id) VALUES
-- Original 10
(1,  '2025-03-01', '2026-03-01', 1, 1, 'VAC-001', 1),
(2,  '2025-04-15', '2026-04-15', 1, 1, 'VAC-002', 2),
(3,  '2025-06-10', '2026-06-10', 3, 2, 'VAC-001', 8),
(4,  '2025-09-20', '2026-09-20', 3, 2, 'VAC-003', 11),
(5,  '2026-03-01', '2027-03-01', 2, 1, 'VAC-002', 6),
(6,  '2025-02-14', '2026-02-14', 7, 2, 'VAC-001', 24),
(7,  '2026-02-01', '2026-05-01', 4, 1, 'VAC-003', 17),
(8,  '2025-12-01', '2026-12-01', 6, 5, 'VAC-002', 22),
(9,  '2025-11-10', '2026-11-10', 8, 4, 'VAC-001', 28),
(10, '2026-01-20', '2027-01-20', 7, 2, 'VAC-002', 25),
-- New overdue vaccinations (next_due_date < 2026-05-08)
(11, '2024-12-01', '2025-12-01', 9,  1, 'VAC-001', 33),
(12, '2024-12-01', '2025-12-01', 9,  1, 'VAC-002', 34),
(13, '2024-11-15', '2025-11-15', 10, 2, 'VAC-001', 35),
(14, '2024-11-15', '2025-11-15', 10, 1, 'VAC-008', 36),
(15, '2025-01-10', '2026-01-10', 11, 1, 'VAC-001', 37),
(16, '2025-01-10', '2026-01-10', 11, 2, 'VAC-002', 38),
(17, '2024-10-20', '2025-10-20', 12, 1, 'VAC-001', 39),
(18, '2024-10-20', '2025-10-20', 12, 2, 'VAC-002', 40),
(19, '2025-02-01', '2026-02-01', 13, 1, 'VAC-001', 41),
(20, '2024-09-15', '2025-09-15', 14, 2, 'VAC-001', 43),
(21, '2024-08-20', '2025-08-20', 15, 1, 'VAC-001', 45),
(22, '2024-08-20', '2025-08-20', 15, 2, 'VAC-002', 46),
(23, '2025-03-10', '2026-03-10', 16, 1, 'VAC-001', 47),
(24, '2025-01-05', '2026-01-05', 17, 3, 'VAC-001', 49),
(25, '2024-11-30', '2025-11-30', 18, 3, 'VAC-001', 51),
(26, '2024-11-30', '2025-11-30', 18, 4, 'VAC-002', 52),
(27, '2025-04-01', '2026-04-01', 19, 3, 'VAC-001', 53),
(28, '2024-12-15', '2025-12-15', 20, 4, 'VAC-001', 55),
(29, '2025-02-20', '2026-02-20', 21, 1, 'VAC-001', 57),
(30, '2025-03-15', '2026-03-15', 22, 2, 'VAC-001', 59),
(31, '2024-10-01', '2025-10-01', 23, 1, 'VAC-001', 61),
(32, '2024-11-05', '2025-11-05', 24, 2, 'VAC-001', 63),
(33, '2025-01-20', '2026-01-20', 25, 3, 'VAC-001', 65),
(34, '2024-12-10', '2025-12-10', 26, 4, 'VAC-001', 67),
(35, '2025-03-25', '2026-03-25', 27, 3, 'VAC-001', 69),
(36, '2024-09-30', '2025-09-30', 28, 5, 'VAC-001', 71),
(37, '2025-04-10', '2026-04-10', 29, 1, 'VAC-001', 73),
(38, '2024-08-15', '2025-08-15', 30, 2, 'VAC-001', 75),
(39, '2025-01-01', '2026-01-01', 31, 1, 'VAC-001', 77),
(40, '2025-02-14', '2026-02-14', 32, 3, 'VAC-001', 79),
(41, '2024-07-20', '2025-07-20', 33, 2, 'VAC-001', 81),
(42, '2025-04-20', '2026-04-20', 34, 4, 'VAC-001', 83),
(43, '2024-10-12', '2025-10-12', 35, 46,'VAC-001', 85),
(44, '2025-03-05', '2026-03-05', 36, 3, 'VAC-001', 87),
(45, '2024-11-22', '2025-11-22', 37, 1, 'VAC-001', 89),
(46, '2025-01-15', '2026-01-15', 38, 5, 'VAC-001', 91),
(47, '2024-09-05', '2025-09-05', 39, 2, 'VAC-001', 93),
(48, '2025-04-05', '2026-04-05', 40, 4, 'VAC-001', 95),
(49, '2025-02-28', '2026-02-28', 41, 1, 'VAC-001', 97),
(50, '2024-12-20', '2025-12-20', 42, 3, 'VAC-001', 99);

-- -------------------------
-- Referrals (15 total)
-- -------------------------
INSERT INTO Referral (referral_id, reason, referral_date, status, sender_vet_id, receiver_vet_id, pet_id) VALUES
(1,  'Suspected bone fracture requiring orthopedic evaluation',           '2026-04-05', 'Accepted',  1,  4,  1),
(2,  'Suspicious skin lesion needs oncology consult',                     '2026-04-12', 'Pending',   3,  5,  5),
(3,  'Chronic ear infection unresponsive to standard treatment',          '2026-04-06', 'Accepted',  1,  13, 9),
(4,  'Suspected cardiac abnormality needs cardiology evaluation',         '2026-04-07', 'Accepted',  2,  14, 10),
(5,  'Persistent neurological symptoms require specialist review',        '2026-04-08', 'Pending',   3,  41, 17),
(6,  'Post-surgical complication needs second opinion',                   '2026-04-09', 'Accepted',  4,  42, 18),
(7,  'Recurrent seizures need neurology assessment',                      '2026-04-10', 'Accepted',  1,  15, 11),
(8,  'Dental disease requiring specialist extraction',                    '2026-04-11', 'Rejected',  2,  16, 12),
(9,  'Suspected lymphoma needs oncology evaluation',                      '2026-04-12', 'Pending',   5,  46, 33),
(10, 'Aggressive behavior may indicate pain - needs full workup',         '2026-04-13', 'Accepted',  13, 2,  23),
(11, 'Chronic diarrhea unresponsive to treatment - gastro consult needed','2026-04-14', 'Pending',   14, 3,  24),
(12, 'Progressive lameness requires orthopedic imaging',                  '2026-04-15', 'Accepted',  41, 4,  25),
(13, 'Skin mass needs dermatology biopsy',                                '2026-04-16', 'Pending',   3,  43, 26),
(14, 'Suspected hip dysplasia needs orthopedic consult',                  '2026-04-17', 'Accepted',  4,  44, 27),
(15, 'Thyroid abnormality detected - endocrine evaluation needed',        '2026-04-18', 'Pending',   5,  47, 37);

-- -------------------------
-- Evaluations (39 total)
-- -------------------------
INSERT INTO Evaluation (eval_id, points, date, comment, owner_id, vet_id, man_id) VALUES
(1,  5, '2026-04-02', 'Dr. Johnson was wonderful with Buddy!',               8,  1,  NULL),
(2,  4, '2026-04-03', 'Dr. Martinez was thorough and professional.',         9,  2,  6),
(3,  3, '2026-04-11', 'Good visit, waiting room was a bit long.',            10, 3,  NULL),
(4,  5, '2026-03-21', 'Outstanding care, highly recommend!',                 8,  1,  NULL),
(5,  4, '2026-03-10', 'Dr. Hayes provided excellent diagnosis.',             8,  13, 6),
(6,  5, '2026-03-11', 'Dr. Stone was incredibly patient with Pearl.',        8,  14, 6),
(7,  3, '2026-03-12', 'Dr. Adams was good but rushed.',                      9,  15, 6),
(8,  4, '2026-03-13', 'Very professional and knowledgeable.',                9,  16, 6),
(9,  5, '2026-03-14', 'Dr. Carter exceeded expectations.',                   10, 17, 6),
(10, 4, '2026-03-15', 'Great bedside manner with anxious pets.',             49, 18, 6),
(11, 3, '2026-03-16', 'Adequate care but communication could improve.',      50, 19, 6),
(12, 5, '2026-03-17', 'Best vet experience we have had!',                    51, 20, 6),
(13, 4, '2026-03-18', 'Dr. Grant was thorough and explained everything.',    52, 21, 6),
(14, 5, '2026-03-19', 'Exceptional care and follow-up.',                     53, 22, 6),
(15, 4, '2026-03-20', 'Very happy with the treatment plan.',                 54, 23, 6),
(16, 3, '2026-03-21', 'Long wait but good care once seen.',                  55, 24, 6),
(17, 5, '2026-03-22', 'Dr. King was fantastic with our nervous dog.',        56, 25, 6),
(18, 4, '2026-03-23', 'Professional and caring approach.',                   57, 26, 6),
(19, 5, '2026-03-24', 'Dr. Moore went above and beyond.',                    58, 27, 6),
(20, 4, '2026-03-25', 'Very satisfied with the visit.',                      59, 28, 6),
(21, 3, '2026-03-26', 'Decent care, facility could be cleaner.',             60, 29, 6),
(22, 5, '2026-03-27', 'Absolutely wonderful experience!',                    61, 30, 6),
(23, 4, '2026-03-28', 'Dr. Quinn was helpful and attentive.',                8,  31, 6),
(24, 5, '2026-03-29', 'Dr. Reed provided outstanding post-op care.',         9,  32, 6),
(25, 4, '2026-03-30', 'Very thorough examination.',                          10, 33, 6),
(26, 3, '2026-04-01', 'Good overall but wait times are long.',               49, 34, NULL),
(27, 5, '2026-04-02', 'Dr. Underwood is exceptional.',                       50, 35, NULL),
(28, 4, '2026-04-03', 'Happy with the diagnosis and treatment.',             51, 36, NULL),
(29, 5, '2026-04-04', 'Dr. Webb is our favorite vet!',                       52, 37, NULL),
(30, 4, '2026-04-05', 'Professional and kind service.',                      53, 38, NULL),
(31, 3, '2026-04-06', 'Good care but needs better follow-up.',               54, 39, NULL),
(32, 5, '2026-04-07', 'Dr. Zimmer is incredibly thorough.',                  55, 40, NULL),
(33, 4, '2026-04-08', 'Dr. Anderson handled our anxious cat perfectly.',     56, 41, 7),
(34, 5, '2026-04-09', 'Excellent surgeon, very happy with outcome.',         57, 42, 7),
(35, 4, '2026-04-10', 'Dr. Coleman did a wonderful job.',                    58, 43, 7),
(36, 3, '2026-04-11', 'Good but the appointment ran over time.',             59, 44, 7),
(37, 5, '2026-04-12', 'Dr. Edwards is outstanding!',                         60, 45, 7),
(38, 4, '2026-04-13', 'Dr. Fisher was great with our senior dog.',           61, 46, 48),
(39, 5, '2026-04-14', 'Highly recommend Dr. Green for surgery.',             49, 47, 48);

-- -------------------------
-- Medical History (25 entries)
-- -------------------------
INSERT INTO Medical_History (pet_id, date_time, diagnosis, symptoms, treatments, notes) VALUES
(1,  '2026-04-01 09:15:00', 'Bacterial skin infection',       'Redness, itching, hair loss',              'Amoxicillin 500mg BID x 14 days, topical antiseptic',      'Follow-up in 2 weeks'),
(3,  '2026-04-02 10:15:00', 'Post-operative care visit',      'Surgical site healing normally',           'Wound cleaning, pain management with Metacam',             'Stitches to be removed in 7 days'),
(5,  '2026-04-10 09:45:00', 'Seasonal allergies',             'Sneezing, watery eyes',                    'Prednisone 5mg SID x 7 days',                              'Avoid outdoor activity during high pollen season'),
(1,  '2026-03-20 09:15:00', 'Annual wellness check',          'No significant symptoms',                  'General physical examination',                             'All vitals normal'),
(9,  '2026-04-05 09:15:00', 'Ear infection',                  'Head shaking, ear discharge, odor',        'Amoxicillin 250mg BID x 10 days, ear drops',               'Recheck in 10 days'),
(10, '2026-04-06 10:15:00', 'Urinary tract infection',        'Frequent urination, straining, blood',     'Doxycycline 100mg SID x 14 days, increased water intake',  'Urine culture recommended'),
(11, '2026-04-07 11:00:00', 'Post-spay recovery',             'Incision site mild swelling',              'Tramadol 50mg BID x 5 days, E-collar placed',              'Activity restriction for 2 weeks'),
(12, '2026-04-08 09:30:00', 'Annual wellness check',          'Minor tartar buildup',                     'Dental cleaning scheduled, general exam normal',           'Dental procedure recommended'),
(17, '2026-04-09 14:15:00', 'Ringworm infection',             'Circular lesions, hair loss patches',      'Fluconazole 50mg SID x 28 days, topical antifungal',       'Isolate from other pets, disinfect bedding'),
(18, '2026-04-11 09:15:00', 'Gastroenteritis',                'Vomiting, diarrhea, lethargy',             'Metronidazole 250mg BID x 7 days, bland diet',             'Monitor hydration status closely'),
(23, '2026-04-12 10:15:00', 'Hip dysplasia evaluation',       'Difficulty rising, hind limb weakness',    'Pain management with Metacam, physiotherapy referral',     'X-rays confirm moderate hip dysplasia'),
(24, '2026-04-13 11:00:00', 'Annual wellness check',          'Mild obesity noted',                       'Weight management diet plan, increased exercise',          'Recheck weight in 3 months'),
(25, '2026-04-14 09:15:00', 'Lyme disease follow-up',         'Joint swelling, lethargy improving',       'Doxycycline 100mg BID x 30 days continuing',               'Tick prevention protocol discussed'),
(29, '2026-04-15 10:15:00', 'Dental disease',                 'Halitosis, difficulty eating, pawing face','Clindamycin 75mg BID x 10 days, dental extraction planned', 'Grade 3 periodontal disease'),
(33, '2026-04-16 11:15:00', 'Post-surgical recovery',         'Incision healing well, appetite good',     'Tramadol 100mg BID x 7 days, wound care',                  'Great Dane - monitor for bloat'),
(37, '2026-04-17 09:45:00', 'Cruciate ligament tear',         'Sudden onset lameness, swelling in stifle','Metacam 15mg SID, surgical repair scheduled',              'Strict rest until surgery'),
(41, '2026-04-18 14:15:00', 'Mast cell tumor evaluation',     'Raised mass on dorsal surface',            'Surgical excision scheduled, Prednisone 10mg SID',         'Histopathology recommended post-excision'),
(45, '2026-04-19 10:15:00', 'Hypothyroidism diagnosis',       'Weight gain, lethargy, dull coat',         'Levothyroxine initiated, dietary changes',                  'TSH and T4 levels to be rechecked in 6 weeks'),
(47, '2026-04-21 09:15:00', 'Annual wellness check',          'Slight heart murmur detected',             'Enalapril 5mg BID initiated, cardiac monitoring',          'Echocardiogram recommended'),
(7,  '2026-04-20 11:15:00', 'Kennel cough',                   'Honking cough, nasal discharge, lethargy', 'Doxycycline 50mg BID x 10 days, cough suppressant',        'Isolate from other dogs for 2 weeks'),
(4,  '2026-04-15 14:15:00', 'Bordetella vaccination follow-up','Mild cough post-vaccination - expected',  'Supportive care, monitor for complications',               'Normal post-vaccine response'),
(8,  '2026-04-25 15:15:00', 'Orthopedic evaluation',          'Intermittent lameness in right forelimb',  'Metacam 2.5mg SID x 14 days, restricted exercise',         'Radiographs show early arthritis'),
(2,  '2026-05-07 10:45:00', 'Dental checkup',                 'Mild gingivitis, no extractions needed',   'Professional dental cleaning performed',                   'Daily tooth brushing recommended'),
(6,  '2026-04-22 11:15:00', 'Hyperthyroidism diagnosis',      'Weight loss, increased appetite, vomiting', 'Methimazole 2.5mg BID initiated',                         'T4 recheck in 3 weeks'),
(20, '2026-04-24 09:15:00', 'Skin dermatitis',                'Itching, redness, secondary infection',    'Cyclosporine 25mg SID, medicated shampoo',                 'Allergy testing recommended');

-- -------------------------
-- BoardingUnits (18 total)
-- -------------------------
INSERT INTO BoardingUnit (boarding_unit_id, size, is_occupied, branch_id, pet_id, check_in_date, check_out_date, feeding_instructions) VALUES
(1,  'Small',  TRUE,  1, 2,    '2026-05-05', '2026-05-10', '2x daily, dry food only'),
(2,  'Medium', TRUE,  1, 1,    '2026-05-06', '2026-05-12', NULL),
(3,  'Large',  FALSE, 1, NULL, NULL,          NULL,          NULL),
(4,  'Small',  FALSE, 2, NULL, NULL,          NULL,          NULL),
(5,  'Medium', TRUE,  2, 5,    '2026-05-04', '2026-05-09', 'No treats, allergic to chicken'),
(6,  'Large',  FALSE, 3, NULL, NULL,          NULL,          NULL),
(7,  'Small',  TRUE,  1, 9,    '2026-05-05', '2026-05-11', 'Feed twice daily, dry kibble'),
(8,  'Medium', TRUE,  1, 12,   '2026-05-06', '2026-05-13', 'Prefers wet food mixed with dry'),
(9,  'Large',  TRUE,  1, 23,   '2026-05-04', '2026-05-10', 'Large breed food, 3x daily'),
(10, 'Small',  FALSE, 1, NULL, NULL,          NULL,          NULL),
(11, 'Medium', FALSE, 1, NULL, NULL,          NULL,          NULL),
(12, 'Large',  FALSE, 1, NULL, NULL,          NULL,          NULL),
(13, 'Small',  TRUE,  2, 17,   '2026-05-05', '2026-05-08', 'Wet food only, no dry'),
(14, 'Medium', TRUE,  2, 25,   '2026-05-06', '2026-05-14', 'Active dog, needs enrichment toys'),
(15, 'Large',  FALSE, 2, NULL, NULL,          NULL,          NULL),
(16, 'Small',  TRUE,  3, 34,   '2026-05-05', '2026-05-09', 'Special prescription diet'),
(17, 'Medium', FALSE, 3, NULL, NULL,          NULL,          NULL),
(18, 'Large',  TRUE,  3, 45,   '2026-05-04', '2026-05-12', 'Large breed, 3x daily feeding');

-- -------------------------
-- WasteLogs (15 total)
-- -------------------------
INSERT INTO WasteLog (log_id, quantity, waste_date, reason, manager_id, barcode_no) VALUES
(1,  5,  '2026-04-05', 'Expired batch disposed',                   6, 'MED-001'),
(2,  3,  '2026-04-10', 'Contaminated vials discarded',             7, 'VAC-003'),
(3,  8,  '2026-03-15', 'Broken vials during transport',            6, 'VAC-001'),
(4,  4,  '2026-03-20', 'Temperature excursion - vaccines spoiled', 7, 'VAC-002'),
(5,  6,  '2026-03-25', 'Expired stock removed from inventory',     6, 'MED-002'),
(6,  2,  '2026-04-01', 'Damaged packaging, sterility compromised', 6, 'MED-005'),
(7,  10, '2026-04-08', 'Quarterly expired stock disposal',         7, 'MED-001'),
(8,  5,  '2026-04-12', 'Expired corticosteroid batch removed',     6, 'MED-004'),
(9,  3,  '2026-04-15', 'Contaminated antiparasitic disposal',      7, 'MED-003'),
(10, 7,  '2026-04-18', 'Expired vaccine batch - cold chain break', 6, 'VAC-002'),
(11, 4,  '2026-04-20', 'Damaged blister packs discarded',          48,'MED-006'),
(12, 6,  '2026-04-22', 'Expired antifungal medication removed',    6, 'MED-015'),
(13, 2,  '2026-04-25', 'Recalled cardiac medication disposal',     7, 'MED-008'),
(14, 9,  '2026-04-28', 'Annual inventory cleanup - expired stock', 6, 'MED-001'),
(15, 5,  '2026-05-02', 'Feline vaccine batch expiry disposal',     48,'VAC-004');
