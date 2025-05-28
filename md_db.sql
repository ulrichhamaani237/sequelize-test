--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2025-05-20 06:51:16

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 925 (class 1247 OID 98786)
-- Name: notification_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notification_type AS ENUM (
    'system',
    'demande_acces',
    'autre'
);


ALTER TYPE public.notification_type OWNER TO postgres;

--
-- TOC entry 246 (class 1255 OID 24808)
-- Name: donnee_acces_dossier(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.donnee_acces_dossier() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF EXISTS THEN
        INSERT INTO acces_autorise_par_cle_patient (id_patient,id_hopital_autorise,date_autorisation,id_dossier) VALUES
        (2,5,now(),NEW.id_dossier);
    END IF;
END; 
$$;


ALTER FUNCTION public.donnee_acces_dossier() OWNER TO postgres;

--
-- TOC entry 247 (class 1255 OID 24809)
-- Name: modify_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.modify_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.value := NEW.value * 2;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.modify_column() OWNER TO postgres;

--
-- TOC entry 248 (class 1255 OID 24810)
-- Name: notify_consultation(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.notify_consultation() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  PERFORM pg_notify(
    'nouvelle_consultation',
    json_build_object(
      'event', TG_OP,
      'table', TG_TABLE_NAME,
      'data', row_to_json(NEW)
    )::text
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.notify_consultation() OWNER TO postgres;

--
-- TOC entry 249 (class 1255 OID 24811)
-- Name: notify_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.notify_user() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  PERFORM pg_notify(
    'user_notification',
    json_build_object(
      'userId', NEW.id_utilisateur, -- Champ contenant l'ID utilisateur
      'data', json_build_object(
        'type', 'database_change',
        'table', TG_TABLE_NAME,
        'action', TG_OP,
        'record', row_to_json(NEW)
      )
    )::text
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.notify_user() OWNER TO postgres;

--
-- TOC entry 250 (class 1255 OID 24812)
-- Name: temp_notify(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.temp_notify() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  PERFORM pg_notify(
    'multi_user_notification',
    json_build_object(
      'userIds', NEW.recipient_ids,
      'data', json_build_object(
        'type', 'temp_test',
        'content', NEW.message,
        'timestamp', NOW()::timestamp::text
      )
    )::text
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.temp_notify() OWNER TO postgres;

--
-- TOC entry 251 (class 1255 OID 24813)
-- Name: update_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_timestamp() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 217 (class 1259 OID 24814)
-- Name: acces_autorise_par_cle_patient; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.acces_autorise_par_cle_patient (
    id integer NOT NULL,
    id_patient integer,
    id_hopital_autorise integer,
    date_autorisation timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    id_dossier_autorise integer
);


ALTER TABLE public.acces_autorise_par_cle_patient OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 24818)
-- Name: acces_autorise_par_cle_patient_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.acces_autorise_par_cle_patient_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.acces_autorise_par_cle_patient_id_seq OWNER TO postgres;

--
-- TOC entry 5111 (class 0 OID 0)
-- Dependencies: 218
-- Name: acces_autorise_par_cle_patient_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.acces_autorise_par_cle_patient_id_seq OWNED BY public.acces_autorise_par_cle_patient.id;


--
-- TOC entry 241 (class 1259 OID 57797)
-- Name: blockchain_nodes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blockchain_nodes (
    id integer NOT NULL,
    url text NOT NULL,
    node_type text NOT NULL,
    is_active boolean DEFAULT true,
    last_heartbeat timestamp without time zone,
    CONSTRAINT blockchain_nodes_node_type_check CHECK ((node_type = ANY (ARRAY['hopital'::text, 'medecin'::text, 'autre'::text])))
);


ALTER TABLE public.blockchain_nodes OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 57796)
-- Name: blockchain_nodes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.blockchain_nodes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blockchain_nodes_id_seq OWNER TO postgres;

--
-- TOC entry 5112 (class 0 OID 0)
-- Dependencies: 240
-- Name: blockchain_nodes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.blockchain_nodes_id_seq OWNED BY public.blockchain_nodes.id;


--
-- TOC entry 219 (class 1259 OID 24819)
-- Name: consultation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.consultation (
    id_consultation integer NOT NULL,
    id_dossier integer,
    id_utilisateur integer,
    date_consultation timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    detail jsonb
);


ALTER TABLE public.consultation OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 24825)
-- Name: consultation_id_consultation_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.consultation_id_consultation_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.consultation_id_consultation_seq OWNER TO postgres;

--
-- TOC entry 5113 (class 0 OID 0)
-- Dependencies: 220
-- Name: consultation_id_consultation_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.consultation_id_consultation_seq OWNED BY public.consultation.id_consultation;


--
-- TOC entry 245 (class 1259 OID 98757)
-- Name: demande_acces_dossier; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.demande_acces_dossier (
    id integer NOT NULL,
    id_utilisateur integer NOT NULL,
    id_dossier integer NOT NULL,
    date_demande timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    motif text NOT NULL,
    statut character varying(20) DEFAULT 'EN_ATTENTE'::character varying NOT NULL,
    id_admin_traitant integer,
    date_traitement timestamp without time zone,
    commentaire text
);


ALTER TABLE public.demande_acces_dossier OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 98756)
-- Name: demande_acces_dossier_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.demande_acces_dossier_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.demande_acces_dossier_id_seq OWNER TO postgres;

--
-- TOC entry 5114 (class 0 OID 0)
-- Dependencies: 244
-- Name: demande_acces_dossier_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.demande_acces_dossier_id_seq OWNED BY public.demande_acces_dossier.id;


--
-- TOC entry 221 (class 1259 OID 24826)
-- Name: diagnostic; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.diagnostic (
    id_diagnostic integer NOT NULL,
    id_dossier integer,
    id_utilisateur integer,
    date_diagnostic timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    resultats jsonb
);


ALTER TABLE public.diagnostic OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 24832)
-- Name: diagnostic_id_diagnostic_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.diagnostic_id_diagnostic_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.diagnostic_id_diagnostic_seq OWNER TO postgres;

--
-- TOC entry 5115 (class 0 OID 0)
-- Dependencies: 222
-- Name: diagnostic_id_diagnostic_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.diagnostic_id_diagnostic_seq OWNED BY public.diagnostic.id_diagnostic;


--
-- TOC entry 223 (class 1259 OID 24833)
-- Name: dossier_medical_global; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dossier_medical_global (
    id_dossier integer NOT NULL,
    id_patient integer,
    id_hopital integer,
    donnees_medicales jsonb,
    date_creation timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    derniere_modification timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    cle_acces_dossier character(255),
    code character varying
);


ALTER TABLE public.dossier_medical_global OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 24840)
-- Name: dossier_medical_global_id_dossier_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dossier_medical_global_id_dossier_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dossier_medical_global_id_dossier_seq OWNER TO postgres;

--
-- TOC entry 5116 (class 0 OID 0)
-- Dependencies: 224
-- Name: dossier_medical_global_id_dossier_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dossier_medical_global_id_dossier_seq OWNED BY public.dossier_medical_global.id_dossier;


--
-- TOC entry 225 (class 1259 OID 24841)
-- Name: historique_acces_dossier; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.historique_acces_dossier (
    id_log integer NOT NULL,
    id_dossier integer,
    id_utilisateur integer,
    date_acces timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    type_action character varying(50),
    operation_type character varying,
    dossier_username character varying,
    target_type character varying,
    details text,
    signature character varying,
    id_hopital integer NOT NULL
);


ALTER TABLE public.historique_acces_dossier OWNER TO postgres;

--
-- TOC entry 5117 (class 0 OID 0)
-- Dependencies: 225
-- Name: COLUMN historique_acces_dossier.target_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.historique_acces_dossier.target_type IS 'target_type';


--
-- TOC entry 5118 (class 0 OID 0)
-- Dependencies: 225
-- Name: COLUMN historique_acces_dossier.signature; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.historique_acces_dossier.signature IS 'signature';


--
-- TOC entry 226 (class 1259 OID 24847)
-- Name: historique_acces_dossier_id_log_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.historique_acces_dossier_id_log_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.historique_acces_dossier_id_log_seq OWNER TO postgres;

--
-- TOC entry 5119 (class 0 OID 0)
-- Dependencies: 226
-- Name: historique_acces_dossier_id_log_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.historique_acces_dossier_id_log_seq OWNED BY public.historique_acces_dossier.id_log;


--
-- TOC entry 227 (class 1259 OID 24848)
-- Name: hopital; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hopital (
    id_hopital integer NOT NULL,
    nom character varying(255) NOT NULL,
    adresse text,
    politique_gestion text,
    blockchain_node_url character varying,
    admin_public_key text,
    is_node_active boolean
);


ALTER TABLE public.hopital OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 24853)
-- Name: hopital_id_hopital_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hopital_id_hopital_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hopital_id_hopital_seq OWNER TO postgres;

--
-- TOC entry 5120 (class 0 OID 0)
-- Dependencies: 228
-- Name: hopital_id_hopital_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hopital_id_hopital_seq OWNED BY public.hopital.id_hopital;


--
-- TOC entry 239 (class 1259 OID 25028)
-- Name: notification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification (
    id integer NOT NULL,
    id_utilisateur integer NOT NULL,
    message character varying(100) NOT NULL,
    create_time date,
    type character varying(255),
    read boolean DEFAULT false
);


ALTER TABLE public.notification OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 25027)
-- Name: notification_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.notification ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.notification_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 229 (class 1259 OID 24858)
-- Name: patient; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.patient (
    id_patient integer NOT NULL,
    nom character varying(100),
    prenom character varying(100),
    date_naissance date,
    nom_tuteur character varying(100),
    id_hopital integer,
    adresse character(90),
    donnees jsonb,
    code character(10),
    sexe character(50),
    taille double precision,
    age integer,
    photo character varying(255),
    public_key text,
    shared_key text,
    password character varying(255),
    tel character varying(255),
    token character varying(255),
    email character varying(255),
    is_paid boolean DEFAULT false
);


ALTER TABLE public.patient OWNER TO postgres;

--
-- TOC entry 5121 (class 0 OID 0)
-- Dependencies: 229
-- Name: COLUMN patient.is_paid; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.patient.is_paid IS 'Indique si le patient a payé pour les consultations ou opérations médicales';


--
-- TOC entry 230 (class 1259 OID 24863)
-- Name: patient_id_patient_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.patient_id_patient_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.patient_id_patient_seq OWNER TO postgres;

--
-- TOC entry 5122 (class 0 OID 0)
-- Dependencies: 230
-- Name: patient_id_patient_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.patient_id_patient_seq OWNED BY public.patient.id_patient;


--
-- TOC entry 231 (class 1259 OID 24864)
-- Name: prescription; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prescription (
    id_prescription integer NOT NULL,
    id_dossier integer,
    id_utilisateur integer,
    date_prescription timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    medicaments jsonb
);


ALTER TABLE public.prescription OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 24870)
-- Name: prescription_id_prescription_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.prescription_id_prescription_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.prescription_id_prescription_seq OWNER TO postgres;

--
-- TOC entry 5123 (class 0 OID 0)
-- Dependencies: 232
-- Name: prescription_id_prescription_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.prescription_id_prescription_seq OWNED BY public.prescription.id_prescription;


--
-- TOC entry 233 (class 1259 OID 24871)
-- Name: traitement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.traitement (
    id_traitement integer NOT NULL,
    id_dossier integer,
    id_utilisateur integer,
    date_traitement timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    details jsonb
);


ALTER TABLE public.traitement OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 24877)
-- Name: traitement_id_traitement_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.traitement_id_traitement_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.traitement_id_traitement_seq OWNER TO postgres;

--
-- TOC entry 5124 (class 0 OID 0)
-- Dependencies: 234
-- Name: traitement_id_traitement_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.traitement_id_traitement_seq OWNED BY public.traitement.id_traitement;


--
-- TOC entry 235 (class 1259 OID 24878)
-- Name: utilisateur; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.utilisateur (
    id_utilisateur integer NOT NULL,
    nom character varying(100) NOT NULL,
    prenom character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    mot_de_passe_hash text NOT NULL,
    role character varying(50) NOT NULL,
    id_hopital integer,
    cle_publique text,
    autre_donnees jsonb,
    token character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    adresse character varying(255),
    cle_prive character varying,
    code character varying,
    blockchain_node_url text,
    blockchain_node_url_private text,
    node_active boolean,
    last_block_synced_at timestamp without time zone,
    is_not_active boolean DEFAULT false,
    specialite character varying,
    sexe character varying,
    access_record boolean DEFAULT true
);


ALTER TABLE public.utilisateur OWNER TO postgres;

--
-- TOC entry 5125 (class 0 OID 0)
-- Dependencies: 235
-- Name: COLUMN utilisateur.code; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.utilisateur.code IS 'code';


--
-- TOC entry 5126 (class 0 OID 0)
-- Dependencies: 235
-- Name: COLUMN utilisateur.sexe; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.utilisateur.sexe IS 'Sexe du personnel';


--
-- TOC entry 5127 (class 0 OID 0)
-- Dependencies: 235
-- Name: COLUMN utilisateur.access_record; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.utilisateur.access_record IS 'access_record';


--
-- TOC entry 243 (class 1259 OID 74182)
-- Name: utilisateur_dosssier_autorise; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.utilisateur_dosssier_autorise (
    id integer NOT NULL,
    id_utilisateur integer NOT NULL,
    id_dossier integer NOT NULL,
    autorisation_donnee_par integer,
    date_autorisation date
);


ALTER TABLE public.utilisateur_dosssier_autorise OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 74181)
-- Name: utilisateur_dosssier_autorise_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.utilisateur_dosssier_autorise_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.utilisateur_dosssier_autorise_id_seq OWNER TO postgres;

--
-- TOC entry 5128 (class 0 OID 0)
-- Dependencies: 242
-- Name: utilisateur_dosssier_autorise_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.utilisateur_dosssier_autorise_id_seq OWNED BY public.utilisateur_dosssier_autorise.id;


--
-- TOC entry 236 (class 1259 OID 24885)
-- Name: utilisateur_id_utilisateur_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.utilisateur_id_utilisateur_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.utilisateur_id_utilisateur_seq OWNER TO postgres;

--
-- TOC entry 5129 (class 0 OID 0)
-- Dependencies: 236
-- Name: utilisateur_id_utilisateur_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.utilisateur_id_utilisateur_seq OWNED BY public.utilisateur.id_utilisateur;


--
-- TOC entry 237 (class 1259 OID 24886)
-- Name: v_dossiers_etrangers_par_hopital; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_dossiers_etrangers_par_hopital AS
 SELECT d.id_dossier,
    d.id_patient,
    d.id_hopital AS hopital_origine,
    h1.nom AS nom_hopital_origine,
    h2.id_hopital AS hopital_ayant_acces,
    h2.nom AS nom_hopital_ayant_acces,
    p.nom AS nom_patient,
    p.prenom,
    d.donnees_medicales,
    d.date_creation
   FROM ((((public.acces_autorise_par_cle_patient a
     JOIN public.patient p ON ((a.id_patient = p.id_patient)))
     JOIN public.dossier_medical_global d ON ((d.id_patient = p.id_patient)))
     JOIN public.hopital h1 ON ((h1.id_hopital = d.id_hopital)))
     JOIN public.hopital h2 ON ((h2.id_hopital = a.id_hopital_autorise)));


ALTER VIEW public.v_dossiers_etrangers_par_hopital OWNER TO postgres;

--
-- TOC entry 4820 (class 2604 OID 24891)
-- Name: acces_autorise_par_cle_patient id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acces_autorise_par_cle_patient ALTER COLUMN id SET DEFAULT nextval('public.acces_autorise_par_cle_patient_id_seq'::regclass);


--
-- TOC entry 4844 (class 2604 OID 57800)
-- Name: blockchain_nodes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blockchain_nodes ALTER COLUMN id SET DEFAULT nextval('public.blockchain_nodes_id_seq'::regclass);


--
-- TOC entry 4822 (class 2604 OID 24892)
-- Name: consultation id_consultation; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultation ALTER COLUMN id_consultation SET DEFAULT nextval('public.consultation_id_consultation_seq'::regclass);


--
-- TOC entry 4847 (class 2604 OID 98760)
-- Name: demande_acces_dossier id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.demande_acces_dossier ALTER COLUMN id SET DEFAULT nextval('public.demande_acces_dossier_id_seq'::regclass);


--
-- TOC entry 4824 (class 2604 OID 24893)
-- Name: diagnostic id_diagnostic; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diagnostic ALTER COLUMN id_diagnostic SET DEFAULT nextval('public.diagnostic_id_diagnostic_seq'::regclass);


--
-- TOC entry 4826 (class 2604 OID 24894)
-- Name: dossier_medical_global id_dossier; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dossier_medical_global ALTER COLUMN id_dossier SET DEFAULT nextval('public.dossier_medical_global_id_dossier_seq'::regclass);


--
-- TOC entry 4829 (class 2604 OID 24895)
-- Name: historique_acces_dossier id_log; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historique_acces_dossier ALTER COLUMN id_log SET DEFAULT nextval('public.historique_acces_dossier_id_log_seq'::regclass);


--
-- TOC entry 4831 (class 2604 OID 24896)
-- Name: hopital id_hopital; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hopital ALTER COLUMN id_hopital SET DEFAULT nextval('public.hopital_id_hopital_seq'::regclass);


--
-- TOC entry 4832 (class 2604 OID 24898)
-- Name: patient id_patient; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient ALTER COLUMN id_patient SET DEFAULT nextval('public.patient_id_patient_seq'::regclass);


--
-- TOC entry 4834 (class 2604 OID 24899)
-- Name: prescription id_prescription; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescription ALTER COLUMN id_prescription SET DEFAULT nextval('public.prescription_id_prescription_seq'::regclass);


--
-- TOC entry 4836 (class 2604 OID 24900)
-- Name: traitement id_traitement; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.traitement ALTER COLUMN id_traitement SET DEFAULT nextval('public.traitement_id_traitement_seq'::regclass);


--
-- TOC entry 4838 (class 2604 OID 24901)
-- Name: utilisateur id_utilisateur; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilisateur ALTER COLUMN id_utilisateur SET DEFAULT nextval('public.utilisateur_id_utilisateur_seq'::regclass);


--
-- TOC entry 4846 (class 2604 OID 74185)
-- Name: utilisateur_dosssier_autorise id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilisateur_dosssier_autorise ALTER COLUMN id SET DEFAULT nextval('public.utilisateur_dosssier_autorise_id_seq'::regclass);


--
-- TOC entry 5078 (class 0 OID 24814)
-- Dependencies: 217
-- Data for Name: acces_autorise_par_cle_patient; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.acces_autorise_par_cle_patient (id, id_patient, id_hopital_autorise, date_autorisation, id_dossier_autorise) FROM stdin;
22	1164	148	2025-05-17 08:35:26.988	1150
\.


--
-- TOC entry 5101 (class 0 OID 57797)
-- Dependencies: 241
-- Data for Name: blockchain_nodes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.blockchain_nodes (id, url, node_type, is_active, last_heartbeat) FROM stdin;
\.


--
-- TOC entry 5080 (class 0 OID 24819)
-- Dependencies: 219
-- Data for Name: consultation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.consultation (id_consultation, id_dossier, id_utilisateur, date_consultation, detail) FROM stdin;
101	1148	183	2025-05-11 11:52:36.859	{"motif": ""}
103	1150	184	2025-05-12 09:49:27.887	{"motif": "", "date_creation": "2025-05-12T08:49:27.887Z"}
104	1151	184	2025-05-12 10:50:24.934	{"motif": "", "date_creation": "2025-05-12T09:50:24.916Z"}
\.


--
-- TOC entry 5105 (class 0 OID 98757)
-- Dependencies: 245
-- Data for Name: demande_acces_dossier; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.demande_acces_dossier (id, id_utilisateur, id_dossier, date_demande, motif, statut, id_admin_traitant, date_traitement, commentaire) FROM stdin;
1	184	1153	2025-05-19 22:21:28.066522	Motif de la demande	accepter	183	2025-05-19 23:01:12.475972	commentaire
\.


--
-- TOC entry 5082 (class 0 OID 24826)
-- Dependencies: 221
-- Data for Name: diagnostic; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.diagnostic (id_diagnostic, id_dossier, id_utilisateur, date_diagnostic, resultats) FROM stdin;
\.


--
-- TOC entry 5084 (class 0 OID 24833)
-- Dependencies: 223
-- Data for Name: dossier_medical_global; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dossier_medical_global (id_dossier, id_patient, id_hopital, donnees_medicales, date_creation, derniere_modification, cle_acces_dossier, code) FROM stdin;
1152	1167	147	\N	2025-05-16 08:39:52.882606	2025-05-16 08:39:52.882606	\N	\N
1150	1164	148	\N	2025-05-12 09:49:27.874	2025-05-12 09:49:27.876021	\N	\N
1153	1168	147	\N	2025-05-16 08:48:24.472325	2025-05-16 08:48:24.472325	\N	\N
1155	1170	148	{"poid": "68", "groupe": "B+", "glisemy": "1.35", "tension": "14.5", "allergie": "ros", "id_hopital": "148", "antecedants": "Too offer worker key.", "temperature": "37.5", "date_creation": "2025-05-17T08:10:06.958Z", "cle_acces_dossier": "e27fcd8a3280", "saturation_oxygene": "90", "tension_arterielle": "99/60"}	2025-05-17 09:10:19.936	2025-05-17 09:10:19.936	e27fcd8a3280                                                                                                                                                                                                                                                   	\N
1151	1165	148	\N	2025-05-12 10:50:24.901	2025-05-12 10:50:24.902431	\N	\N
1148	1162	148	\N	2025-05-11 11:52:36.847	2025-05-11 11:52:36.847812	\N	\N
\.


--
-- TOC entry 5086 (class 0 OID 24841)
-- Dependencies: 225
-- Data for Name: historique_acces_dossier; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.historique_acces_dossier (id_log, id_dossier, id_utilisateur, date_acces, type_action, operation_type, dossier_username, target_type, details, signature, id_hopital) FROM stdin;
\.


--
-- TOC entry 5088 (class 0 OID 24848)
-- Dependencies: 227
-- Data for Name: hopital; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hopital (id_hopital, nom, adresse, politique_gestion, blockchain_node_url, admin_public_key, is_node_active) FROM stdin;
144	Hopital A	123 Rue de l'Hopital	Donnees supplementaires	http://localhost:5000	\N	\N
145	Hopital B	123 Rue de l'Hopital B	Donnees supplementaires	http://localhost:5001	\N	\N
146	Hopital C	123 Rue de l'Hopital V	Donnees supplementaires	http://localhost:5002	\N	\N
147	Hopital C	123 Rue de l'Hopital V	Donnees supplementaires	http://localhost:5003	\N	\N
148	Hopitale Marine	lair	\N	http://localhost:5004	\N	\N
\.


--
-- TOC entry 5099 (class 0 OID 25028)
-- Dependencies: 239
-- Data for Name: notification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification (id, id_utilisateur, message, create_time, type, read) FROM stdin;
3666	183	le dossier medicale de jean rose a ete consulter par marina 	2025-05-11	system	f
3667	183	le dossier medicale de jean rose a ete consulter par marina 	2025-05-11	system	f
3668	183	le dossier medicale de jeanp Doemon a ete consulter par marina 	2025-05-15	system	f
3669	183	le dossier medicale de jeanp Doemon a ete consulter par marina 	2025-05-15	system	f
3670	184	le dossier medicale de jeanp Doemon a ete consulter par marina 	2025-05-15	system	f
3671	185	le dossier medicale de jeanp Doemon a ete consulter par marina 	2025-05-15	system	f
3672	184	le dossier medicale de jeanp Doemon a ete consulter par marina 	2025-05-15	system	f
3673	185	le dossier medicale de jeanp Doemon a ete consulter par marina 	2025-05-15	system	f
3674	183	le dossier medicale de hamaani ulrich a ete consulter par marina 	2025-05-16	system	f
3675	184	le dossier medicale de hamaani ulrich a ete consulter par marina 	2025-05-16	system	f
3676	185	le dossier medicale de hamaani ulrich a ete consulter par marina 	2025-05-16	system	f
3677	183	le dossier medicale de hamaani ulrich a ete consulter par marina 	2025-05-16	system	f
3678	184	le dossier medicale de hamaani ulrich a ete consulter par marina 	2025-05-16	system	f
3679	185	le dossier medicale de hamaani ulrich a ete consulter par marina 	2025-05-16	system	f
3681	183	le dossier medicale de ramses roi a ete consulter par marina 	2025-05-17	system	f
3680	183	le dossier medicale de ramses roi a ete consulter par marina 	2025-05-17	system	f
3682	184	le dossier medicale de ramses roi a ete consulter par marina 	2025-05-17	system	f
3683	185	le dossier medicale de ramses roi a ete consulter par marina 	2025-05-17	system	f
3684	184	le dossier medicale de ramses roi a ete consulter par marina 	2025-05-17	system	f
3685	185	le dossier medicale de ramses roi a ete consulter par marina 	2025-05-17	system	f
3686	183	le dossier medicale de jeanp Doemon a ete consulter par marina 	2025-05-17	system	f
3687	184	le dossier medicale de jeanp Doemon a ete consulter par marina 	2025-05-17	system	f
3688	185	le dossier medicale de jeanp Doemon a ete consulter par marina 	2025-05-17	system	f
3695	183	le dossier medicale de hamaani ulrich a ete consulter par marina 	2025-05-17	system	f
3696	184	le dossier medicale de hamaani ulrich a ete consulter par marina 	2025-05-17	system	f
3697	185	le dossier medicale de hamaani ulrich a ete consulter par marina 	2025-05-17	system	f
3689	183	le dossier medicale de jeanp Doemon a ete consulter par marina 	2025-05-17	system	f
3690	184	le dossier medicale de jeanp Doemon a ete consulter par marina 	2025-05-17	system	f
3691	185	le dossier medicale de jeanp Doemon a ete consulter par marina 	2025-05-17	system	f
3692	183	le dossier medicale de hamaani ulrich a ete consulter par marina 	2025-05-17	system	f
3693	184	le dossier medicale de hamaani ulrich a ete consulter par marina 	2025-05-17	system	f
3694	185	le dossier medicale de hamaani ulrich a ete consulter par marina 	2025-05-17	system	f
3698	183	le dossier medicale de hamaani ulrich a ete consulter par marina 	2025-05-17	system	f
3699	184	le dossier medicale de hamaani ulrich a ete consulter par marina 	2025-05-17	system	f
3700	185	le dossier medicale de hamaani ulrich a ete consulter par marina 	2025-05-17	system	f
3701	183	le dossier medicale de hamaani ulrich a ete consulter par marina 	2025-05-17	system	f
3702	184	le dossier medicale de hamaani ulrich a ete consulter par marina 	2025-05-17	system	f
3703	185	le dossier medicale de hamaani ulrich a ete consulter par marina 	2025-05-17	system	f
3704	183	le dossier medicale de ramses roi a ete consulter par marina 	2025-05-17	system	f
3705	184	le dossier medicale de ramses roi a ete consulter par marina 	2025-05-17	system	f
3706	185	le dossier medicale de ramses roi a ete consulter par marina 	2025-05-17	system	f
3707	183	le dossier medicale de ramses roi a ete consulter par marina 	2025-05-17	system	f
3708	184	le dossier medicale de ramses roi a ete consulter par marina 	2025-05-17	system	f
3709	185	le dossier medicale de ramses roi a ete consulter par marina 	2025-05-17	system	f
3710	183	le dossier medicale de jeanp Doemon a ete consulter par marina 	2025-05-17	system	f
3711	183	le dossier medicale de jeanp Doemon a ete consulter par marina 	2025-05-17	system	f
3712	184	le dossier medicale de jeanp Doemon a ete consulter par marina 	2025-05-17	system	f
3713	184	le dossier medicale de jeanp Doemon a ete consulter par marina 	2025-05-17	system	f
3714	185	le dossier medicale de jeanp Doemon a ete consulter par marina 	2025-05-17	system	f
3715	185	le dossier medicale de jeanp Doemon a ete consulter par marina 	2025-05-17	system	f
3716	183	le dossier medicale de jeanp Doemon a ete consulter par marina 	2025-05-17	system	f
3717	184	le dossier medicale de jeanp Doemon a ete consulter par marina 	2025-05-17	system	f
3718	185	le dossier medicale de jeanp Doemon a ete consulter par marina 	2025-05-17	system	f
3719	183	le dossier medicale de jeanp Doemon a ete consulter par marina 	2025-05-17	system	f
3720	184	le dossier medicale de jeanp Doemon a ete consulter par marina 	2025-05-17	system	f
3721	185	le dossier medicale de jeanp Doemon a ete consulter par marina 	2025-05-17	system	f
3722	183	Doe4 John4 demande l'accès au dossier de oumair samire	\N	demande_acces	f
3723	184	Doe4 John4 demande l'accès au dossier de oumair samire	\N	demande_acces	f
3724	184	Votre demande d'accès au dossier de oumair samire a été acceptée. Commentaire: commentaire	\N	demande_acces	f
\.


--
-- TOC entry 5090 (class 0 OID 24858)
-- Dependencies: 229
-- Data for Name: patient; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.patient (id_patient, nom, prenom, date_naissance, nom_tuteur, id_hopital, adresse, donnees, code, sexe, taille, age, photo, public_key, shared_key, password, tel, token, email, is_paid) FROM stdin;
1168	samire	oumair	2025-05-24	dontsop ulrich nguegang	147	yaounde                                                                                   	\N	\N	M                                                 	4000	20	{}	\N	\N	$2b$10$VPTnbEYk1hWFNcr/F2v16OgVkk647SmG67UwmUnlqCPvhQ69nMkai	620410548	\N	patrice9@gmail.com	t
1167	hamaani geremi moi	ulrich	2025-05-11	ulrich hamaani hamaani	147	mimboman                                                                                  	\N	\N	M                                                 	3000	70	{}	\N	\N	$2b$10$tmvGpq7usEfO8kgNeTbb1O.JIt3.jjk.rjx2C7/sbIyDRYsX6kpUK	62041054	\N	haman@gmail.com	f
1165	marcel	samia	2004-01-01	Tuteur2	148	123 Rue de l'Hopital V                                                                    	\N	\N	Masculin                                          	180	18	photo2.jpg	\N	\N	\N	+237 620410454	\N	\N	f
1162	hamaani	ulrich	2025-05-11	piere	148	mimboman                                                                                  	\N	\N	F                                                 	300	39		\N	\N	\N	\N	\N	\N	t
1166	marcel	samia	2004-01-01	Tuteur2	148	123 Rue de l'Hopital V                                                                    	\N	\N	Masculin                                          	180	18	photo2.jpg	\N	\N	$2b$10$7iQx8yXvFqo2lsC.kA9KYeCMPrnpU9XlMeb0hu0ul6i9B5RN5i8wC	+237620410454	\N	ulrichhaman@gmail.com	f
1164	jeanp	Doemon	2000-01-01	Tuteur2	148	123 Rue de l'Hopital V                                                                    	\N	\N	Masculin                                          	180	25	photo2.jpg	\N	\N	\N	+237 620410454	\N	\N	f
1170	ramses	roi	1970-01-01	pierre ramses	148	\N	\N	NJ0O0M3C  	F                                                 	2	50	\N	\N	\N	\N	\N	\N	\N	f
\.


--
-- TOC entry 5092 (class 0 OID 24864)
-- Dependencies: 231
-- Data for Name: prescription; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prescription (id_prescription, id_dossier, id_utilisateur, date_prescription, medicaments) FROM stdin;
\.


--
-- TOC entry 5094 (class 0 OID 24871)
-- Dependencies: 233
-- Data for Name: traitement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.traitement (id_traitement, id_dossier, id_utilisateur, date_traitement, details) FROM stdin;
\.


--
-- TOC entry 5096 (class 0 OID 24878)
-- Dependencies: 235
-- Data for Name: utilisateur; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.utilisateur (id_utilisateur, nom, prenom, email, mot_de_passe_hash, role, id_hopital, cle_publique, autre_donnees, token, created_at, updated_at, adresse, cle_prive, code, blockchain_node_url, blockchain_node_url_private, node_active, last_block_synced_at, is_not_active, specialite, sexe, access_record) FROM stdin;
181	John	Doe	john@example.com	$2b$10$ADI5pZeNReuBrN42770Yv.iM6SE1aosdR2Q/m9yp1UXqUfjEwINMG	medecin	147	04075306915816c5d62b781b5cd2b6f972124643d30cb6f3dbd1e7b21ddb56a7653be49539e1d6ec78932c3398c97b317e1f5448542368bb52700b9dddf3fc929e	{"test": "Donnees supplementaires"}	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91dGlsaXNhdGV1ciI6MTgxLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJyb2xlIjoibWVkZWNpbiIsImlhdCI6MTc0Njk1MTA3MiwiZXhwIjoxNzQ5NTQzMDcyfQ.CbaItnh6pPBjtNhmu_-9QfIO0zduFzw4jqn9_fz9o3o	2025-05-11 09:11:01.649542	2025-05-11 09:11:12.305341	\N	e553a10d641d109e46abdbfbe8e1b710:b25b570ecdb66eb31931bcd80d75c640:83b2a5b925e6d3a6569f8d036873229fc29664650fc21ba01113548eb5b3080dcc7198c9a0dbbfe899e13445e51039752750a84331deb20383e6012953c3dd42980c76f6de4728ccf7b6215bf983e01e	\N	http://localhost:5003	\N	\N	\N	f	\N	\N	t
183	marina		marina@gmail.com	$2b$10$TTgZ5IhLEbncDGBKCrgtb.c6WW2tXXSu4dqjts5lfpuolkH7Ddilm	admin	148	0419a5b5a245ca5e4a505b100b44eeff4cc0d3e2bbeb07dbc98aef70b012fd99df421e21976226e491456bd31976f71e241819e9af722c4eb7e4f93daf893c7b56	{"": ""}	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91dGlsaXNhdGV1ciI6MTgzLCJlbWFpbCI6Im1hcmluYUBnbWFpbCIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc0Njk1NzA2MCwiZXhwIjoxNzQ5NTQ5MDYwfQ.mt-scQ4ZSE6XS44Fta41_OKZZ8JhaNg-TPngKX6x2no	2025-05-11 10:51:00.592942	2025-05-11 10:52:35.796857	\N	85770c30b218d8475419c6330556ec97:843a1492a26b12bca225cb7da99aa662:499a3f197bf7f8cb0e07db1fb69a902eaf1edaac7c1d68e20fb6d482e319d9494a41bcb8935b7ebdd3c0a418358aa59022de1600e51779bea8e5c5e406cd3dd03f82423a427a96001c278683bf5156a0	\N	http://localhost:5004	\N	\N	\N	f	\N	\N	t
185	komo	marie	komomarie@gmail.com	$2b$10$Wudarn8jVFVUTbouH44dd.cDLkqVkZgr.07ZRhKocrUeVnHN35jTi	Infirmier	148	\N	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91dGlsaXNhdGV1ciI6MTg1LCJlbWFpbCI6ImtvbW9tYXJpZUBnbWFpbC5jb20iLCJyb2xlIjoiSW5maXJtaWVyIiwiaWF0IjoxNzQ3MzA2MDY5LCJleHAiOjE3NDgxNzAwNjl9.KmVGyf349vuixRDqiNV4O8Hx0HZv22nfO2rSOjoG-ws	2025-05-15 11:47:19.125297	2025-05-15 11:47:49.526042	\N	\N	\N	\N	\N	\N	\N	f	cardiograhe	F	t
186	papi	shop	papishop@example.com	$2b$10$WXotPECVfV8s37giXns45eVAc4jd1oAjDCImw3BVpMY.2cMWjacE.	medecin	147	\N	\N	\N	2025-05-19 21:27:52.840275	2025-05-19 21:27:52.840275	\N	\N	\N	\N	\N	\N	\N	f	Medecin	Masculin	t
187	mario	samain	mario@example.com	$2b$10$.bkUu7GXQLaA1LM7c/rrmubfPe.Y.68JcmlLiYqxmaxSkcV813Z/u	infirmier	147	\N	\N	\N	2025-05-19 22:03:34.174875	2025-05-19 22:03:34.174875	\N	\N	\N	\N	\N	\N	\N	f	infirmier	Masculin	f
182	John2	Doe2	john2@example.com	$2b$10$TYkcEjt/rLJQd7PKzR0W2uDnhnBFj0Iqovw9TIyv/RAAJHhgXrTIq	medecin	147	04ac4a4e42686980b24ec96ae1206c29b9417cb88711699dffabdec590014bcafadbe3dffd6afc9833f75ccb6d47193d7ffd9dbe1bd760f57dda71a5f9cbe4b7f1	{"info": "autre donnzz"}	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91dGlsaXNhdGV1ciI6MTgyLCJlbWFpbCI6ImpvaG4yQGV4YW1wbGUuY29tIiwicm9sZSI6Im1lZGVjaW4iLCJpYXQiOjE3NDY5NTExOTYsImV4cCI6MTc0OTU0MzE5Nn0.AzQRqAodqEGK8Snmr94MZ0JQUf0hMZlRm8qrjs41QsE	2025-05-11 09:13:16.46529	2025-05-11 09:13:16.502401	\N	a1bce27a1d1896ec7b46dc7b994e8ab1:9eec17f06f3674d8c1bcaa3c8f9116e7:29735312c1b7e15b66780fe72a61cde98036d8a2e2065eff50aebf61b171fa5247f67b4f0d549c85bf7e4ff2de5859f0f32416151cf294b947c48c3563c316b63af6bc22d212bfe6c031f64c984d3e72	\N	http://localhost:5003	\N	\N	\N	f	\N	\N	t
184	ulrich	soro	sroo2@example.com	$2b$10$UMNllaTx4cyq8KOnlAlZXud7kEjnrv.DOftTff5xUFLTb1fl2en1q	infirmier	148	047e0844fbc90d329161db20028345ea99c58dc868ba29bc38f3b78836a7fede2f4bfc832780a73be1f70bd8157a48313de7e9e8897d7eab561e38d487f4ed389d	{"info": "autre donnzz"}	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91dGlsaXNhdGV1ciI6MTg0LCJlbWFpbCI6ImpvaG40QGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3MDM5NTM4LCJleHAiOjE3NDk2MzE1Mzh9.zmz0fYfGilDoDpcFzx420x_ahaap-cP2Xhn7-kJrJNE	2025-05-12 09:45:38.794963	2025-05-19 22:30:27.797088	\N	cac09f2384eb153d6195f596b45b73ea:159bd6fe431f2801d305bda1aec4e980:6eb8a0d0eeade5aa56c26e14cdd97cdb58469bceeaf02989de9bad4b7a0e2bad7b9ae85a4561fd40482c529e44580dc68783a5d35e24f7749bcea4d39da4d765205c8a073dfb7387bcc8fbd6aa467dc2	\N	http://localhost:5004	\N	\N	\N	f	infirmier	Masculin	t
\.


--
-- TOC entry 5103 (class 0 OID 74182)
-- Dependencies: 243
-- Data for Name: utilisateur_dosssier_autorise; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.utilisateur_dosssier_autorise (id, id_utilisateur, id_dossier, autorisation_donnee_par, date_autorisation) FROM stdin;
2	184	1155	147	\N
3	184	1153	147	\N
\.


--
-- TOC entry 5130 (class 0 OID 0)
-- Dependencies: 218
-- Name: acces_autorise_par_cle_patient_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.acces_autorise_par_cle_patient_id_seq', 22, true);


--
-- TOC entry 5131 (class 0 OID 0)
-- Dependencies: 240
-- Name: blockchain_nodes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.blockchain_nodes_id_seq', 1, false);


--
-- TOC entry 5132 (class 0 OID 0)
-- Dependencies: 220
-- Name: consultation_id_consultation_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.consultation_id_consultation_seq', 104, true);


--
-- TOC entry 5133 (class 0 OID 0)
-- Dependencies: 244
-- Name: demande_acces_dossier_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.demande_acces_dossier_id_seq', 1, true);


--
-- TOC entry 5134 (class 0 OID 0)
-- Dependencies: 222
-- Name: diagnostic_id_diagnostic_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.diagnostic_id_diagnostic_seq', 1, false);


--
-- TOC entry 5135 (class 0 OID 0)
-- Dependencies: 224
-- Name: dossier_medical_global_id_dossier_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dossier_medical_global_id_dossier_seq', 1155, true);


--
-- TOC entry 5136 (class 0 OID 0)
-- Dependencies: 226
-- Name: historique_acces_dossier_id_log_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.historique_acces_dossier_id_log_seq', 30, true);


--
-- TOC entry 5137 (class 0 OID 0)
-- Dependencies: 228
-- Name: hopital_id_hopital_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hopital_id_hopital_seq', 148, true);


--
-- TOC entry 5138 (class 0 OID 0)
-- Dependencies: 238
-- Name: notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notification_id_seq', 3724, true);


--
-- TOC entry 5139 (class 0 OID 0)
-- Dependencies: 230
-- Name: patient_id_patient_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.patient_id_patient_seq', 1170, true);


--
-- TOC entry 5140 (class 0 OID 0)
-- Dependencies: 232
-- Name: prescription_id_prescription_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.prescription_id_prescription_seq', 1, false);


--
-- TOC entry 5141 (class 0 OID 0)
-- Dependencies: 234
-- Name: traitement_id_traitement_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.traitement_id_traitement_seq', 3, true);


--
-- TOC entry 5142 (class 0 OID 0)
-- Dependencies: 242
-- Name: utilisateur_dosssier_autorise_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.utilisateur_dosssier_autorise_id_seq', 3, true);


--
-- TOC entry 5143 (class 0 OID 0)
-- Dependencies: 236
-- Name: utilisateur_id_utilisateur_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.utilisateur_id_utilisateur_seq', 187, true);


--
-- TOC entry 4852 (class 2606 OID 24903)
-- Name: acces_autorise_par_cle_patient acces_autorise_par_cle_patient_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acces_autorise_par_cle_patient
    ADD CONSTRAINT acces_autorise_par_cle_patient_pkey PRIMARY KEY (id);


--
-- TOC entry 4893 (class 2606 OID 57806)
-- Name: blockchain_nodes blockchain_nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blockchain_nodes
    ADD CONSTRAINT blockchain_nodes_pkey PRIMARY KEY (id);


--
-- TOC entry 4895 (class 2606 OID 57808)
-- Name: blockchain_nodes blockchain_nodes_url_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blockchain_nodes
    ADD CONSTRAINT blockchain_nodes_url_key UNIQUE (url);


--
-- TOC entry 4860 (class 2606 OID 24905)
-- Name: dossier_medical_global cle_acces_dossier; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dossier_medical_global
    ADD CONSTRAINT cle_acces_dossier UNIQUE (cle_acces_dossier);


--
-- TOC entry 4872 (class 2606 OID 24907)
-- Name: patient code; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient
    ADD CONSTRAINT code UNIQUE (code) INCLUDE (code);


--
-- TOC entry 4854 (class 2606 OID 24909)
-- Name: consultation consultation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultation
    ADD CONSTRAINT consultation_pkey PRIMARY KEY (id_consultation);


--
-- TOC entry 4899 (class 2606 OID 98766)
-- Name: demande_acces_dossier demande_acces_dossier_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.demande_acces_dossier
    ADD CONSTRAINT demande_acces_dossier_pkey PRIMARY KEY (id);


--
-- TOC entry 4857 (class 2606 OID 24911)
-- Name: diagnostic diagnostic_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diagnostic
    ADD CONSTRAINT diagnostic_pkey PRIMARY KEY (id_diagnostic);


--
-- TOC entry 4862 (class 2606 OID 41415)
-- Name: dossier_medical_global dossier_medical_global_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dossier_medical_global
    ADD CONSTRAINT dossier_medical_global_code_key UNIQUE (code);


--
-- TOC entry 4864 (class 2606 OID 24913)
-- Name: dossier_medical_global dossier_medical_global_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dossier_medical_global
    ADD CONSTRAINT dossier_medical_global_pkey PRIMARY KEY (id_dossier);


--
-- TOC entry 4868 (class 2606 OID 24915)
-- Name: historique_acces_dossier historique_acces_dossier_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historique_acces_dossier
    ADD CONSTRAINT historique_acces_dossier_pkey PRIMARY KEY (id_log);


--
-- TOC entry 4870 (class 2606 OID 24917)
-- Name: hopital hopital_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hopital
    ADD CONSTRAINT hopital_pkey PRIMARY KEY (id_hopital);


--
-- TOC entry 4891 (class 2606 OID 25032)
-- Name: notification notification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_pkey PRIMARY KEY (id);


--
-- TOC entry 4875 (class 2606 OID 82373)
-- Name: patient patient_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient
    ADD CONSTRAINT patient_email_key UNIQUE (email);


--
-- TOC entry 4877 (class 2606 OID 24921)
-- Name: patient patient_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient
    ADD CONSTRAINT patient_pkey PRIMARY KEY (id_patient);


--
-- TOC entry 4880 (class 2606 OID 24923)
-- Name: prescription prescription_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescription
    ADD CONSTRAINT prescription_pkey PRIMARY KEY (id_prescription);


--
-- TOC entry 4883 (class 2606 OID 24925)
-- Name: traitement traitement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.traitement
    ADD CONSTRAINT traitement_pkey PRIMARY KEY (id_traitement);


--
-- TOC entry 4885 (class 2606 OID 41413)
-- Name: utilisateur utilisateur_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_code_key UNIQUE (code);


--
-- TOC entry 4897 (class 2606 OID 74187)
-- Name: utilisateur_dosssier_autorise utilisateur_dosssier_autorise_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilisateur_dosssier_autorise
    ADD CONSTRAINT utilisateur_dosssier_autorise_pkey PRIMARY KEY (id);


--
-- TOC entry 4887 (class 2606 OID 24927)
-- Name: utilisateur utilisateur_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_email_key UNIQUE (email);


--
-- TOC entry 4889 (class 2606 OID 24929)
-- Name: utilisateur utilisateur_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_pkey PRIMARY KEY (id_utilisateur);


--
-- TOC entry 4855 (class 1259 OID 24930)
-- Name: idx_consultation_jsonb; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consultation_jsonb ON public.consultation USING gin (detail);


--
-- TOC entry 4900 (class 1259 OID 98783)
-- Name: idx_demande_acces_dossier; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_demande_acces_dossier ON public.demande_acces_dossier USING btree (id_dossier);


--
-- TOC entry 4901 (class 1259 OID 98784)
-- Name: idx_demande_acces_statut; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_demande_acces_statut ON public.demande_acces_dossier USING btree (statut);


--
-- TOC entry 4902 (class 1259 OID 98782)
-- Name: idx_demande_acces_utilisateur; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_demande_acces_utilisateur ON public.demande_acces_dossier USING btree (id_utilisateur);


--
-- TOC entry 4903 (class 1259 OID 98793)
-- Name: idx_demande_en_attente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_demande_en_attente ON public.demande_acces_dossier USING btree (id_utilisateur, id_dossier) WHERE ((statut)::text = 'EN_ATTENTE'::text);


--
-- TOC entry 4858 (class 1259 OID 24931)
-- Name: idx_diagnostic_jsonb; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_diagnostic_jsonb ON public.diagnostic USING gin (resultats);


--
-- TOC entry 4865 (class 1259 OID 24932)
-- Name: idx_dossier_id_hopital; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dossier_id_hopital ON public.dossier_medical_global USING btree (id_hopital);


--
-- TOC entry 4866 (class 1259 OID 24933)
-- Name: idx_dossier_id_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dossier_id_patient ON public.dossier_medical_global USING btree (id_patient);


--
-- TOC entry 4873 (class 1259 OID 90565)
-- Name: idx_patient_is_paid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_patient_is_paid ON public.patient USING btree (is_paid);


--
-- TOC entry 4878 (class 1259 OID 24934)
-- Name: idx_prescription_jsonb; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prescription_jsonb ON public.prescription USING gin (medicaments);


--
-- TOC entry 4881 (class 1259 OID 24935)
-- Name: idx_traitement_jsonb; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_traitement_jsonb ON public.traitement USING gin (details);


--
-- TOC entry 4928 (class 2620 OID 24936)
-- Name: consultation consultation_notification; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER consultation_notification AFTER INSERT ON public.consultation FOR EACH ROW EXECUTE FUNCTION public.notify_consultation();


--
-- TOC entry 4929 (class 2620 OID 24937)
-- Name: consultation consultation_user_notification; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER consultation_user_notification AFTER INSERT ON public.consultation FOR EACH ROW EXECUTE FUNCTION public.notify_user();


--
-- TOC entry 4930 (class 2620 OID 24938)
-- Name: dossier_medical_global inserer_donnee; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER inserer_donnee AFTER UPDATE ON public.dossier_medical_global FOR EACH ROW EXECUTE FUNCTION public.donnee_acces_dossier();


--
-- TOC entry 4931 (class 2620 OID 24939)
-- Name: utilisateur update_utilisateurs_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_utilisateurs_timestamp BEFORE UPDATE ON public.utilisateur FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- TOC entry 4904 (class 2606 OID 24940)
-- Name: acces_autorise_par_cle_patient acces_autorise_par_cle_patient_id_hopital_autorise_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acces_autorise_par_cle_patient
    ADD CONSTRAINT acces_autorise_par_cle_patient_id_hopital_autorise_fkey FOREIGN KEY (id_hopital_autorise) REFERENCES public.hopital(id_hopital);


--
-- TOC entry 4905 (class 2606 OID 24945)
-- Name: acces_autorise_par_cle_patient acces_autorise_par_cle_patient_id_patient_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acces_autorise_par_cle_patient
    ADD CONSTRAINT acces_autorise_par_cle_patient_id_patient_fkey FOREIGN KEY (id_patient) REFERENCES public.patient(id_patient);


--
-- TOC entry 4907 (class 2606 OID 24950)
-- Name: consultation consultation_id_dossier_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultation
    ADD CONSTRAINT consultation_id_dossier_fkey FOREIGN KEY (id_dossier) REFERENCES public.dossier_medical_global(id_dossier);


--
-- TOC entry 4908 (class 2606 OID 24955)
-- Name: consultation consultation_id_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultation
    ADD CONSTRAINT consultation_id_utilisateur_fkey FOREIGN KEY (id_utilisateur) REFERENCES public.utilisateur(id_utilisateur);


--
-- TOC entry 4925 (class 2606 OID 98777)
-- Name: demande_acces_dossier demande_acces_dossier_id_admin_traitant_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.demande_acces_dossier
    ADD CONSTRAINT demande_acces_dossier_id_admin_traitant_fkey FOREIGN KEY (id_admin_traitant) REFERENCES public.utilisateur(id_utilisateur);


--
-- TOC entry 4926 (class 2606 OID 98772)
-- Name: demande_acces_dossier demande_acces_dossier_id_dossier_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.demande_acces_dossier
    ADD CONSTRAINT demande_acces_dossier_id_dossier_fkey FOREIGN KEY (id_dossier) REFERENCES public.dossier_medical_global(id_dossier) ON DELETE CASCADE;


--
-- TOC entry 4927 (class 2606 OID 98767)
-- Name: demande_acces_dossier demande_acces_dossier_id_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.demande_acces_dossier
    ADD CONSTRAINT demande_acces_dossier_id_utilisateur_fkey FOREIGN KEY (id_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4909 (class 2606 OID 24960)
-- Name: diagnostic diagnostic_id_dossier_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diagnostic
    ADD CONSTRAINT diagnostic_id_dossier_fkey FOREIGN KEY (id_dossier) REFERENCES public.dossier_medical_global(id_dossier);


--
-- TOC entry 4910 (class 2606 OID 24965)
-- Name: diagnostic diagnostic_id_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diagnostic
    ADD CONSTRAINT diagnostic_id_utilisateur_fkey FOREIGN KEY (id_utilisateur) REFERENCES public.utilisateur(id_utilisateur);


--
-- TOC entry 4911 (class 2606 OID 49609)
-- Name: dossier_medical_global dossier_medical_global_id_hopital_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dossier_medical_global
    ADD CONSTRAINT dossier_medical_global_id_hopital_fkey FOREIGN KEY (id_hopital) REFERENCES public.hopital(id_hopital) ON DELETE CASCADE;


--
-- TOC entry 4912 (class 2606 OID 49604)
-- Name: dossier_medical_global dossier_medical_global_id_patient_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dossier_medical_global
    ADD CONSTRAINT dossier_medical_global_id_patient_fkey FOREIGN KEY (id_patient) REFERENCES public.patient(id_patient) ON DELETE CASCADE;


--
-- TOC entry 4913 (class 2606 OID 24980)
-- Name: historique_acces_dossier historique_acces_dossier_id_dossier_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historique_acces_dossier
    ADD CONSTRAINT historique_acces_dossier_id_dossier_fkey FOREIGN KEY (id_dossier) REFERENCES public.dossier_medical_global(id_dossier);


--
-- TOC entry 4914 (class 2606 OID 41416)
-- Name: historique_acces_dossier historique_acces_dossier_id_hopital_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historique_acces_dossier
    ADD CONSTRAINT historique_acces_dossier_id_hopital_fkey FOREIGN KEY (id_hopital) REFERENCES public.hopital(id_hopital);


--
-- TOC entry 4915 (class 2606 OID 24985)
-- Name: historique_acces_dossier historique_acces_dossier_id_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historique_acces_dossier
    ADD CONSTRAINT historique_acces_dossier_id_utilisateur_fkey FOREIGN KEY (id_utilisateur) REFERENCES public.utilisateur(id_utilisateur);


--
-- TOC entry 4906 (class 2606 OID 24990)
-- Name: acces_autorise_par_cle_patient id_dossier_autorise; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acces_autorise_par_cle_patient
    ADD CONSTRAINT id_dossier_autorise FOREIGN KEY (id_dossier_autorise) REFERENCES public.dossier_medical_global(id_dossier) ON UPDATE CASCADE NOT VALID;


--
-- TOC entry 4922 (class 2606 OID 25033)
-- Name: notification notification_id_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_id_utilisateur_fkey FOREIGN KEY (id_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4916 (class 2606 OID 24995)
-- Name: patient patient_id_hopital_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient
    ADD CONSTRAINT patient_id_hopital_fkey FOREIGN KEY (id_hopital) REFERENCES public.hopital(id_hopital);


--
-- TOC entry 4917 (class 2606 OID 25000)
-- Name: prescription prescription_id_dossier_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescription
    ADD CONSTRAINT prescription_id_dossier_fkey FOREIGN KEY (id_dossier) REFERENCES public.dossier_medical_global(id_dossier);


--
-- TOC entry 4918 (class 2606 OID 25005)
-- Name: prescription prescription_id_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescription
    ADD CONSTRAINT prescription_id_utilisateur_fkey FOREIGN KEY (id_utilisateur) REFERENCES public.utilisateur(id_utilisateur);


--
-- TOC entry 4919 (class 2606 OID 25010)
-- Name: traitement traitement_id_dossier_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.traitement
    ADD CONSTRAINT traitement_id_dossier_fkey FOREIGN KEY (id_dossier) REFERENCES public.dossier_medical_global(id_dossier);


--
-- TOC entry 4920 (class 2606 OID 25015)
-- Name: traitement traitement_id_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.traitement
    ADD CONSTRAINT traitement_id_utilisateur_fkey FOREIGN KEY (id_utilisateur) REFERENCES public.utilisateur(id_utilisateur);


--
-- TOC entry 4923 (class 2606 OID 74203)
-- Name: utilisateur_dosssier_autorise utilisateur_dosssier_autorise_id_dossier_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilisateur_dosssier_autorise
    ADD CONSTRAINT utilisateur_dosssier_autorise_id_dossier_fkey FOREIGN KEY (id_dossier) REFERENCES public.dossier_medical_global(id_dossier) ON DELETE CASCADE;


--
-- TOC entry 4924 (class 2606 OID 74198)
-- Name: utilisateur_dosssier_autorise utilisateur_dosssier_autorise_id_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilisateur_dosssier_autorise
    ADD CONSTRAINT utilisateur_dosssier_autorise_id_utilisateur_fkey FOREIGN KEY (id_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4921 (class 2606 OID 25020)
-- Name: utilisateur utilisateur_id_hopital_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_id_hopital_fkey FOREIGN KEY (id_hopital) REFERENCES public.hopital(id_hopital);


-- Completed on 2025-05-20 06:51:17

--
-- PostgreSQL database dump complete
--

