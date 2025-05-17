-- Mise à jour du schéma de la table patient
-- Ajouter le champ is_paid pour suivre le statut de paiement des patients

-- Ajouter la colonne is_paid à la table patient s'il n'existe pas déjà
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patient' AND column_name = 'is_paid') THEN
        ALTER TABLE patient ADD COLUMN is_paid BOOLEAN DEFAULT false;
        COMMENT ON COLUMN patient.is_paid IS 'Indique si le patient a payé pour les consultations ou opérations médicales';
    END IF;
END $$;

-- Ajouter un index pour améliorer les performances des requêtes filtrées par statut de paiement
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_patient_is_paid') THEN
        CREATE INDEX idx_patient_is_paid ON patient(is_paid);
    END IF;
END $$;

-- Mettre à jour les enregistrements existants (optionnel)
UPDATE patient SET is_paid = false WHERE is_paid IS NULL; 