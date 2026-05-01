-- Performance Indexes for Veterinary Clinic System

-- Appointment lookups
CREATE INDEX idx_appointment_vet_date ON Appointment(vet_id, date_time);
CREATE INDEX idx_appointment_pet      ON Appointment(pet_id);
CREATE INDEX idx_appointment_status   ON Appointment(status);

-- Pet lookups
CREATE INDEX idx_pet_owner ON Pet(owner_id);
CREATE INDEX idx_pet_breed ON Pet(breed);

-- Medical history
CREATE INDEX idx_medical_history_pet ON Medical_History(pet_id);

-- Vaccination
CREATE INDEX idx_vaccination_pet      ON Vaccination(pet_id);
CREATE INDEX idx_vaccination_next_due ON Vaccination(next_due_date);
CREATE INDEX idx_vaccination_vet      ON Vaccination(vet_id);

-- Stock
CREATE INDEX idx_branchstock_branch ON BranchStock(branch_id);
CREATE INDEX idx_branchstock_expiry ON BranchStock(expiration_date);

-- Bills
CREATE INDEX idx_bill_payment_status ON Bill(payment_status);
CREATE INDEX idx_bill_appointment    ON Bill(appointment_id);

-- Prescription
CREATE INDEX idx_prescription_pet ON Prescription(pet_id);
CREATE INDEX idx_prescription_vet ON Prescription(vet_id);

-- Referral
CREATE INDEX idx_referral_pet    ON Referral(pet_id);
CREATE INDEX idx_referral_sender ON Referral(sender_vet_id);

-- Evaluation
CREATE INDEX idx_evaluation_vet ON Evaluation(vet_id);

-- WasteLog
CREATE INDEX idx_wastelog_manager ON WasteLog(manager_id);
CREATE INDEX idx_wastelog_date    ON WasteLog(waste_date);
