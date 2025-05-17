-- Ajouter la colonne acces_global_dossiers à la table utilisateur
ALTER TABLE public.utilisateur ADD COLUMN IF NOT EXISTS acces_global_dossiers BOOLEAN DEFAULT FALSE;

-- Vérifier si la table utilisateur_dosssier_autorise existe déjà
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'utilisateur_dosssier_autorise') THEN
        -- Créer la table si elle n'existe pas
        CREATE TABLE public.utilisateur_dosssier_autorise (
            id SERIAL PRIMARY KEY,
            id_utilisateur INTEGER NOT NULL REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE,
            id_dossier INTEGER NOT NULL REFERENCES public.dossier_medical_global(id_dossier) ON DELETE CASCADE,
            date_autorisation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            autorisation_donnee_par INTEGER REFERENCES public.utilisateur(id_utilisateur),
            UNIQUE(id_utilisateur, id_dossier)
        );
        
        -- Ajouter un index pour améliorer les performances des requêtes
        CREATE INDEX idx_utilisateur_dossier ON public.utilisateur_dosssier_autorise(id_utilisateur, id_dossier);
    ELSE
        -- Ajouter les colonnes manquantes si la table existe déjà
        ALTER TABLE public.utilisateur_dosssier_autorise 
        ADD COLUMN IF NOT EXISTS date_autorisation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS autorisation_donnee_par INTEGER REFERENCES public.utilisateur(id_utilisateur);
    END IF;
END $$; 