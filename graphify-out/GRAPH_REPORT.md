# Graph Report - Audiblytics  (2026-10-13)

## Corpus Check
- Large corpus: 508 files · ~341,919 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 2368 nodes · 6260 edges · 128 communities (112 shown, 16 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 231 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- API Recordings
- Alembic Migrations
- Settings Layout & Sidebar
- Paragraph API
- Today Screen
- Today Paragraph Requirements
- Settings Routes
- Offline Pack & IndexedDB
- Root Layout & Fonts
- Settings Appearance
- Completions API
- Review Word Selection
- LLM Provider Clients
- Archived Day Excerpts
- Settings Hub Context
- Collection API
- Home Stat Rail
- Health & Config
- Deploy & README
- Archived Day Hooks
- Collection Hooks
- Journey & Stats Pages
- UI Mockups v2
- App Chrome Wireframe
- Auth API
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101
- Community 102
- Community 103
- Community 104
- Community 105
- Community 106
- Community 107
- Community 108
- Community 109
- Community 110
- Community 111
- Community 112
- Community 113
- Community 115
- Community 116
- Community 117
- Community 119
- Community 120
- Community 121
- Community 122
- Community 123
- Community 124
- Community 125
- Community 127

## God Nodes (most connected - your core abstractions)
1. `cn()` - 148 edges
2. `react` - 83 edges
3. `isApiStorageBackend()` - 55 edges
4. `Button()` - 48 edges
5. `formatUtcDate()` - 46 edges
6. `lucide-react` - 38 edges
7. `next` - 34 edges
8. `ok()` - 32 edges
9. `err()` - 31 edges
10. `User` - 28 edges

## Surprising Connections (you probably didn't know these)
- `migrate initContainer (alembic)` --semantically_similar_to--> `migrate service (alembic upgrade head)`  [INFERRED] [semantically similar]
  k8s/api.yaml → docker-compose.yml
- `k8s api Deployment + Service` --semantically_similar_to--> `api service (FastAPI)`  [INFERRED] [semantically similar]
  k8s/api.yaml → docker-compose.yml
- `k8s web Deployment + NodePort Service` --semantically_similar_to--> `web service (Next.js)`  [INFERRED] [semantically similar]
  k8s/web.yaml → docker-compose.yml
- `k8s seed Job` --semantically_similar_to--> `seed service (setup profile)`  [INFERRED] [semantically similar]
  k8s/seed-job.yaml → docker-compose.yml
- `Audiblytics API README` --references--> `Architecture v2 FastAPI Backend`  [INFERRED]
  apps/api/README.md → _bmad-output/planning-artifacts/architecture-v2-fastapi-backend.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Epic 1 foundation stories** — bmad_output_implementation_artifacts_1_1_project_scaffold_and_agent_configuration_story, bmad_output_implementation_artifacts_1_2_visual_token_system_typography_and_self_hosted_fonts_story, bmad_output_implementation_artifacts_1_3_root_layout_shell_topnav_dayrail_skeleton_statrail_skeleton_and_honesty_footer_story, bmad_output_implementation_artifacts_1_4_storage_foundations_dexie_schema_uselocalstorage_hook_base_zod_schemas_story, bmad_output_implementation_artifacts_1_5_llm_provider_abstraction_schema_validation_retry_and_error_parsing_story, bmad_output_implementation_artifacts_1_6_hard_scope_boundary_three_layer_guard_story, bmad_output_implementation_artifacts_1_7_browser_tts_wrapper_with_voice_lifecycle_handling_story, bmad_output_implementation_artifacts_1_8_onboarding_flow_provider_selection_key_entry_defaults_first_generate_story, bmad_output_implementation_artifacts_1_9_settings_screen_provider_switch_with_key_vault_preservation_story, bmad_output_implementation_artifacts_1_10_today_screen_paragraph_hero_with_manual_generate_action_story, bmad_output_implementation_artifacts_1_11_hard_words_list_with_inline_tts_and_per_word_paragraph_playback_story, bmad_output_implementation_artifacts_1_12_inline_error_surface_with_two_action_recovery_story [EXTRACTED 0.85]
- **Hard-scope boundary enforcement** — bmad_output_implementation_artifacts_1_6_hard_scope_boundary_three_layer_guard_story, claude_hard_scope_boundary, agents_hard_scope_boundary [INFERRED 0.75]
- **Recording R2 upload flow** — bmad_output_implementation_artifacts_11_1_recordings_table_and_r2_client_service_recordings_table, bmad_output_implementation_artifacts_11_2_post_recordings_and_presigned_upload_start_post_recordings, bmad_output_implementation_artifacts_11_3_post_recordings_id_complete_and_playback_url_recording_complete_playback, bmad_output_implementation_artifacts_11_4_frontend_save_recording_via_api_save_recording_via_api [EXTRACTED 1.00]
- **Paragraph server cache flow** — bmad_output_implementation_artifacts_10_1_paragraph_cache_migration_and_model_paragraph_cache_table, bmad_output_implementation_artifacts_10_2_post_paragraphs_generate_gemini_proxy_post_paragraphs_generate, bmad_output_implementation_artifacts_10_3_get_paragraphs_today_same_day_cache_get_paragraphs_today, bmad_output_implementation_artifacts_10_4_frontend_api_paragraph_hooks_api_paragraph_hooks [EXTRACTED 1.00]
- **UI v2 mockup pages** — bmad_output_implementation_artifacts_14_2_home_dashboard_home_dashboard, bmad_output_implementation_artifacts_14_3_today_session_three_column_layout_today_three_column, bmad_output_implementation_artifacts_14_4_voice_journal_page_v2_voice_journal_v2, bmad_output_implementation_artifacts_14_5_collection_master_detail_collection_master_detail, bmad_output_implementation_artifacts_14_1_design_tokens_and_app_shell_v2_design_tokens_shell_v2 [EXTRACTED 1.00]
- **API-mode server parity (Epic 15)** — _bmad_output_implementation_artifacts_15_1_server_paragraph_dates_for_calendar_and_streak, _bmad_output_implementation_artifacts_15_2_archived_day_detail_in_api_mode, _bmad_output_implementation_artifacts_15_3_days_of_use_server_sync_day_14_parity [EXTRACTED 0.85]
- **Recording capture to playback pipeline** — _bmad_output_implementation_artifacts_3_1_mediarecorder_wrapper_with_mime_auto_detect_60s_cap_and_permission_lifecycle, _bmad_output_implementation_artifacts_3_3_recordpanel_capture_persist_and_stamp_dayofuse, _bmad_output_implementation_artifacts_3_4_voice_journal_route_list_all_recordings_with_inline_playback, _bmad_output_implementation_artifacts_3_5_compare_any_two_recordings_via_compositeplayer_general_purpose_mode [INFERRED 0.85]
- **v2 UI mockup stories** — _bmad_output_implementation_artifacts_14_6_review_session_v2, _bmad_output_implementation_artifacts_14_7_settings_hub_sub_pages, _bmad_output_implementation_artifacts_14_8_journey_page_calendar_timeline, _bmad_output_implementation_artifacts_14_9_stretch_ui_placeholders_optional [EXTRACTED 0.85]
- **Day-14 gate story set** — bmad_output_implementation_artifacts_7_1_day_14_trigger_detection_exact_once, bmad_output_implementation_artifacts_7_2_day_14_gate_at_layout_level_url_unbypassable, bmad_output_implementation_artifacts_7_3_day14takeover_ui_compositeplayer_same_word_match_heuristic, bmad_output_implementation_artifacts_7_4_yes_no_capture_persistence_then_flow_and_continue_affordance [INFERRED 0.85]
- **Review flashcard story set** — bmad_output_implementation_artifacts_6_1_review_queue_selector_oldest_reviewed_first, bmad_output_implementation_artifacts_6_2_flashcard_ui_with_three_button_feedback, bmad_output_implementation_artifacts_6_3_per_word_tts_playback_during_review [INFERRED 0.85]
- **Epic 9 server account stories** — _bmad_output_implementation_artifacts_9_3_alembic_migrations_for_users_and_user_settings, _bmad_output_implementation_artifacts_9_4_nextjs_login_authprovider_and_appgate, _bmad_output_implementation_artifacts_9_5_settings_api_and_api_mode_settings_form, _bmad_output_implementation_artifacts_9_6_nextjs_api_proxy_for_same_origin_cookies [EXTRACTED 0.95]
- **v2 backend ADRs (auth, R2 blobs, strangler flag)** — docs_decisions_0001_jwt_httponly_cookie_auth_md, docs_decisions_0002_r2_presigned_blobs_not_postgres_md, docs_decisions_0003_strangler_storage_backend_flag_md [EXTRACTED 1.00]
- **Kubernetes kustomize stack** — k8s_namespace_yaml, k8s_configmap_yaml, k8s_api_yaml, k8s_web_yaml, k8s_seed_job_yaml [EXTRACTED 1.00]
- **docker-compose stack (postgres, migrate, api, web)** — docker_compose_yml_postgres, docker_compose_yml_migrate, docker_compose_yml_api, docker_compose_yml_web [EXTRACTED 1.00]
- **Layout rearrange wireframe set** — _bmad_output_design_audiblytics_layout_rearrange_frames_current_app_chrome_frame, _bmad_output_design_audiblytics_layout_rearrange_frames_current_home_frame, _bmad_output_design_audiblytics_layout_rearrange_frames_current_today_frame, _bmad_output_design_audiblytics_layout_rearrange_frames_proposed_app_shell_frame, _bmad_output_design_audiblytics_layout_rearrange_frames_proposed_home_frame, _bmad_output_design_audiblytics_layout_rearrange_frames_proposed_today_frame [EXTRACTED 0.95]
- **Settings screen mockups** — bmad_output_design_ui_mockups_v2_chatgpt_image_may_31_2026_12_38_42_am_3940f0f3_65c5_4304_99d8_75330135c592, bmad_output_design_ui_mockups_v2_chatgpt_image_may_31_2026_12_38_47_am_4e707adc_f1e3_4efc_950d_0d27ad2b5305, bmad_output_design_ui_mockups_v2_chatgpt_image_may_31_2026_12_38_52_am_ce619609_6974_467d_9d6a_ed06d65de296, bmad_output_design_ui_mockups_v2_chatgpt_image_may_31_2026_12_38_55_am_d2bcf61e_0105_450c_b151_cbbea5430224 [EXTRACTED 0.85]
- **Next.js scaffold default public SVG assets** — apps_web_public_file_svg, apps_web_public_globe_svg, apps_web_public_next_svg, apps_web_public_vercel_svg, apps_web_public_window_svg [INFERRED 0.85]

## Communities (128 total, 16 thin omitted)

### Community 0 - "API Recordings"
Cohesion: 0.05
Nodes (67): complete_recording_upload(), get_recording_playback_url(), _get_user_recording(), list_recordings(), _metadata_matches(), start_recording_upload(), Settings, recording_date_from_iso() (+59 more)

### Community 1 - "Alembic Migrations"
Cohesion: 0.10
Nodes (16): upgrade(), upgrade(), upgrade(), upgrade(), upgrade(), upgrade(), upgrade(), Base (+8 more)

### Community 2 - "Settings Layout & Sidebar"
Cohesion: 0.08
Nodes (38): SettingsLayout(), AppSidebar(), MobileAppNav(), SidebarNavLink(), SidebarNavLinkProps, SidebarNavLinks(), SidebarNavLinksProps, SidebarProfileFooter() (+30 more)

### Community 3 - "Paragraph API"
Cohesion: 0.09
Nodes (21): generate_paragraph(), get_paragraph_by_utc_date(), get_paragraph_today(), list_paragraph_dates(), _parse_query_utc_date(), _utc_date_from_generated_at(), _utc_day_bounds(), _utc_day_bounds_for_date() (+13 more)

### Community 4 - "Today Screen"
Cohesion: 0.10
Nodes (36): TodayPage(), BackToHomeLink(), BackToHomeLinkProps, FeatureRouteShellProps, HardWordRow(), HardWordRowProps, HardWordsList(), HardWordsListProps (+28 more)

### Community 5 - "Today Paragraph Requirements"
Cohesion: 0.04
Nodes (47): FR14, FR16, FR17, FR19, NFR2, Story 1.10 Today Screen Paragraph Hero, NFR26, Story 1.12 Inline Error Surface (+39 more)

### Community 6 - "Settings Routes"
Cohesion: 0.14
Nodes (32): AdvancedFallback(), SettingsAdvancedRoute(), SettingsAudioRoute(), SettingsDataRoute(), SettingsPracticeRoute(), LENGTH_OPTIONS, PERSONA_LABEL, THEME_LABEL (+24 more)

### Community 7 - "Offline Pack & IndexedDB"
Cohesion: 0.05
Nodes (44): Story 8.2: "Download Pack" Settings Action — Load Pack into IndexedDB, AR10, AudiblyticsDB, FR42, FR61, InlineErrorSurface, NFR8, page.tsx (+36 more)

### Community 8 - "Root Layout & Fonts"
Cohesion: 0.10
Nodes (31): fontMono, fontSans, fontSerif, metadata, RootLayout(), AppProviders(), AppGate(), AppGateProps (+23 more)

### Community 9 - "Settings Appearance"
Cohesion: 0.12
Nodes (27): SettingsAboutRoute(), SettingsAppearanceRoute(), ButtonPair(), ButtonPairProps, CollectionListRow(), CollectionListRowProps, CollectionWordDetailPanel(), CollectionWordDetailPanelProps (+19 more)

### Community 10 - "Completions API"
Cohesion: 0.09
Nodes (14): _apply_upsert(), list_completions(), _parse_query_utc_date(), upsert_completion(), list_days_of_use(), _parse_body_utc_date(), stamp_day_of_use(), CompletionsMapResponse (+6 more)

### Community 11 - "Review Word Selection"
Cohesion: 0.12
Nodes (17): CollectionSourceMetaByParagraphId, selectRecycleWords(), shuffleWords(), useReviewFeedback(), UseReviewFeedbackResult, CollectionSourceContext, formatSavedLocalDate(), MONTHS (+9 more)

### Community 12 - "LLM Provider Clients"
Cohesion: 0.15
Nodes (26): extractAnthropicCode(), parseAnthropicError(), extractGeminiCode(), parseGeminiError(), parseLlmError(), parseOllamaError(), extractOpenAiCode(), parseOpenAiError() (+18 more)

### Community 13 - "Archived Day Excerpts"
Cohesion: 0.10
Nodes (27): excerptParagraphWords(), countSavedWordsForUtcDate(), EMPTY_SNAPSHOT, useArchivedDayApi(), cached, recording, enrichRecordingsForArchivedDay(), RECORDINGS_MUTATED_EVENT (+19 more)

### Community 14 - "Settings Hub Context"
Cohesion: 0.12
Nodes (28): SettingsHubContext, SettingsHubContextValue, SettingsHubProvider(), normalizeProviderKeys(), patchProviderKey(), readProviderKey(), ApiSettings, fetchApiSettings() (+20 more)

### Community 15 - "Collection API"
Cohesion: 0.13
Nodes (12): delete_collection_word(), _get_user_word(), _get_user_word_by_text(), list_collection_words(), _metadata_matches(), _row_from_body(), save_collection_word(), CollectionWord (+4 more)

### Community 16 - "Home Stat Rail"
Cohesion: 0.14
Nodes (22): StatRailCards(), HomeConsistencyInlineBanner(), HomeOverviewCard(), OverviewRow(), OverviewRowProps, evaluateCompletion(), isUtcDayCompleteFromInputs(), useStreak() (+14 more)

### Community 17 - "Health & Config"
Cohesion: 0.12
Nodes (13): health(), get_settings(), _build_engine(), get_engine(), init_db(), reset_engine(), create_app(), lifespan() (+5 more)

### Community 18 - "Deploy & README"
Cohesion: 0.08
Nodes (33): apps/web README, API mode (auth + Postgres, server-side Gemini), Local mode (IndexedDB + localStorage, browser LLM keys), Offline pack generator (Story 8.1), Vercel deploy (root dir apps/web), api service (FastAPI), migrate service (alembic upgrade head), postgres service (postgres:16-alpine) (+25 more)

### Community 19 - "Archived Day Hooks"
Cohesion: 0.15
Nodes (21): queryLatestCachedParagraphForUtcDate(), useArchivedDay(), useArchivedDayLocal(), UseSaveWordResult, LoadOfflinePackResult, pruneRecordingsOlderThanRollingWindow(), usePruneOnMount(), UsePruneOnMountResult (+13 more)

### Community 20 - "Collection Hooks"
Cohesion: 0.15
Nodes (26): COLLECTION_MUTATED_EVENT, notifyCollectionMutated(), useRemoveWord(), UseRemoveWordResult, useSaveWord(), loadOfflinePackFromPublic(), toStorageError(), persistParagraphToCache() (+18 more)

### Community 21 - "Journey & Stats Pages"
Cohesion: 0.11
Nodes (23): JourneyFallback(), JourneyPage(), StatsPage(), FeatureRouteShell(), buildUtcMonthGrid(), UtcMonthGridItem, StatStreakSurfaceContext, StatStreakSurfaceProvider() (+15 more)

### Community 22 - "UI Mockups v2"
Cohesion: 0.06
Nodes (32): Figma Import guide, Tokens match globals.css, Epic 14 Product UI Refresh, Palette cream and forest green, Mockup screens: home, today, journal, collection, review, journey, settings, UI Mockups v2, AR1, AR10 (+24 more)

### Community 23 - "App Chrome Wireframe"
Cohesion: 0.08
Nodes (30): CURRENT App chrome wireframe, HonestyFooter, MainContentShell, DayRail + StatRail exist in code but not mounted in layout, TopNav (2 links only: Home, Settings), CalendarDayCell grid, CURRENT Home wireframe, HomeDashboard (+22 more)

### Community 24 - "Auth API"
Cohesion: 0.16
Nodes (16): login(), logout(), me(), _prune_recordings_best_effort(), register(), user_to_response(), session_cookie_kwargs(), create_access_token() (+8 more)

### Community 25 - "Community 25"
Cohesion: 0.12
Nodes (24): Day14Choice, CompareRowPreview(), Day14Takeover(), Day14TakeoverProps, formatDurationLabel(), getReducedMotionSnapshot(), OUTCOME_COPY, subscribeReducedMotion() (+16 more)

### Community 26 - "Community 26"
Cohesion: 0.17
Nodes (18): ApiErrorDetail, fetchDaysOfUse(), parseApiErrorBody(), stampDayOfUse(), addUtcCalendarDays(), DAYS_OF_USE_MUTATED_EVENT, notifyDaysOfUseMutated(), appendServerDaysOfUseCache() (+10 more)

### Community 27 - "Community 27"
Cohesion: 0.23
Nodes (19): get_db(), get_session_factory(), Recording, prune_expired_recordings(), rolling_retention_cutoff(), _get_user_id(), _insert_recording(), _old_recording_date() (+11 more)

### Community 28 - "Community 28"
Cohesion: 0.13
Nodes (21): LoginPage(), formatLlmError(), LENGTH_OPTIONS, OnboardingShell(), OnboardingShellProps, PERSONA_LABEL, PROVIDER_OPTIONS, PROVIDER_SIGNUP_URL (+13 more)

### Community 29 - "Community 29"
Cohesion: 0.17
Nodes (21): notifyCompletionsMutated(), mergeMarkReadItCompletion(), useMarkReadIt(), UseMarkReadItArgs, ParagraphOfTheDayStatus, queryMostRecentCachedParagraphForUtcToday(), toParagraphStatus(), useApiParagraphOfTheDay() (+13 more)

### Community 30 - "Community 30"
Cohesion: 0.16
Nodes (24): test_generate_and_today(), test_generate_requires_gemini_key(), test_generate_uses_user_gemini_key(), test_paragraph_by_date_404_when_empty(), test_paragraph_by_date_after_generate(), test_paragraph_by_date_invalid(), test_paragraph_by_date_requires_auth(), test_paragraph_by_date_user_isolation() (+16 more)

### Community 31 - "Community 31"
Cohesion: 0.17
Nodes (21): CollectionPage(), TABS, useCollectionSourceMeta(), useReviewWordTts(), UseReviewWordTtsArgs, cancelSpeech(), getPersistedVoice(), getSpeechSynthesis() (+13 more)

### Community 32 - "Community 32"
Cohesion: 0.09
Nodes (27): Story 11.1: Recordings Table and R2 Client Service, R2 presign client service, recordings table, Story 11.2: POST /recordings and Presigned Upload Start, POST /recordings presigned upload start, Story 11.3: POST /recordings/{id}/complete and Playback URL, POST /recordings/{id}/complete and playback-url, Story 11.4: Frontend Save Recording via API (+19 more)

### Community 33 - "Community 33"
Cohesion: 0.14
Nodes (17): resolveTodayDisplayParagraph(), cached, session, GenerateParagraphHookResult, ParagraphGeneratePayload, baseResult, loadCollectionForRecycle(), useGenerateParagraph() (+9 more)

### Community 34 - "Community 34"
Cohesion: 0.16
Nodes (18): VoiceJournalPage(), CompareModePhase, CompositePlayerCompareSource, CompositePlayerProps, delay(), VoiceJournalAiReflectionCard(), dayLabel(), VoiceJournalCompareCard() (+10 more)

### Community 35 - "Community 35"
Cohesion: 0.09
Nodes (22): eslintConfig, name, pnpm, ignoredBuiltDependencies, private, version, class-variance-authority, clsx (+14 more)

### Community 36 - "Community 36"
Cohesion: 0.08
Nodes (24): Story 4.4: Calendar Route — 30/60/90-Day Toggle Grid with Honest Empty Cells, CalendarDayCell, FR53, FR55, FR58, NFR13, NFR22, NFR6 (+16 more)

### Community 37 - "Community 37"
Cohesion: 0.15
Nodes (17): persistDay14Outcome(), defaultDay14State, Day14State, day14StateSchema, AUDIBLYTICS_STORAGE_SYNC, COMPLETIONS_STORAGE_KEY, DAY14_STATE_STORAGE_KEY, DAYS_OF_USE_STORAGE_KEY (+9 more)

### Community 38 - "Community 38"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 39 - "Community 39"
Cohesion: 0.16
Nodes (15): hashSeed(), RecordingWaveformPlaceholder(), RecordingWaveformPlaceholderProps, WAVEFORM_BAR_HEIGHT_CLASSES, VoiceJournalRecordingRow(), VoiceJournalRecordingRowProps, formatDurationLabel(), formatRecordingDateTime() (+7 more)

### Community 40 - "Community 40"
Cohesion: 0.15
Nodes (10): _asyncpg_connect_args(), normalize_async_database_url(), prepare_async_database_url(), _to_asyncpg_scheme(), test_normalize_postgres_scheme(), test_normalize_postgresql_scheme(), test_passthrough_asyncpg(), test_passthrough_sqlite() (+2 more)

### Community 41 - "Community 41"
Cohesion: 0.13
Nodes (15): nextConfig, Args, computeEta(), extractStructuredOutput(), generateOneParagraph(), main(), MODEL_LITERAL, parseArgs() (+7 more)

### Community 42 - "Community 42"
Cohesion: 0.19
Nodes (13): ReviewPage(), BUTTONS, ReviewFeedbackRow(), ReviewFeedbackRowProps, ReviewProgressRing(), ReviewProgressRingProps, ReviewUpNextList(), ReviewUpNextListProps (+5 more)

### Community 43 - "Community 43"
Cohesion: 0.10
Nodes (21): Story 6.2: Flashcard UI with Three-Button Feedback, AR18, CollectionWord, Flashcard.tsx, FR50, FR51, FR52, HardWordRow (+13 more)

### Community 44 - "Community 44"
Cohesion: 0.10
Nodes (20): dependencies, ai, @ai-sdk/anthropic, @ai-sdk/google, @ai-sdk/openai, @base-ui/react, class-variance-authority, clsx (+12 more)

### Community 45 - "Community 45"
Cohesion: 0.17
Nodes (18): CompositePlayer(), analyzeTranscript(), createSpeechRecognition(), formatDurationLabel(), formatLocalTime(), formatTimer(), isSameLocalCalendarDay(), normalizeWords() (+10 more)

### Community 46 - "Community 46"
Cohesion: 0.18
Nodes (14): DayCell(), DayCellProps, DayRail(), StatusItem(), StatusItemProps, TodaySessionStatus(), TodaySessionStatusProps, buildTrailingUtcDateWindow() (+6 more)

### Community 47 - "Community 47"
Cohesion: 0.16
Nodes (16): StatRailMetric(), StatRailMetricProps, StreakProgressRing(), StreakProgressRingProps, Card(), CardAction(), CardContent(), CardDescription() (+8 more)

### Community 48 - "Community 48"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 49 - "Community 49"
Cohesion: 0.20
Nodes (12): CalendarPageClient(), CalendarPage(), CALENDAR_WINDOW_DAYS, CalendarWindowDays, CalendarGridCell, useCalendarGrid(), UseCalendarGridOptions, JourneyTimeline() (+4 more)

### Community 50 - "Community 50"
Cohesion: 0.17
Nodes (14): StatCardLight(), StatCardLightProps, RailDay(), RailDayProps, StatRailCalendar(), StatRailCalendarProps, WEEK_DAYS, WEEKDAY_SHORT (+6 more)

### Community 51 - "Community 51"
Cohesion: 0.17
Nodes (14): ANNOUNCE_BOUNDARIES_SEC, WarmUpDrill(), WarmUpDrillProps, pickRandomPhrase(), TONGUE_TWISTERS, PendingSave, useWarmUpRecording(), UseWarmUpRecordingArgs (+6 more)

### Community 52 - "Community 52"
Cohesion: 0.23
Nodes (12): HomePage(), formatLastRecording(), HomeContinueCard(), HomeContinueCardProps, HomeDashboard(), compareOldestReviewedFirst(), REVIEW_BATCH_SIZE, selectReviewQueueBatch() (+4 more)

### Community 53 - "Community 53"
Cohesion: 0.21
Nodes (12): ArchivedDayPanel(), ArchivedDayPanelProps, formatUtcHeading(), ArchivedDaySnapshot, enrichRecordingsWithTheme(), queryRecordingsWithThemeApi(), queryRecordingsWithThemeLocal(), useRecordings() (+4 more)

### Community 54 - "Community 54"
Cohesion: 0.23
Nodes (13): CalendarDayCell(), CalendarDayCellProps, utcYmdToDisplayParts(), OfflineBadge(), OfflineBadgeProps, PackGlyph(), Tooltip(), TooltipContent() (+5 more)

### Community 55 - "Community 55"
Cohesion: 0.18
Nodes (7): DevComponentsPage(), HonestyFooter(), ProviderChip(), NAV_ITEMS, NavItem, TopNav(), next

### Community 56 - "Community 56"
Cohesion: 0.16
Nodes (15): Story 9.3: Alembic Migrations for Users and User Settings, Story 9.4: Next.js Login, AuthProvider, and AppGate, Story 9.5: Settings API and API-Mode Settings Form, Story 9.6: Next.js API Proxy for Same-Origin Cookies, AR15 Hard-Scope Boundary, Architecture v2 FastAPI Backend, BV4 Authentication and Authorization, BV5 PostgreSQL Schema (+7 more)

### Community 57 - "Community 57"
Cohesion: 0.14
Nodes (15): Architecture Decision Document, Implementation Patterns and Enforcement Guidelines, NFR14 No Public Deployment, NFR28 Capability-Area Colocation, Result<T,E> Error Handling, BV10 Schema Contract Sync Zod to Pydantic, Zod Schemas as Source of Truth, AGENTS.md agent rules (+7 more)

### Community 58 - "Community 58"
Cohesion: 0.31
Nodes (9): loadDexieParagraphCacheUtcDateSet(), loadParagraphCacheUtcDateSet(), mergeParagraphUtcDateSets(), notifyParagraphDatesMutated(), PARAGRAPH_DATES_MUTATED_EVENT, invalidateServerParagraphUtcDatesCache(), loadServerParagraphUtcDates(), useParagraphCacheUtcDateSet() (+1 more)

### Community 59 - "Community 59"
Cohesion: 0.13
Nodes (15): Story 4.3: Streak Computation and Right-Rail Streak Stat-Card, AR13, FR57, FR58, index.ts, NFR13, NFR22, NFR23 (+7 more)

### Community 60 - "Community 60"
Cohesion: 0.13
Nodes (15): Story 5.3: Optional Recording per Warm-Up Pass, AR18, AR20, AR22, FR35, FR38, FR43, FR46 (+7 more)

### Community 61 - "Community 61"
Cohesion: 0.42
Nodes (11): test_collection_user_isolation(), test_create_and_list_collection_word(), test_delete_collection_word(), test_delete_collection_word_not_found(), test_list_collection_empty(), test_list_collection_recency_order(), test_list_collection_requires_auth(), test_post_id_conflict() (+3 more)

### Community 62 - "Community 62"
Cohesion: 0.23
Nodes (11): lastSurfacedAtMs(), OfflinePackError, OfflinePackSelection, pickFromOfflinePackRowsInMemory(), pickOldestFallback(), ROLLING_WINDOW_MS, selectFromOfflinePack(), hardWord() (+3 more)

### Community 63 - "Community 63"
Cohesion: 0.24
Nodes (5): FakeBlob, FakeRecorderImpl, getUserMediaKey(), installFakeGlobals(), recorderGlobalKey()

### Community 64 - "Community 64"
Cohesion: 0.33
Nodes (14): Left sidebar navigation (Home, Review, Collection, Voice Journal, Journey, Stats, Settings), Settings sections (Practice, Audio, Data & Storage, Advanced, Appearance, About), Streak and consistency tracking, Audiblytics UI design language (sage green, serif headings, warm off-white), Home dashboard mockup, Voice Journal mockup, Collection mockup, Review mockup (+6 more)

### Community 65 - "Community 65"
Cohesion: 0.14
Nodes (14): Story 6.3: Per-Word TTS Playback During Review, AR18, AR20, Flashcard, Flashcard.tsx, FR50, FR51, FR52 (+6 more)

### Community 66 - "Community 66"
Cohesion: 0.14
Nodes (14): Story 7.4: Yes/No Capture, Persistence-Then-Flow, and Continue Affordance, AR11, AR12, AR14, AR18, Button, ButtonPair, CompositePlayer (+6 more)

### Community 67 - "Community 67"
Cohesion: 0.23
Nodes (11): ax_append_unique_pid(), ax_collect_web_pids(), ax_ensure_api_env(), ax_ensure_api_venv(), ax_is_web_pid(), ax_port_in_use(), ax_process_cwd(), ax_start_api() (+3 more)

### Community 69 - "Community 69"
Cohesion: 0.27
Nodes (4): get_settings(), patch_settings(), SettingsPatch, SettingsResponse

### Community 70 - "Community 70"
Cohesion: 0.18
Nodes (10): ClientSettings, getProvider(), requireKey(), MODEL_BY_PROVIDER, ai, @ai-sdk/anthropic, @ai-sdk/google, @ai-sdk/openai (+2 more)

### Community 71 - "Community 71"
Cohesion: 0.15
Nodes (13): Story 7.3: Day14Takeover UI + CompositePlayer Same-Word Match Heuristic, AR18, ButtonPair, CompositePlayer, Day14Gate, Day14Takeover, FR37, FR38 (+5 more)

### Community 72 - "Community 72"
Cohesion: 0.20
Nodes (12): Story 14.8: Journey Page (Calendar + Timeline), FR55-FR58 calendar and completion, Journey page calendar/timeline toggle, UX-V2-UI8 Journey mockup, Story 15.2: Archived Day Detail in API Mode, JourneyDayDetailPanel, GET /paragraphs/by-date/{utc_date}, useArchivedDay API branch (+4 more)

### Community 73 - "Community 73"
Cohesion: 0.21
Nodes (11): API_ORIGIN, apiUnreachableMessage(), DELETE, GET, handle(), networkErrorMessage(), PATCH, POST (+3 more)

### Community 74 - "Community 74"
Cohesion: 0.30
Nodes (10): coerceRecordingBlob(), DEFAULT_RECORDING_MIME, isRecordingBlobPlayable(), playRecordingFromUrl(), playRecordingItem(), playRecordingOnAudio(), RecordingBlobLike, RecordingPlaybackHandle (+2 more)

### Community 75 - "Community 75"
Cohesion: 0.21
Nodes (7): createRecorder(), getBrowserRecorderCtor(), nowMs(), pickMimeType(), Recorder, RecorderState, stopAllTracks()

### Community 76 - "Community 76"
Cohesion: 0.27
Nodes (5): FakeBlob, FakeRecorderImpl, getUserMediaKey(), installDelayedGetUserMedia(), recorderGlobalKey()

### Community 77 - "Community 77"
Cohesion: 0.18
Nodes (12): Audiblytics Detailed Product Description, Deliberately excluded, Daily Loop, Success Metrics, MVP Scope, Five Pillars and two cross-cutting layers, Thesis: daily speaking micro-ritual, Brainstorming Session 2026-05-01 (+4 more)

### Community 78 - "Community 78"
Cohesion: 0.17
Nodes (12): FR17, FR18, FR22, FR23, NFR4, Story 1.11 Hard-Words List with Inline TTS, AR20, FR22 (+4 more)

### Community 79 - "Community 79"
Cohesion: 0.17
Nodes (12): Story 6.1: Review Queue Selector — Oldest-Reviewed-First, AR18, CollectionWord, constants.ts, FR48, FR49, FR52, NFR13 (+4 more)

### Community 80 - "Community 80"
Cohesion: 0.24
Nodes (11): Implementation Readiness Report 2026-05-04, Implementation Readiness Report 2026-05-29, Implementation Readiness Report 2026-05-30, Product Requirements Document, Day-14 Aha Moment, Functional and Non-Functional Requirements, UX Design Directions, UX Design Specification (+3 more)

### Community 81 - "Community 81"
Cohesion: 0.42
Nodes (8): test_completions_user_isolation(), test_list_completions_empty(), test_list_completions_invalid_from_date(), test_list_completions_requires_auth(), test_upsert_and_list_completion(), test_upsert_invalid_date(), test_upsert_merges_flags_or_semantics(), _upsert_body()

### Community 82 - "Community 82"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, @next/bundle-analyzer, tailwindcss, @tailwindcss/postcss, tsx, @types/node (+3 more)

### Community 83 - "Community 83"
Cohesion: 0.35
Nodes (7): Day14Gate(), Day14Takeover, Day14TriggerResult, evaluateDay14Trigger(), commitYesNo(), useDay14State(), useDay14Trigger()

### Community 84 - "Community 84"
Cohesion: 0.33
Nodes (9): ApiErrorDetail, DayCompletionPatch, fetchCompletions(), mapHttpToStorageError(), mapNetworkError(), parseApiErrorBody(), readJson(), upsertDayCompletion() (+1 more)

### Community 85 - "Community 85"
Cohesion: 0.20
Nodes (10): Story 14.6: Review Session v2, FR48-FR51 review queue and feedback, REVIEW_BATCH_SIZE (max 7), use-review-queue hook, UX-V2-UI6 Review mockup, Story 14.9: Stretch UI Placeholders, VoiceJournalAiReflectionCard placeholder, Live feedback placeholder cards (Pace/Clarity/Accuracy) (+2 more)

### Community 86 - "Community 86"
Cohesion: 0.20
Nodes (10): Centered flashcard with Easy/Medium/Hard/Again feedback, Story 14.7: Settings Hub Sub-Pages, FeatureRouteShell, Settings sub-routes practice/audio/data/advanced/appearance/about, UX-V2-UI7 Settings hub, Dexie recordings table, Story 3.6: Retention Policy and 90-Day Pruning, FR41 pruning (+2 more)

### Community 87 - "Community 87"
Cohesion: 0.22
Nodes (10): Story 15.1: Server Paragraph Dates for Calendar and Streak, BVR16, loadParagraphCacheUtcDateSet merge, GET /paragraphs/dates endpoint, BVR17, BVR18, Story 4.2: Day Completion Logic, audiblytics.completions localStorage (+2 more)

### Community 88 - "Community 88"
Cohesion: 0.20
Nodes (10): Epic Breakdown, Epic 10 Server-Side Paragraph Generation, Epic 11 Cloud Recording Persistence, Epic 12 Server-Backed Daily Loop, Epic 13 Production Deploy, Epic 14 Product UI Refresh, Epic 15 API Mode Parity, Epic 1 Onboarding and First Paragraph (+2 more)

### Community 89 - "Community 89"
Cohesion: 0.20
Nodes (10): Story 5.1: Tongue-Twister Library and WarmUpDrill Component (with-pen pass), AR22, FR43, FR44, FR47, NFR1, NFR26, page.tsx (+2 more)

### Community 90 - "Community 90"
Cohesion: 0.20
Nodes (10): Story 7.1: Day-14 Trigger Detection (Exact-Once), AR18, Day14Gate, FR37, FR39, FR40, index.ts, NFR12 (+2 more)

### Community 91 - "Community 91"
Cohesion: 0.25
Nodes (9): longestStreak pure function, Story 15.3: Days-of-Use Server Sync, days_of_use table and GET/POST /days-of-use, recordDayOfUse server+local stamp, Story 3.2: Day-Counter Primitive, AR13 day-counting primitive, currentStreak (FR57), lib/day-counter module (+1 more)

### Community 93 - "Community 93"
Cohesion: 0.36
Nodes (5): JourneyDayDetailPanel(), JourneyDayDetailPanelProps, useJourneyReflection(), JourneyReflections, journeyReflectionsSchema

### Community 94 - "Community 94"
Cohesion: 0.22
Nodes (9): Story 7.2: Day-14 Gate at Layout Level (URL-Unbypassable), AR14, AR18, AR22, Day14Gate, Day14Takeover, FR37, layout.tsx (+1 more)

### Community 95 - "Community 95"
Cohesion: 0.22
Nodes (9): Story 8.1: Offline-Pack Generation Script (Node, Standalone), AR10, AR24, AR28, AR5, FR4, FR5, FR60 (+1 more)

### Community 96 - "Community 96"
Cohesion: 0.29
Nodes (8): Story 2.1: Save Word to Collection, Dexie collection table, HardWordRow save icon flip, InlineErrorSurface storage variant, Story 2.2: Collection Route, /collection route, FR27/FR28 sort and remove, useLiveQuery reactivity

### Community 97 - "Community 97"
Cohesion: 0.29
Nodes (8): Story 3.1: MediaRecorder Wrapper, AR20 single choke point for MediaRecorder, 60s hard cap (UX-DR13), createRecorder() factory, MIME auto-detect webm/mp4, Story 3.3: RecordPanel, dayOfUse stamp on recording, RecordPanel component

### Community 98 - "Community 98"
Cohesion: 0.25
Nodes (8): Story 5.2: Without-Pen Pass Transition and Back-to-Today Affordance, AR22, FR45, FR47, NFR26, page.tsx, UX-DR23, WarmUpDrill

### Community 99 - "Community 99"
Cohesion: 0.25
Nodes (8): Alembic upgrade head, API migrations CI workflow, Postgres 16 service, apps/api FastAPI, ./ax start Path 1, Docker Compose Path 2, README monorepo overview, apps/web Next.js 16

### Community 100 - "Community 100"
Cohesion: 0.33
Nodes (7): Story 3.4: Voice Journal Route, Download naming audiblytics-day-N-HHMM, FR35 list recordings, VoiceJournalList, Story 3.5: Compare Recordings via CompositePlayer, CompositePlayer compare mode, FR36 compare any two recordings

### Community 101 - "Community 101"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, start, test, typecheck

### Community 102 - "Community 102"
Cohesion: 0.43
Nodes (6): ax_ensure_root_env(), ax_load_config(), ax_set_env_var(), ax_sync_api_env(), ax_sync_web_env(), config.sh script

### Community 103 - "Community 103"
Cohesion: 0.40
Nodes (6): Story 2.3: Recycle Saved Words, FR15/FR16 recycle saved words, Dexie paragraphCache table (FR21), Story 4.1: Same-Day Paragraph Cache Reuse, FR19 same-day cache reuse, useParagraphOfTheDay hook

### Community 104 - "Community 104"
Cohesion: 0.33
Nodes (5): do_run_migrations(), get_url(), run_async_migrations(), run_migrations_offline(), run_migrations_online()

### Community 105 - "Community 105"
Cohesion: 0.60
Nodes (3): test_health(), test_login_invalid_password(), test_register_login_and_settings()

### Community 106 - "Community 106"
Cohesion: 0.53
Nodes (4): formatLastPracticedLabel(), formatShortLocalDate(), MONTHS, startOfLocalDay()

### Community 107 - "Community 107"
Cohesion: 0.53
Nodes (4): buildPrompt(), BuildPromptArgs, describePersona(), describeTheme()

### Community 108 - "Community 108"
Cohesion: 0.40
Nodes (5): Practice Defaults (theme, persona, paragraph length, remember last options, reset), Practice Settings Mockup, Sidebar Navigation (Home, Review, Collection, Voice Journal, Stats, Settings group), Advanced Audio Settings Mockup, Audio Controls (pause length, normalize volume, skip silent gaps, fade, default output)

### Community 109 - "Community 109"
Cohesion: 0.40
Nodes (5): Story 15.5: Documentation and Sprint Tracking Hygiene, BVR20 docs hygiene, Retroactive story files for Epics 9-10, sprint-status.yaml epic status hygiene, ux-v2-mockups-addendum.md

### Community 110 - "Community 110"
Cohesion: 0.50
Nodes (3): VoiceJournalNotesCardProps, VoiceJournalNotes, voiceJournalNotesSchema

### Community 111 - "Community 111"
Cohesion: 0.50
Nodes (4): Deferred Work Log, Deferred code review items by story, Sprint Status, Epic and Story Status Tracking

### Community 112 - "Community 112"
Cohesion: 0.50
Nodes (4): Product Brief, Product Brief Distillate, Rejected and Parked Ideas, Personal MVP 1-Week Build

### Community 115 - "Community 115"
Cohesion: 0.50
Nodes (4): Story 13.1: Dockerfile and Production Env Docs, apps/api Dockerfile and production env docs, Story 13.2: Neon Migrations and Seed for Production, Neon migrations and seed

## Knowledge Gaps
- **421 isolated node(s):** `audiblytics-api`, `react-dom`, `shadcn`, `tw-animate-css`, `@next/bundle-analyzer` (+416 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 837 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Story 8.5: OfflineBadge on Calendar Day-Cells and Voice Journal Rows` connect `Offline Pack & IndexedDB` to `Community 54`, `Community 49`, `Community 34`, `Community 46`?**
  _High betweenness centrality (0.279) - this node is a cross-community bridge._
- **What connects `audiblytics-api`, `react-dom`, `shadcn` to the rest of the system?**
  _421 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Recordings` be split into smaller, more focused modules?**
  _Cohesion score 0.053516819571865444 - nodes in this community are weakly interconnected._
- **Why does `Story 9.2: Users Model, JWT Auth Routes, and Seed Script` connect `Offline Pack & IndexedDB` to `Alembic Migrations`?**
  _High betweenness centrality (0.275) - this node is a cross-community bridge._
- **Should `Alembic Migrations` be split into smaller, more focused modules?**
  _Cohesion score 0.10056497175141244 - nodes in this community are weakly interconnected._
- **Should `Settings Layout & Sidebar` be split into smaller, more focused modules?**
  _Cohesion score 0.08078431372549019 - nodes in this community are weakly interconnected._
- **Should `Paragraph API` be split into smaller, more focused modules?**
  _Cohesion score 0.09131205673758866 - nodes in this community are weakly interconnected._