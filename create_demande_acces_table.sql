-- Créer le type enum notification_type s'il n'existe pas déjà
CREATE TYPE  public.notification_type AS ENUM ('system', 'demande_acces', 'autre');

-- Créer la table demande_acces_dossier
CREATE TABLE IF NOT EXISTS public.demande_acces_dossier (
    id SERIAL PRIMARY KEY,
    id_utilisateur INTEGER NOT NULL REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE,
    id_dossier INTEGER NOT NULL REFERENCES public.dossier_medical_global(id_dossier) ON DELETE CASCADE,
    date_demande TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    motif TEXT NOT NULL,
    statut VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE', -- EN_ATTENTE, ACCEPTE, REFUSE
    id_admin_traitant INTEGER REFERENCES public.utilisateur(id_utilisateur),
    date_traitement TIMESTAMP,
    commentaire TEXT
);

-- Créer un index unique pour garantir qu'il n'y a pas de doublons pour un utilisateur/dossier en attente
CREATE UNIQUE INDEX IF NOT EXISTS idx_demande_en_attente 
ON public.demande_acces_dossier (id_utilisateur, id_dossier) 
WHERE statut = 'EN_ATTENTE';

-- Créer les autres index pour les performances
CREATE INDEX IF NOT EXISTS idx_demande_acces_utilisateur ON public.demande_acces_dossier(id_utilisateur);
CREATE INDEX IF NOT EXISTS idx_demande_acces_dossier ON public.demande_acces_dossier(id_dossier);
CREATE INDEX IF NOT EXISTS idx_demande_acces_statut ON public.demande_acces_dossier(statut);

-- Ajouter la colonne type à la table notification si elle existe
ALTER TABLE IF EXISTS public.notification ADD COLUMN IF NOT EXISTS type notification_type DEFAULT 'system'; 