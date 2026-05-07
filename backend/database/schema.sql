-- Veterinary Clinic Chain Management System
-- Full DDL Schema

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS WasteLog;
DROP TABLE IF EXISTS BoardingUnit;
DROP TABLE IF EXISTS Medical_History;
DROP TABLE IF EXISTS Evaluation;
DROP TABLE IF EXISTS Referral;
DROP TABLE IF EXISTS Vaccination;
DROP TABLE IF EXISTS PetVaccinationPlan;
DROP TABLE IF EXISTS PresMed;
DROP TABLE IF EXISTS Prescription;
DROP TABLE IF EXISTS BranchStock;
DROP TABLE IF EXISTS StockEntry;
DROP TABLE IF EXISTS LowStockAlert;
DROP TABLE IF EXISTS Vaccine;
DROP TABLE IF EXISTS Medicine;
DROP TABLE IF EXISTS Bill;
DROP TABLE IF EXISTS Appointment;
DROP TABLE IF EXISTS Pet;
DROP TABLE IF EXISTS Clinic_Manager;
DROP TABLE IF EXISTS Veterinarian;
DROP TABLE IF EXISTS Pet_Owner;
DROP TABLE IF EXISTS User;
DROP TABLE IF EXISTS Branch;

SET FOREIGN_KEY_CHECKS = 1;

-- -------------------------
-- Branch
-- -------------------------
CREATE TABLE Branch (
    branch_id    INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(100)  NOT NULL,
    address      VARCHAR(255)  NOT NULL,
    phone_number VARCHAR(20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- User
-- -------------------------
CREATE TABLE User (
    user_id       INT AUTO_INCREMENT PRIMARY KEY,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(100) NOT NULL UNIQUE,
    phone         VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- Pet_Owner
-- -------------------------
CREATE TABLE Pet_Owner (
    user_id INT PRIMARY KEY,
    address VARCHAR(255),
    CONSTRAINT fk_petowner_user FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- Veterinarian
-- -------------------------
CREATE TABLE Veterinarian (
    user_id        INT PRIMARY KEY,
    specialization VARCHAR(100),
    license_number VARCHAR(50) NOT NULL UNIQUE,
    branch_id      INT,
    CONSTRAINT fk_vet_user   FOREIGN KEY (user_id)   REFERENCES User(user_id)     ON DELETE CASCADE,
    CONSTRAINT fk_vet_branch FOREIGN KEY (branch_id) REFERENCES Branch(branch_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- Clinic_Manager
-- -------------------------
CREATE TABLE Clinic_Manager (
    user_id    INT PRIMARY KEY,
    experience INT DEFAULT 0,
    branch_id  INT,
    CONSTRAINT fk_manager_user   FOREIGN KEY (user_id)   REFERENCES User(user_id)     ON DELETE CASCADE,
    CONSTRAINT fk_manager_branch FOREIGN KEY (branch_id) REFERENCES Branch(branch_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- Pet
-- -------------------------
CREATE TABLE Pet (
    pet_id     INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    species    VARCHAR(50),
    breed      VARCHAR(100),
    gender     ENUM('M', 'F') NOT NULL,
    birth_date DATE,
    allergies  TEXT,
    owner_id   INT NOT NULL,
    CONSTRAINT fk_pet_owner FOREIGN KEY (owner_id) REFERENCES Pet_Owner(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- Appointment
-- -------------------------
CREATE TABLE Appointment (
    appointment_id INT AUTO_INCREMENT PRIMARY KEY,
    date_time      DATETIME NOT NULL,
    status         ENUM('Scheduled','Completed','Cancelled') NOT NULL DEFAULT 'Scheduled',
    type           VARCHAR(50) NOT NULL DEFAULT 'checkup',
    notes          TEXT,
    pet_id         INT NOT NULL,
    vet_id         INT NOT NULL,
    CONSTRAINT fk_appt_pet FOREIGN KEY (pet_id) REFERENCES Pet(pet_id)               ON DELETE CASCADE,
    CONSTRAINT fk_appt_vet FOREIGN KEY (vet_id) REFERENCES Veterinarian(user_id)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- Bill
-- -------------------------
CREATE TABLE Bill (
    bill_id        INT AUTO_INCREMENT PRIMARY KEY,
    generated_date DATE NOT NULL,
    payment_status ENUM('Paid','Unpaid') NOT NULL DEFAULT 'Unpaid',
    total_amount   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    appointment_id INT NOT NULL UNIQUE,
    CONSTRAINT fk_bill_appointment FOREIGN KEY (appointment_id) REFERENCES Appointment(appointment_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- Medicine
-- -------------------------
CREATE TABLE Medicine (
    barcode_no  VARCHAR(50) PRIMARY KEY,
    med_name    VARCHAR(100) NOT NULL,
    med_type    VARCHAR(50),
    unit_cost   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- Vaccine
-- -------------------------
CREATE TABLE Vaccine (
    barcode_no  VARCHAR(50) PRIMARY KEY,
    vac_type    VARCHAR(100),
    side_effect TEXT,
    CONSTRAINT fk_vaccine_medicine FOREIGN KEY (barcode_no) REFERENCES Medicine(barcode_no) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- PetVaccinationPlan
-- -------------------------
CREATE TABLE PetVaccinationPlan (
    pet_vaccination_plan_id INT AUTO_INCREMENT PRIMARY KEY,
    pet_id                  INT NOT NULL,
    vaccine_barcode         VARCHAR(50) NOT NULL,
    sequence_number         INT,
    age_weeks               INT NOT NULL,
    repeat_every_months     INT,
    gender_applicable       ENUM('M', 'F') NULL,
    notes                   TEXT,
    created_by              INT,
    created_date            DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_petplan_pet    FOREIGN KEY (pet_id) REFERENCES Pet(pet_id) ON DELETE CASCADE,
    CONSTRAINT fk_petplan_vaccine FOREIGN KEY (vaccine_barcode) REFERENCES Vaccine(barcode_no) ON DELETE RESTRICT,
    CONSTRAINT fk_petplan_vet    FOREIGN KEY (created_by) REFERENCES Veterinarian(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- BranchStock
-- -------------------------
CREATE TABLE BranchStock (
    branch_id       INT         NOT NULL,
    barcode_no      VARCHAR(50) NOT NULL,
    stock_count     INT         NOT NULL DEFAULT 0,
    min_threshold   INT         NOT NULL DEFAULT 10,
    batch_number    VARCHAR(50),
    expiration_date DATE,
    PRIMARY KEY (branch_id, barcode_no),
    CONSTRAINT fk_stock_branch   FOREIGN KEY (branch_id)  REFERENCES Branch(branch_id)   ON DELETE CASCADE,
    CONSTRAINT fk_stock_medicine FOREIGN KEY (barcode_no) REFERENCES Medicine(barcode_no) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- StockEntry
-- -------------------------
CREATE TABLE IF NOT EXISTS StockEntry (
	id SERIAL PRIMARY KEY,
    medicine_id INT REFERENCES medicine(id) ON DELETE CASCADE,
    batch_number VARCHAR(50),
    quantity INT,
    expiry_date DATE,
    date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- LowStockAlert
-- -------------------------
CREATE TABLE IF NOT EXISTS LowStockAlert (
    id SERIAL PRIMARY KEY,
    medicine_id INT REFERENCES medicine(id) ON DELETE CASCADE,
    alert_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- Prescription
-- -------------------------
CREATE TABLE Prescription (
    prescription_id INT AUTO_INCREMENT PRIMARY KEY,
    pet_id          INT      NOT NULL,
    date_time       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiration_date DATE,
    vet_id          INT      NOT NULL,
    CONSTRAINT fk_presc_pet FOREIGN KEY (pet_id) REFERENCES Pet(pet_id)               ON DELETE CASCADE,
    CONSTRAINT fk_presc_vet FOREIGN KEY (vet_id) REFERENCES Veterinarian(user_id)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- PresMed
-- -------------------------
CREATE TABLE PresMed (
    prescription_id INT         NOT NULL,
    medicine_id     VARCHAR(50) NOT NULL,
    dosage          INT         NOT NULL DEFAULT 1,
    frequency       INT         NOT NULL DEFAULT 1,
    PRIMARY KEY (prescription_id, medicine_id),
    CONSTRAINT fk_presmed_presc FOREIGN KEY (prescription_id) REFERENCES Prescription(prescription_id) ON DELETE CASCADE,
    CONSTRAINT fk_presmed_med   FOREIGN KEY (medicine_id)     REFERENCES Medicine(barcode_no)          ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- Vaccination
-- -------------------------
CREATE TABLE Vaccination (
    vac_id       INT AUTO_INCREMENT PRIMARY KEY,
    vac_date     DATE        NOT NULL,
    next_due_date DATE,
    pet_id       INT         NOT NULL,
    vet_id       INT         NOT NULL,
    barcode_no   VARCHAR(50) NOT NULL,
    CONSTRAINT fk_vac_pet     FOREIGN KEY (pet_id)     REFERENCES Pet(pet_id)               ON DELETE CASCADE,
    CONSTRAINT fk_vac_vet     FOREIGN KEY (vet_id)     REFERENCES Veterinarian(user_id)     ON DELETE CASCADE,
    CONSTRAINT fk_vac_vaccine FOREIGN KEY (barcode_no) REFERENCES Vaccine(barcode_no)       ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- Referral
-- -------------------------
CREATE TABLE Referral (
    referral_id     INT AUTO_INCREMENT PRIMARY KEY,
    reason          TEXT,
    referral_date   DATE NOT NULL,
    status          ENUM('Pending','Accepted','Rejected') NOT NULL DEFAULT 'Pending',
    sender_vet_id   INT NOT NULL,
    receiver_vet_id INT NOT NULL,
    pet_id          INT NOT NULL,
    CONSTRAINT fk_referral_sender   FOREIGN KEY (sender_vet_id)   REFERENCES Veterinarian(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_referral_receiver FOREIGN KEY (receiver_vet_id) REFERENCES Veterinarian(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_referral_pet      FOREIGN KEY (pet_id)          REFERENCES Pet(pet_id)            ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- Evaluation
-- -------------------------
CREATE TABLE Evaluation (
    eval_id  INT AUTO_INCREMENT PRIMARY KEY,
    points   INT  NOT NULL CHECK (points BETWEEN 1 AND 5),
    date     DATE NOT NULL,
    comment  TEXT,
    owner_id INT  NOT NULL,
    vet_id   INT  NOT NULL,
    man_id   INT  NULL,
    CONSTRAINT fk_eval_owner   FOREIGN KEY (owner_id) REFERENCES Pet_Owner(user_id)      ON DELETE CASCADE,
    CONSTRAINT fk_eval_vet     FOREIGN KEY (vet_id)   REFERENCES Veterinarian(user_id)   ON DELETE CASCADE,
    CONSTRAINT fk_eval_manager FOREIGN KEY (man_id)   REFERENCES Clinic_Manager(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- Medical_History
-- -------------------------
CREATE TABLE Medical_History (
    pet_id     INT      NOT NULL,
    date_time  DATETIME NOT NULL,
    diagnosis  TEXT,
    symptoms   TEXT,
    treatments TEXT,
    notes      TEXT,
    PRIMARY KEY (pet_id, date_time),
    CONSTRAINT fk_medhistory_pet FOREIGN KEY (pet_id) REFERENCES Pet(pet_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- BoardingUnit
-- -------------------------
CREATE TABLE BoardingUnit (
    boarding_unit_id INT AUTO_INCREMENT PRIMARY KEY,
    size             ENUM('Small','Medium','Large') NOT NULL,
    is_occupied      BOOLEAN NOT NULL DEFAULT FALSE,
    branch_id        INT     NOT NULL,
    pet_id           INT     NULL,
    CONSTRAINT fk_boarding_branch FOREIGN KEY (branch_id) REFERENCES Branch(branch_id) ON DELETE CASCADE,
    CONSTRAINT fk_boarding_pet    FOREIGN KEY (pet_id)    REFERENCES Pet(pet_id)        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- WasteLog
-- -------------------------
CREATE TABLE WasteLog (
    log_id     INT AUTO_INCREMENT PRIMARY KEY,
    quantity   INT         NOT NULL DEFAULT 0,
    waste_date DATE        NOT NULL,
    reason     TEXT,
    manager_id INT         NOT NULL,
    barcode_no VARCHAR(50) NOT NULL,
    CONSTRAINT fk_waste_manager  FOREIGN KEY (manager_id) REFERENCES Clinic_Manager(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_waste_medicine FOREIGN KEY (barcode_no) REFERENCES Medicine(barcode_no)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
