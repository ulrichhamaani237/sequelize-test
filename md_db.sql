--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2025-05-16 07:40:57

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
-- TOC entry 5056 (class 0 OID 24814)
-- Dependencies: 217
-- Data for Name: acces_autorise_par_cle_patient; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.acces_autorise_par_cle_patient (id, id_patient, id_hopital_autorise, date_autorisation, id_dossier_autorise) FROM stdin;
\.


--
-- TOC entry 5079 (class 0 OID 57797)
-- Dependencies: 241
-- Data for Name: blockchain_nodes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.blockchain_nodes (id, url, node_type, is_active, last_heartbeat) FROM stdin;
\.


--
-- TOC entry 5058 (class 0 OID 24819)
-- Dependencies: 219
-- Data for Name: consultation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.consultation (id_consultation, id_dossier, id_utilisateur, date_consultation, detail) FROM stdin;
101	1148	183	2025-05-11 11:52:36.859	{"motif": ""}
102	1149	182	2025-05-12 08:53:09.772	{"motif": "", "date_creation": "2025-05-12T07:53:09.772Z"}
103	1150	184	2025-05-12 09:49:27.887	{"motif": "", "date_creation": "2025-05-12T08:49:27.887Z"}
104	1151	184	2025-05-12 10:50:24.934	{"motif": "", "date_creation": "2025-05-12T09:50:24.916Z"}
\.


--
-- TOC entry 5060 (class 0 OID 24826)
-- Dependencies: 221
-- Data for Name: diagnostic; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.diagnostic (id_diagnostic, id_dossier, id_utilisateur, date_diagnostic, resultats) FROM stdin;
\.


--
-- TOC entry 5062 (class 0 OID 24833)
-- Dependencies: 223
-- Data for Name: dossier_medical_global; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dossier_medical_global (id_dossier, id_patient, id_hopital, donnees_medicales, date_creation, derniere_modification, cle_acces_dossier, code) FROM stdin;
1149	1163	147	\N	2025-05-12 08:53:09.749	2025-05-12 08:53:09.750853	\N	\N
1150	1164	148	\N	2025-05-12 09:49:27.874	2025-05-12 09:49:27.876021	\N	\N
1151	1165	148	\N	2025-05-12 10:50:24.901	2025-05-12 10:50:24.902431	\N	\N
1148	1162	148	\N	2025-05-11 11:52:36.847	2025-05-11 11:52:36.847812	\N	\N
\.


--
-- TOC entry 5064 (class 0 OID 24841)
-- Dependencies: 225
-- Data for Name: historique_acces_dossier; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.historique_acces_dossier (id_log, id_dossier, id_utilisateur, date_acces, type_action, operation_type, dossier_username, target_type, details, signature, id_hopital) FROM stdin;
\.


--
-- TOC entry 5066 (class 0 OID 24848)
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
-- TOC entry 5077 (class 0 OID 25028)
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
\.


--
-- TOC entry 5068 (class 0 OID 24858)
-- Dependencies: 229
-- Data for Name: patient; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.patient (id_patient, nom, prenom, date_naissance, nom_tuteur, id_hopital, adresse, donnees, code, sexe, taille, age, photo, public_key, shared_key, password, tel, token, email) FROM stdin;
1162	hamaani	ulrich	2025-05-11	piere	148	mimboman                                                                                  	\N	\N	F                                                 	300	39		\N	\N	\N	\N	\N	\N
1163	John2	Doe2	2000-01-01	Tuteur2	147	123 Rue de l'Hopital V                                                                    	\N	\N	Masculin                                          	180	25	photo2.jpg	\N	\N	\N	+237 620410454	\N	\N
1164	jeanp	Doemon	2000-01-01	Tuteur2	148	123 Rue de l'Hopital V                                                                    	\N	\N	Masculin                                          	180	25	photo2.jpg	\N	\N	\N	+237 620410454	\N	\N
1165	marcel	samia	2004-01-01	Tuteur2	148	123 Rue de l'Hopital V                                                                    	\N	\N	Masculin                                          	180	18	photo2.jpg	\N	\N	\N	+237 620410454	\N	\N
1166	marcel	samia	2004-01-01	Tuteur2	148	123 Rue de l'Hopital V                                                                    	\N	\N	Masculin                                          	180	18	photo2.jpg	\N	\N	$2b$10$7iQx8yXvFqo2lsC.kA9KYeCMPrnpU9XlMeb0hu0ul6i9B5RN5i8wC	+237620410454	\N	ulrichhaman@gmail.com
\.


--
-- TOC entry 5070 (class 0 OID 24864)
-- Dependencies: 231
-- Data for Name: prescription; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prescription (id_prescription, id_dossier, id_utilisateur, date_prescription, medicaments) FROM stdin;
\.


--
-- TOC entry 5072 (class 0 OID 24871)
-- Dependencies: 233
-- Data for Name: traitement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.traitement (id_traitement, id_dossier, id_utilisateur, date_traitement, details) FROM stdin;
\.


--
-- TOC entry 5074 (class 0 OID 24878)
-- Dependencies: 235
-- Data for Name: utilisateur; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.utilisateur (id_utilisateur, nom, prenom, email, mot_de_passe_hash, role, id_hopital, cle_publique, autre_donnees, token, created_at, updated_at, adresse, cle_prive, code, blockchain_node_url, blockchain_node_url_private, node_active, last_block_synced_at, is_not_active, specialite, sexe, access_record) FROM stdin;
181	John	Doe	john@example.com	$2b$10$ADI5pZeNReuBrN42770Yv.iM6SE1aosdR2Q/m9yp1UXqUfjEwINMG	medecin	147	04075306915816c5d62b781b5cd2b6f972124643d30cb6f3dbd1e7b21ddb56a7653be49539e1d6ec78932c3398c97b317e1f5448542368bb52700b9dddf3fc929e	{"test": "Donnees supplementaires"}	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91dGlsaXNhdGV1ciI6MTgxLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJyb2xlIjoibWVkZWNpbiIsImlhdCI6MTc0Njk1MTA3MiwiZXhwIjoxNzQ5NTQzMDcyfQ.CbaItnh6pPBjtNhmu_-9QfIO0zduFzw4jqn9_fz9o3o	2025-05-11 09:11:01.649542	2025-05-11 09:11:12.305341	\N	e553a10d641d109e46abdbfbe8e1b710:b25b570ecdb66eb31931bcd80d75c640:83b2a5b925e6d3a6569f8d036873229fc29664650fc21ba01113548eb5b3080dcc7198c9a0dbbfe899e13445e51039752750a84331deb20383e6012953c3dd42980c76f6de4728ccf7b6215bf983e01e	\N	http://localhost:5003	\N	\N	\N	f	\N	\N	t
183	marina		marina@gmail.com	$2b$10$TTgZ5IhLEbncDGBKCrgtb.c6WW2tXXSu4dqjts5lfpuolkH7Ddilm	admin	148	0419a5b5a245ca5e4a505b100b44eeff4cc0d3e2bbeb07dbc98aef70b012fd99df421e21976226e491456bd31976f71e241819e9af722c4eb7e4f93daf893c7b56	{"": ""}	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91dGlsaXNhdGV1ciI6MTgzLCJlbWFpbCI6Im1hcmluYUBnbWFpbCIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc0Njk1NzA2MCwiZXhwIjoxNzQ5NTQ5MDYwfQ.mt-scQ4ZSE6XS44Fta41_OKZZ8JhaNg-TPngKX6x2no	2025-05-11 10:51:00.592942	2025-05-11 10:52:35.796857	\N	85770c30b218d8475419c6330556ec97:843a1492a26b12bca225cb7da99aa662:499a3f197bf7f8cb0e07db1fb69a902eaf1edaac7c1d68e20fb6d482e319d9494a41bcb8935b7ebdd3c0a418358aa59022de1600e51779bea8e5c5e406cd3dd03f82423a427a96001c278683bf5156a0	\N	http://localhost:5004	\N	\N	\N	f	\N	\N	t
184	John4	Doe4	john4@example.com	$2b$10$UMNllaTx4cyq8KOnlAlZXud7kEjnrv.DOftTff5xUFLTb1fl2en1q	admin	148	047e0844fbc90d329161db20028345ea99c58dc868ba29bc38f3b78836a7fede2f4bfc832780a73be1f70bd8157a48313de7e9e8897d7eab561e38d487f4ed389d	{"info": "autre donnzz"}	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91dGlsaXNhdGV1ciI6MTg0LCJlbWFpbCI6ImpvaG40QGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3MDM5NTM4LCJleHAiOjE3NDk2MzE1Mzh9.zmz0fYfGilDoDpcFzx420x_ahaap-cP2Xhn7-kJrJNE	2025-05-12 09:45:38.794963	2025-05-12 09:45:38.823506	\N	cac09f2384eb153d6195f596b45b73ea:159bd6fe431f2801d305bda1aec4e980:6eb8a0d0eeade5aa56c26e14cdd97cdb58469bceeaf02989de9bad4b7a0e2bad7b9ae85a4561fd40482c529e44580dc68783a5d35e24f7749bcea4d39da4d765205c8a073dfb7387bcc8fbd6aa467dc2	\N	http://localhost:5004	\N	\N	\N	f	\N	\N	t
185	komo	marie	komomarie@gmail.com	$2b$10$Wudarn8jVFVUTbouH44dd.cDLkqVkZgr.07ZRhKocrUeVnHN35jTi	Infirmier	148	\N	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91dGlsaXNhdGV1ciI6MTg1LCJlbWFpbCI6ImtvbW9tYXJpZUBnbWFpbC5jb20iLCJyb2xlIjoiSW5maXJtaWVyIiwiaWF0IjoxNzQ3MzA2MDY5LCJleHAiOjE3NDgxNzAwNjl9.KmVGyf349vuixRDqiNV4O8Hx0HZv22nfO2rSOjoG-ws	2025-05-15 11:47:19.125297	2025-05-15 11:47:49.526042	\N	\N	\N	\N	\N	\N	\N	f	cardiograhe	F	t
182	John2	Doe2	john2@example.com	$2b$10$TYkcEjt/rLJQd7PKzR0W2uDnhnBFj0Iqovw9TIyv/RAAJHhgXrTIq	medecin	147	04ac4a4e42686980b24ec96ae1206c29b9417cb88711699dffabdec590014bcafadbe3dffd6afc9833f75ccb6d47193d7ffd9dbe1bd760f57dda71a5f9cbe4b7f1	{"info": "autre donnzz"}	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91dGlsaXNhdGV1ciI6MTgyLCJlbWFpbCI6ImpvaG4yQGV4YW1wbGUuY29tIiwicm9sZSI6Im1lZGVjaW4iLCJpYXQiOjE3NDY5NTExOTYsImV4cCI6MTc0OTU0MzE5Nn0.AzQRqAodqEGK8Snmr94MZ0JQUf0hMZlRm8qrjs41QsE	2025-05-11 09:13:16.46529	2025-05-11 09:13:16.502401	\N	a1bce27a1d1896ec7b46dc7b994e8ab1:9eec17f06f3674d8c1bcaa3c8f9116e7:29735312c1b7e15b66780fe72a61cde98036d8a2e2065eff50aebf61b171fa5247f67b4f0d549c85bf7e4ff2de5859f0f32416151cf294b947c48c3563c316b63af6bc22d212bfe6c031f64c984d3e72	\N	http://localhost:5003	\N	\N	\N	f	\N	\N	t
\.


--
-- TOC entry 5081 (class 0 OID 74182)
-- Dependencies: 243
-- Data for Name: utilisateur_dosssier_autorise; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.utilisateur_dosssier_autorise (id, id_utilisateur, id_dossier) FROM stdin;
\.


--
-- TOC entry 5104 (class 0 OID 0)
-- Dependencies: 218
-- Name: acces_autorise_par_cle_patient_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.acces_autorise_par_cle_patient_id_seq', 21, true);


--
-- TOC entry 5105 (class 0 OID 0)
-- Dependencies: 240
-- Name: blockchain_nodes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.blockchain_nodes_id_seq', 1, false);


--
-- TOC entry 5106 (class 0 OID 0)
-- Dependencies: 220
-- Name: consultation_id_consultation_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.consultation_id_consultation_seq', 104, true);


--
-- TOC entry 5107 (class 0 OID 0)
-- Dependencies: 222
-- Name: diagnostic_id_diagnostic_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.diagnostic_id_diagnostic_seq', 1, false);


--
-- TOC entry 5108 (class 0 OID 0)
-- Dependencies: 224
-- Name: dossier_medical_global_id_dossier_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dossier_medical_global_id_dossier_seq', 1151, true);


--
-- TOC entry 5109 (class 0 OID 0)
-- Dependencies: 226
-- Name: historique_acces_dossier_id_log_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.historique_acces_dossier_id_log_seq', 30, true);


--
-- TOC entry 5110 (class 0 OID 0)
-- Dependencies: 228
-- Name: hopital_id_hopital_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hopital_id_hopital_seq', 148, true);


--
-- TOC entry 5111 (class 0 OID 0)
-- Dependencies: 238
-- Name: notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notification_id_seq', 3673, true);


--
-- TOC entry 5112 (class 0 OID 0)
-- Dependencies: 230
-- Name: patient_id_patient_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.patient_id_patient_seq', 1166, true);


--
-- TOC entry 5113 (class 0 OID 0)
-- Dependencies: 232
-- Name: prescription_id_prescription_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.prescription_id_prescription_seq', 1, false);


--
-- TOC entry 5114 (class 0 OID 0)
-- Dependencies: 234
-- Name: traitement_id_traitement_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.traitement_id_traitement_seq', 3, true);


--
-- TOC entry 5115 (class 0 OID 0)
-- Dependencies: 242
-- Name: utilisateur_dosssier_autorise_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.utilisateur_dosssier_autorise_id_seq', 1, false);


--
-- TOC entry 5116 (class 0 OID 0)
-- Dependencies: 236
-- Name: utilisateur_id_utilisateur_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.utilisateur_id_utilisateur_seq', 185, true);


-- Completed on 2025-05-16 07:40:57

--
-- PostgreSQL database dump complete
--

