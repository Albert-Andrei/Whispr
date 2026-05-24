/** Translation payloads consumed by generate-i18n-locales.ts */

export type LocaleBundle = {
  common: Record<string, unknown>;
  app: Record<string, unknown>;
  backend: Record<string, unknown>;
};

export const LOCALES: Record<"en" | "ru" | "ro" | "es" | "fr", LocaleBundle> = {
  en: {
    common: {
      actions: {
        cancel: "Cancel",
        delete: "Delete",
        discard: "Discard",
        retry: "Retry",
        view: "View",
        new: "New",
        close: "Close",
        back: "Back",
        tryAgain: "Try again",
        use: "Use",
        download: "Download",
        browseFiles: "Browse files...",
        addToQueue: "Add to queue",
        checkAgain: "Check again",
        copyText: "Copy text",
        copied: "Copied!",
        translate: "Translate",
        copy: "Copy",
      },
      loading: "Loading",
      loadingEllipsis: "Loading…",
      deleting: "Deleting…",
      translating: "Translating…",
      checking: "Checking…",
      downloading: "Downloading…",
      installing: "Installing…",
      or: "or",
      emptyPlaceholder: "—",
      nav: {
        transcriptions: "Transcriptions",
        record: "Record",
        media: "Media",
        settings: "Settings",
        whispr: "Whispr",
      },
      theme: {
        light: "Light",
        dark: "Dark",
        system: "System",
        colorTheme: "Color theme",
        colorThemeDescription:
          "Choose light, dark, or match your system appearance",
      },
      exportFormats: {
        txt: "Plain text",
        txtTimestamps: "Text with timestamps",
        srt: "SRT subtitles",
        pdf: "PDF",
        docx: "Word (DOCX)",
        txtWithExt: "Plain text (.txt)",
        srtWithExt: "Subtitles (.srt)",
        pdfWithExt: "PDF (.pdf)",
        docxWithExt: "Word (.docx)",
      },
      dialogFilters: {
        srt: "SRT",
        pdf: "PDF",
        word: "Word",
        text: "Text",
        videoAudio: "Video & audio",
      },
      models: {
        small: "Small",
        medium: "Medium",
        large: "Large",
        smallTitle: "Small (~466 MB)",
        mediumTitle: "Medium (~1.5 GB)",
        largeTitle: "Large (~3.1 GB)",
        smallHint: "Good quality, faster",
        mediumHint: "Recommended",
        largeHint: "Best quality",
        smallSize: "~466 MB",
        mediumSize: "~1.5 GB",
        largeSize: "~3.1 GB",
        active: "Active",
        downloaded: "Downloaded",
      },
      concurrentJobs: {
        one: "1 job",
        two: "2 jobs",
        three: "3 jobs",
      },
      languages: {
        en: "English",
        ru: "Russian",
        ro: "Romanian",
        es: "Spanish",
        fr: "French",
      },
      translateLanguages: {
        en: "English",
        es: "Spanish",
        fr: "French",
        de: "German",
        it: "Italian",
        pt: "Portuguese",
        ro: "Romanian",
        ru: "Russian",
        uk: "Ukrainian",
        ja: "Japanese",
        zh: "Chinese",
      },
      binaryStatus: {
        installed: "Installed",
        missing: "Missing",
      },
      playback: {
        play: "Play",
        pause: "Pause",
        volume: "Volume",
        rec: "REC",
        paused: "Paused",
        resume: "Resume",
      },
      update: {
        available: "Update available",
        upToDate: "Up to date",
        error: "Error",
        updateAndRestart: "Update & Restart",
        versionAvailable: "v{{version}} available",
        updateAvailableVersion: "Update available: v{{version}}",
        latestRelease: "You are on the latest release",
        couldNotCheck: "Could not check for updates",
        inProgress: "Update in progress…",
        installVersion: "Install v{{version}}",
        downloadingPercent: "Downloading {{percent}}%",
        installingUpdate: "Installing update…",
        downloadingUpdate: "Downloading update… {{percent}}%",
      },
      desktopOnly: {
        sqliteShell:
          "SQLite runs in the desktop shell. Use `bun run tauri dev` instead of the browser-only dev server.",
        settingsShell:
          "Settings that talk to your Mac (binaries, disk usage, models) need the desktop app. Run `bun run tauri dev` instead of the browser-only dev server.",
        recordingShell: "Recording requires the desktop app.",
        playbackShell: "Playback media is available in the desktop app.",
      },
      toasts: {
        recordingSaved: "Recording saved",
      },
      table: {
        name: "Name",
        duration: "Duration",
        date: "Date",
        status: "Status",
        actions: "Actions",
      },
      details: {
        source: "Source",
        created: "Created",
        duration: "Duration",
        model: "Model",
        version: "Version",
        total: "Total",
      },
      sections: {
        actions: "Actions",
        exportAs: "Export as",
        details: "Details",
        about: "About",
        general: "General",
        system: "System",
        storage: "Storage",
        whisperModels: "Whisper models",
      },
      aria: {
        dismissNotification: "Dismiss notification",
        dismissUpdate: "Dismiss update notice",
        resizeSidebar: "Resize sidebar",
        rename: "Rename",
        editTitle: "Edit title",
        clickToRename: "Click to rename",
        backToTranscriptions: "Back to transcriptions",
        startRecording: "Start recording",
        checkingTools: "Checking tools",
        checkingToolsTitle: "Checking tools…",
        diskUsageByCategory: "Disk usage by category",
      },
    },
    app: {
      components: {
        sidebar: {
          updateBadge: "New",
          updateAvailable: "Update available",
        },
        header: {},
        appShell: {
          loading: "Loading…",
        },
        appFileDropLayer: {
          title: "Drop to import",
          subtitle: "Video or audio files",
        },
        themeToggle: {},
        editableFileName: {},
        updatePopover: {},
      },
      dashboard: {
        loading: "Loading your transcriptions…",
        emptyState: {
          title: "No transcriptions yet",
          description:
            "Paste a link or drop a file below. Everything runs offline on your Mac—no API keys.",
        },
        fileList: {},
        fileRow: {},
        transcriptView: {
          recordedBadge: "Recorded",
          translatedTo: "Translated to {{language}}",
          showOriginal: "Show original",
          showingOriginal: "Showing original",
          showTranslation: "Show translation",
          translationNoText: "Translation returned no text. Try again.",
          translationFailed:
            "Translation failed. Check your connection and try again.",
        },
        transcriptSidePanel: {},
        transcriptPlayer: {},
        errors: {
          loadTranscriptions: "Failed to load transcriptions",
          hint: "Check app permissions or restart Whispr.",
        },
      },
      import: {
        modal: {
          title: "New transcription",
          description:
            "Paste a link, or drag in a file — everything stays on your Mac.",
        },
        urlInput: {
          label: "Video URL",
          placeholder: "Paste a YouTube, Vimeo, or other video URL",
          errorEmpty: "Paste a URL first",
          errorInvalid: "That does not look like a valid URL",
        },
        dropZone: {
          title: "Drag & drop video or audio files",
          formats: "MP4, MOV, MKV, WebM, AVI, MP3, WAV, M4A, FLAC, OGG, AAC",
          chooseTitle: "Choose video or audio",
        },
        dropMedia: {
          pathWarning:
            "Some files could not be added because their path was not available. Use Browse to pick files, or drop them from Finder.",
          dialogTitle: "Whispr",
        },
      },
      setup: {
        welcome: {
          title: "Welcome to Whispr",
          description:
            "One-time setup downloads ffmpeg, yt-dlp, and your chosen Whisper model. If whisper-cli is not already on your Mac, Whispr installs it via Homebrew for you (you need Homebrew from brew.sh). You can change the model later in Settings.",
          offlineNote:
            "After setup, transcription works offline. Internet is only required during this download step.",
        },
        model: {
          chooseLabel: "Choose model (multilingual)",
        },
        button: {
          setup: "Set up Whispr",
        },
        loading: {
          title: "Downloading components…",
          homebrewNote:
            "The transcription step may run Homebrew to install whisper-cpp — first time can take several minutes.",
        },
        component: {
          ffmpeg: "ffmpeg — audio/video",
          ytdlp: "yt-dlp — URL download",
          whisperCli: "whisper-cli — transcription",
          model: "Whisper model",
        },
      },
      settings: {
        title: "Settings",
        browserOnly:
          "Settings that talk to your Mac (binaries, disk usage, models) need the desktop app. Run `bun run tauri dev` instead of the browser-only dev server.",
        storageDescription: "Rough breakdown of disk usage for this app",
        general: {
          language: {
            label: "Language",
            description: "Choose the language for Whispr's interface",
          },
          exportFormat: {
            label: "Default export format",
            description:
              "Format used when exporting transcripts from the dashboard",
          },
          concurrent: {
            label: "Concurrent transcriptions",
            description: "How many jobs can run at the same time (1–3)",
          },
        },
        about: {},
        binaryStatus: {
          loading: "Loading…",
          checkingToolStatus: "Checking tool status",
          requiredMissing:
            "Required component. Whispr cannot transcribe without it.",
        },
        modelSelector: {},
        diskBreakdown: {
          noData: "No usage data yet.",
          tooltip: "{{label}} · {{size}} ({{percent}}%)",
        },
      },
      record: {
        loading: "Loading recordings…",
        emptyState: {
          title: "Record",
          description:
            "Capture speech with live transcription. Your recording is saved locally and finalized when you stop. Tap the mic button below to begin.",
        },
        live: {
          placeholder: "Start speaking to see live transcription…",
        },
        controls: {
          stopAndSave: "Stop and save",
          discardRecording: "Discard recording",
        },
        navGuard: {
          title: "Recording in progress",
          description:
            "Stop and save your recording, discard it, or stay here to continue.",
          stopAndSave: "Stop & save",
        },
        errors: {
          startFailed: "Could not start recording",
          loadFailed: "Failed to load recordings",
          saveFailed: "Could not save recording",
          desktopRequired: "Recording requires the desktop app.",
        },
      },
      media: {
        browserOnly: "Playback media is available in the desktop app.",
        loading: "Loading media…",
        description:
          "Compact audio copies for in-app playback. Deleting a file frees disk space; transcripts stay, but playback and segment sync depend on these files.",
        syncedPlayback: "Synced playback",
        emptyState: {
          title: "Playback audio",
          description:
            "Whispr keeps compact copies of your audio here so you can listen inside the app and follow along with timestamped transcript segments.",
          bullet1:
            "Files appear after a transcription finishes or you stop a recording.",
          bullet2:
            "Deleting audio frees disk space. Your transcript text stays; only playback and segment sync are removed.",
          hint: "Import media or record from the other sidebar tabs to get started.",
        },
        delete: {
          title: "Delete playback audio?",
          willRemove: "{{filename}} will be removed from disk.",
          transcriptStays:
            "Your transcript text stays in Whispr, but you will lose in-app playback",
          syncLoss: " and timestamp sync with transcript segments",
          retranscribe: " for this item until you transcribe the source again.",
          confirm: "Delete audio",
          thisFile: "This file",
        },
        errors: {
          loadFailed: "Could not load media",
          deleteFailed: "Could not delete media",
        },
      },
    },
    backend: {
      jobStatus: {
        pending: "Pending",
        processing: "Processing",
        completed: "Completed",
        failed: "Failed",
      },
      pipelineStage: {
        downloading: "Downloading",
        extracting: "Extracting",
        transcribing: "Transcribing",
        progress: "{{stage}} · {{percent}}%",
      },
      disk: {
        binaries: "Tools (ffmpeg, yt-dlp)",
        models: "Whisper models",
        audio: "Playback audio",
        database: "Database",
        temp: "Temporary files",
        app_core: "App executable",
      },
      sourceType: {
        local: "Local file",
        url: "URL",
        record: "Recording",
        urlImport: "URL import",
        transcription: "Transcription",
        unknown: "Unknown",
      },
    },
  },

  ru: {
    common: {
      actions: {
        cancel: "Отмена",
        delete: "Удалить",
        discard: "Отменить запись",
        retry: "Повторить",
        view: "Открыть",
        new: "Создать",
        close: "Закрыть",
        back: "Назад",
        tryAgain: "Попробовать снова",
        use: "Использовать",
        download: "Скачать",
        browseFiles: "Выбрать файлы...",
        addToQueue: "Добавить в очередь",
        checkAgain: "Проверить снова",
        copyText: "Копировать текст",
        copied: "Скопировано!",
        translate: "Перевести",
        copy: "Копировать",
      },
      loading: "Загрузка",
      loadingEllipsis: "Загрузка…",
      deleting: "Удаление…",
      translating: "Перевод…",
      checking: "Проверка…",
      downloading: "Загрузка…",
      installing: "Установка…",
      or: "или",
      emptyPlaceholder: "—",
      nav: {
        transcriptions: "Транскрипции",
        record: "Запись",
        media: "Медиа",
        settings: "Настройки",
        whispr: "Whispr",
      },
      theme: {
        light: "Светлая",
        dark: "Тёмная",
        system: "Системная",
        colorTheme: "Цветовая тема",
        colorThemeDescription:
          "Выберите светлую, тёмную или системную тему оформления",
      },
      exportFormats: {
        txt: "Обычный текст",
        txtTimestamps: "Текст с метками времени",
        srt: "Субтитры SRT",
        pdf: "PDF",
        docx: "Word (DOCX)",
        txtWithExt: "Обычный текст (.txt)",
        srtWithExt: "Субтитры (.srt)",
        pdfWithExt: "PDF (.pdf)",
        docxWithExt: "Word (.docx)",
      },
      dialogFilters: {
        srt: "SRT",
        pdf: "PDF",
        word: "Word",
        text: "Текст",
        videoAudio: "Видео и аудио",
      },
      models: {
        small: "Малая",
        medium: "Средняя",
        large: "Большая",
        smallTitle: "Малая (~466 МБ)",
        mediumTitle: "Средняя (~1,5 ГБ)",
        largeTitle: "Большая (~3,1 ГБ)",
        smallHint: "Хорошее качество, быстрее",
        mediumHint: "Рекомендуется",
        largeHint: "Лучшее качество",
        smallSize: "~466 МБ",
        mediumSize: "~1,5 ГБ",
        largeSize: "~3,1 ГБ",
        active: "Активная",
        downloaded: "Загружена",
      },
      concurrentJobs: {
        one: "1 задача",
        two: "2 задачи",
        three: "3 задачи",
      },
      languages: {
        en: "Английский",
        ru: "Русский",
        ro: "Румынский",
        es: "Испанский",
        fr: "Французский",
      },
      translateLanguages: {
        en: "Английский",
        es: "Испанский",
        fr: "Французский",
        de: "Немецкий",
        it: "Итальянский",
        pt: "Португальский",
        ro: "Румынский",
        ru: "Русский",
        uk: "Украинский",
        ja: "Японский",
        zh: "Китайский",
      },
      binaryStatus: {
        installed: "Установлено",
        missing: "Отсутствует",
      },
      playback: {
        play: "Воспроизвести",
        pause: "Пауза",
        volume: "Громкость",
        rec: "ЗАП",
        paused: "Пауза",
        resume: "Продолжить",
      },
      update: {
        available: "Доступно обновление",
        upToDate: "Актуальная версия",
        error: "Ошибка",
        updateAndRestart: "Обновить и перезапустить",
        versionAvailable: "Доступна v{{version}}",
        updateAvailableVersion: "Доступно обновление: v{{version}}",
        latestRelease: "У вас установлена последняя версия",
        couldNotCheck: "Не удалось проверить обновления",
        inProgress: "Обновление выполняется…",
        installVersion: "Установить v{{version}}",
        downloadingPercent: "Загрузка {{percent}}%",
        installingUpdate: "Установка обновления…",
        downloadingUpdate: "Загрузка обновления… {{percent}}%",
      },
      desktopOnly: {
        sqliteShell:
          "SQLite работает в десктопной оболочке. Используйте `bun run tauri dev` вместо браузерного dev-сервера.",
        settingsShell:
          "Настройки, связанные с вашим Mac (бинарники, диск, модели), доступны только в десктопном приложении. Запустите `bun run tauri dev` вместо браузерного dev-сервера.",
        recordingShell: "Запись доступна только в десктопном приложении.",
        playbackShell:
          "Воспроизведение медиа доступно только в десктопном приложении.",
      },
      toasts: {
        recordingSaved: "Запись сохранена",
      },
      table: {
        name: "Имя",
        duration: "Длительность",
        date: "Дата",
        status: "Статус",
        actions: "Действия",
      },
      details: {
        source: "Источник",
        created: "Создано",
        duration: "Длительность",
        model: "Модель",
        version: "Версия",
        total: "Итого",
      },
      sections: {
        actions: "Действия",
        exportAs: "Экспорт как",
        details: "Сведения",
        about: "О приложении",
        general: "Общие",
        system: "Система",
        storage: "Хранилище",
        whisperModels: "Модели Whisper",
      },
      aria: {
        dismissNotification: "Закрыть уведомление",
        dismissUpdate: "Закрыть уведомление об обновлении",
        resizeSidebar: "Изменить ширину боковой панели",
        rename: "Переименовать",
        editTitle: "Редактировать название",
        clickToRename: "Нажмите, чтобы переименовать",
        backToTranscriptions: "Назад к транскрипциям",
        startRecording: "Начать запись",
        checkingTools: "Проверка инструментов",
        checkingToolsTitle: "Проверка инструментов…",
        diskUsageByCategory: "Использование диска по категориям",
      },
    },
    app: {
      components: {
        sidebar: {
          updateBadge: "Новое",
          updateAvailable: "Доступно обновление",
        },
        header: {},
        appShell: { loading: "Загрузка…" },
        appFileDropLayer: {
          title: "Перетащите для импорта",
          subtitle: "Видео- или аудиофайлы",
        },
        themeToggle: {},
        editableFileName: {},
        updatePopover: {},
      },
      dashboard: {
        loading: "Загрузка транскрипций…",
        emptyState: {
          title: "Транскрипций пока нет",
          description:
            "Вставьте ссылку или перетащите файл ниже. Всё работает офлайн на вашем Mac — без API-ключей.",
        },
        fileList: {},
        fileRow: {},
        transcriptView: {
          recordedBadge: "Запись",
          translatedTo: "Переведено на {{language}}",
          showOriginal: "Показать оригинал",
          showingOriginal: "Показан оригинал",
          showTranslation: "Показать перевод",
          translationNoText: "Перевод не вернул текст. Попробуйте снова.",
          translationFailed:
            "Не удалось перевести. Проверьте подключение и попробуйте снова.",
        },
        transcriptSidePanel: {},
        transcriptPlayer: {},
        errors: {
          loadTranscriptions: "Не удалось загрузить транскрипции",
          hint: "Проверьте разрешения приложения или перезапустите Whispr.",
        },
      },
      import: {
        modal: {
          title: "Новая транскрипция",
          description:
            "Вставьте ссылку или перетащите файл — всё остаётся на вашем Mac.",
        },
        urlInput: {
          label: "URL видео",
          placeholder: "Вставьте ссылку на YouTube, Vimeo или другое видео",
          errorEmpty: "Сначала вставьте URL",
          errorInvalid: "Похоже, это недействительный URL",
        },
        dropZone: {
          title: "Перетащите видео- или аудиофайлы",
          formats: "MP4, MOV, MKV, WebM, AVI, MP3, WAV, M4A, FLAC, OGG, AAC",
          chooseTitle: "Выберите видео или аудио",
        },
        dropMedia: {
          pathWarning:
            "Некоторые файлы не удалось добавить: путь недоступен. Используйте «Выбрать файлы» или перетащите из Finder.",
          dialogTitle: "Whispr",
        },
      },
      setup: {
        welcome: {
          title: "Добро пожаловать в Whispr",
          description:
            "При первой настройке загружаются ffmpeg, yt-dlp и выбранная модель Whisper. Если whisper-cli ещё не установлен на Mac, Whispr установит его через Homebrew (нужен Homebrew с brew.sh). Модель можно сменить позже в настройках.",
          offlineNote:
            "После настройки транскрипция работает офлайн. Интернет нужен только на этапе загрузки.",
        },
        model: { chooseLabel: "Выберите модель (многоязычная)" },
        button: { setup: "Настроить Whispr" },
        loading: {
          title: "Загрузка компонентов…",
          homebrewNote:
            "На этапе транскрипции может запуститься Homebrew для установки whisper-cpp — в первый раз это может занять несколько минут.",
        },
        component: {
          ffmpeg: "ffmpeg — аудио/видео",
          ytdlp: "yt-dlp — загрузка по URL",
          whisperCli: "whisper-cli — транскрипция",
          model: "Модель Whisper",
        },
      },
      settings: {
        title: "Настройки",
        browserOnly:
          "Настройки, связанные с вашим Mac (бинарники, диск, модели), доступны только в десктопном приложении. Запустите `bun run tauri dev` вместо браузерного dev-сервера.",
        storageDescription: "Примерное использование диска этим приложением",
        general: {
          language: {
            label: "Язык",
            description: "Выберите язык интерфейса Whispr",
          },
          exportFormat: {
            label: "Формат экспорта по умолчанию",
            description: "Формат при экспорте транскриптов с панели",
          },
          concurrent: {
            label: "Параллельные транскрипции",
            description: "Сколько задач могут выполняться одновременно (1–3)",
          },
        },
        about: {},
        binaryStatus: {
          loading: "Загрузка…",
          checkingToolStatus: "Проверка состояния инструментов",
          requiredMissing:
            "Обязательный компонент. Без него Whispr не сможет транскрибировать.",
        },
        modelSelector: {},
        diskBreakdown: {
          noData: "Данных об использовании пока нет.",
          tooltip: "{{label}} · {{size}} ({{percent}}%)",
        },
      },
      record: {
        loading: "Загрузка записей…",
        emptyState: {
          title: "Запись",
          description:
            "Записывайте речь с живой транскрипцией. Запись сохраняется локально и завершается при остановке. Нажмите кнопку микрофона ниже, чтобы начать.",
        },
        live: {
          placeholder: "Начните говорить, чтобы увидеть живую транскрипцию…",
        },
        controls: {
          stopAndSave: "Остановить и сохранить",
          discardRecording: "Отменить запись",
        },
        navGuard: {
          title: "Идёт запись",
          description:
            "Остановите и сохраните запись, отмените её или останьтесь здесь.",
          stopAndSave: "Остановить и сохранить",
        },
        errors: {
          startFailed: "Не удалось начать запись",
          loadFailed: "Не удалось загрузить записи",
          saveFailed: "Не удалось сохранить запись",
          desktopRequired: "Запись доступна только в десктопном приложении.",
        },
      },
      media: {
        browserOnly:
          "Воспроизведение медиа доступно только в десктопном приложении.",
        loading: "Загрузка медиа…",
        description:
          "Компактные копии аудио для воспроизведения в приложении. Удаление файла освобождает место; текст транскрипции остаётся, но воспроизведение и синхронизация сегментов зависят от этих файлов.",
        syncedPlayback: "Синхронизированное воспроизведение",
        emptyState: {
          title: "Аудио для воспроизведения",
          description:
            "Whispr хранит здесь компактные копии аудио, чтобы вы могли слушать в приложении и следить за сегментами транскрипции с метками времени.",
          bullet1:
            "Файлы появляются после завершения транскрипции или остановки записи.",
          bullet2:
            "Удаление аудио освобождает место. Текст транскрипции остаётся; удаляются только воспроизведение и синхронизация сегментов.",
          hint: "Импортируйте медиа или запишите аудио на других вкладках боковой панели.",
        },
        delete: {
          title: "Удалить аудио для воспроизведения?",
          willRemove: "{{filename}} будет удалён с диска.",
          transcriptStays:
            "Текст транскрипции останется в Whispr, но вы потеряете воспроизведение в приложении",
          syncLoss: " и синхронизацию сегментов с метками времени",
          retranscribe:
            " для этого элемента, пока не транскрибируете источник снова.",
          confirm: "Удалить аудио",
          thisFile: "Этот файл",
        },
        errors: {
          loadFailed: "Не удалось загрузить медиа",
          deleteFailed: "Не удалось удалить медиа",
        },
      },
    },
    backend: {
      jobStatus: {
        pending: "В очереди",
        processing: "Обработка",
        completed: "Завершено",
        failed: "Ошибка",
      },
      pipelineStage: {
        downloading: "Загрузка",
        extracting: "Извлечение",
        transcribing: "Транскрипция",
        progress: "{{stage}} · {{percent}}%",
      },
      disk: {
        binaries: "Инструменты (ffmpeg, yt-dlp)",
        models: "Модели Whisper",
        audio: "Аудио для воспроизведения",
        database: "База данных",
        temp: "Временные файлы",
        app_core: "Исполняемый файл приложения",
      },
      sourceType: {
        local: "Локальный файл",
        url: "URL",
        record: "Запись",
        urlImport: "Импорт по URL",
        transcription: "Транскрипция",
        unknown: "Неизвестно",
      },
    },
  },

  ro: {
    common: {
      actions: {
        cancel: "Anulează",
        delete: "Șterge",
        discard: "Renunță",
        retry: "Reîncearcă",
        view: "Vezi",
        new: "Nou",
        close: "Închide",
        back: "Înapoi",
        tryAgain: "Încearcă din nou",
        use: "Folosește",
        download: "Descarcă",
        browseFiles: "Alege fișiere...",
        addToQueue: "Adaugă în coadă",
        checkAgain: "Verifică din nou",
        copyText: "Copiază textul",
        copied: "Copiat!",
        translate: "Traduce",
        copy: "Copiază",
      },
      loading: "Se încarcă",
      loadingEllipsis: "Se încarcă…",
      deleting: "Se șterge…",
      translating: "Se traduce…",
      checking: "Se verifică…",
      downloading: "Se descarcă…",
      installing: "Se instalează…",
      or: "sau",
      emptyPlaceholder: "—",
      nav: {
        transcriptions: "Transcrieri",
        record: "Înregistrează",
        media: "Media",
        settings: "Setări",
        whispr: "Whispr",
      },
      theme: {
        light: "Deschis",
        dark: "Întunecat",
        system: "Sistem",
        colorTheme: "Temă de culoare",
        colorThemeDescription:
          "Alege tema deschisă, întunecată sau cea a sistemului",
      },
      exportFormats: {
        txt: "Text simplu",
        txtTimestamps: "Text cu marcaje temporale",
        srt: "Subtitrări SRT",
        pdf: "PDF",
        docx: "Word (DOCX)",
        txtWithExt: "Text simplu (.txt)",
        srtWithExt: "Subtitrări (.srt)",
        pdfWithExt: "PDF (.pdf)",
        docxWithExt: "Word (.docx)",
      },
      dialogFilters: {
        srt: "SRT",
        pdf: "PDF",
        word: "Word",
        text: "Text",
        videoAudio: "Video și audio",
      },
      models: {
        small: "Mică",
        medium: "Medie",
        large: "Mare",
        smallTitle: "Mică (~466 MB)",
        mediumTitle: "Medie (~1,5 GB)",
        largeTitle: "Mare (~3,1 GB)",
        smallHint: "Calitate bună, mai rapid",
        mediumHint: "Recomandat",
        largeHint: "Cea mai bună calitate",
        smallSize: "~466 MB",
        mediumSize: "~1,5 GB",
        largeSize: "~3,1 GB",
        active: "Activă",
        downloaded: "Descărcată",
      },
      concurrentJobs: {
        one: "1 job",
        two: "2 joburi",
        three: "3 joburi",
      },
      languages: {
        en: "Engleză",
        ru: "Rusă",
        ro: "Română",
        es: "Spaniolă",
        fr: "Franceză",
      },
      translateLanguages: {
        en: "Engleză",
        es: "Spaniolă",
        fr: "Franceză",
        de: "Germană",
        it: "Italiană",
        pt: "Portugheză",
        ro: "Română",
        ru: "Rusă",
        uk: "Ucraineană",
        ja: "Japoneză",
        zh: "Chineză",
      },
      binaryStatus: {
        installed: "Instalat",
        missing: "Lipsă",
      },
      playback: {
        play: "Redă",
        pause: "Pauză",
        volume: "Volum",
        rec: "REC",
        paused: "În pauză",
        resume: "Continuă",
      },
      update: {
        available: "Actualizare disponibilă",
        upToDate: "La zi",
        error: "Eroare",
        updateAndRestart: "Actualizează și repornește",
        versionAvailable: "v{{version}} disponibilă",
        updateAvailableVersion: "Actualizare disponibilă: v{{version}}",
        latestRelease: "Ai cea mai recentă versiune",
        couldNotCheck: "Nu s-au putut verifica actualizările",
        inProgress: "Actualizare în curs…",
        installVersion: "Instalează v{{version}}",
        downloadingPercent: "Se descarcă {{percent}}%",
        installingUpdate: "Se instalează actualizarea…",
        downloadingUpdate: "Se descarcă actualizarea… {{percent}}%",
      },
      desktopOnly: {
        sqliteShell:
          "SQLite rulează în aplicația desktop. Folosește `bun run tauri dev` în loc de serverul de dezvoltare din browser.",
        settingsShell:
          "Setările care accesează Mac-ul (binare, spațiu pe disc, modele) necesită aplicația desktop. Rulează `bun run tauri dev` în loc de serverul din browser.",
        recordingShell: "Înregistrarea necesită aplicația desktop.",
        playbackShell: "Redarea media este disponibilă în aplicația desktop.",
      },
      toasts: {
        recordingSaved: "Înregistrare salvată",
      },
      table: {
        name: "Nume",
        duration: "Durată",
        date: "Dată",
        status: "Stare",
        actions: "Acțiuni",
      },
      details: {
        source: "Sursă",
        created: "Creat",
        duration: "Durată",
        model: "Model",
        version: "Versiune",
        total: "Total",
      },
      sections: {
        actions: "Acțiuni",
        exportAs: "Exportă ca",
        details: "Detalii",
        about: "Despre",
        general: "General",
        system: "Sistem",
        storage: "Stocare",
        whisperModels: "Modele Whisper",
      },
      aria: {
        dismissNotification: "Închide notificarea",
        dismissUpdate: "Închide notificarea de actualizare",
        resizeSidebar: "Redimensionează bara laterală",
        rename: "Redenumește",
        editTitle: "Editează titlul",
        clickToRename: "Clic pentru a redenumi",
        backToTranscriptions: "Înapoi la transcrieri",
        startRecording: "Începe înregistrarea",
        checkingTools: "Se verifică instrumentele",
        checkingToolsTitle: "Se verifică instrumentele…",
        diskUsageByCategory: "Utilizarea discului pe categorii",
      },
    },
    app: {
      components: {
        sidebar: {
          updateBadge: "Nou",
          updateAvailable: "Actualizare disponibilă",
        },
        header: {},
        appShell: { loading: "Se încarcă…" },
        appFileDropLayer: {
          title: "Trage pentru a importa",
          subtitle: "Fișiere video sau audio",
        },
        themeToggle: {},
        editableFileName: {},
        updatePopover: {},
      },
      dashboard: {
        loading: "Se încarcă transcrierile…",
        emptyState: {
          title: "Nicio transcriere încă",
          description:
            "Lipește un link sau trage un fișier mai jos. Totul rulează offline pe Mac-ul tău — fără chei API.",
        },
        fileList: {},
        fileRow: {},
        transcriptView: {
          recordedBadge: "Înregistrat",
          translatedTo: "Tradus în {{language}}",
          showOriginal: "Arată originalul",
          showingOriginal: "Se afișează originalul",
          showTranslation: "Arată traducerea",
          translationNoText: "Traducerea nu a returnat text. Încearcă din nou.",
          translationFailed:
            "Traducerea a eșuat. Verifică conexiunea și încearcă din nou.",
        },
        transcriptSidePanel: {},
        transcriptPlayer: {},
        errors: {
          loadTranscriptions: "Nu s-au putut încărca transcrierile",
          hint: "Verifică permisiunile aplicației sau repornește Whispr.",
        },
      },
      import: {
        modal: {
          title: "Transcriere nouă",
          description:
            "Lipește un link sau trage un fișier — totul rămâne pe Mac-ul tău.",
        },
        urlInput: {
          label: "URL video",
          placeholder: "Lipește un URL YouTube, Vimeo sau alt video",
          errorEmpty: "Lipește mai întâi un URL",
          errorInvalid: "Nu pare a fi un URL valid",
        },
        dropZone: {
          title: "Trage și plasează fișiere video sau audio",
          formats: "MP4, MOV, MKV, WebM, AVI, MP3, WAV, M4A, FLAC, OGG, AAC",
          chooseTitle: "Alege video sau audio",
        },
        dropMedia: {
          pathWarning:
            "Unele fișiere nu au putut fi adăugate deoarece calea nu era disponibilă. Folosește Alege sau trage din Finder.",
          dialogTitle: "Whispr",
        },
      },
      setup: {
        welcome: {
          title: "Bun venit la Whispr",
          description:
            "Configurarea inițială descarcă ffmpeg, yt-dlp și modelul Whisper ales. Dacă whisper-cli nu este deja pe Mac, Whispr îl instalează prin Homebrew (ai nevoie de Homebrew de la brew.sh). Poți schimba modelul mai târziu în Setări.",
          offlineNote:
            "După configurare, transcrierea funcționează offline. Internetul este necesar doar la descărcare.",
        },
        model: { chooseLabel: "Alege modelul (multilingv)" },
        button: { setup: "Configurează Whispr" },
        loading: {
          title: "Se descarcă componentele…",
          homebrewNote:
            "Pasul de transcriere poate rula Homebrew pentru a instala whisper-cpp — prima dată poate dura câteva minute.",
        },
        component: {
          ffmpeg: "ffmpeg — audio/video",
          ytdlp: "yt-dlp — descărcare URL",
          whisperCli: "whisper-cli — transcriere",
          model: "Model Whisper",
        },
      },
      settings: {
        title: "Setări",
        browserOnly:
          "Setările care accesează Mac-ul (binare, spațiu pe disc, modele) necesită aplicația desktop. Rulează `bun run tauri dev` în loc de serverul din browser.",
        storageDescription: "Estimare a spațiului pe disc folosit de aplicație",
        general: {
          language: {
            label: "Limbă",
            description: "Alege limba interfeței Whispr",
          },
          exportFormat: {
            label: "Format de export implicit",
            description:
              "Formatul folosit la exportul transcrierilor din panou",
          },
          concurrent: {
            label: "Transcrieri simultane",
            description: "Câte joburi pot rula în același timp (1–3)",
          },
        },
        about: {},
        binaryStatus: {
          loading: "Se încarcă…",
          checkingToolStatus: "Se verifică starea instrumentelor",
          requiredMissing:
            "Componentă obligatorie. Whispr nu poate transcrie fără ea.",
        },
        modelSelector: {},
        diskBreakdown: {
          noData: "Nu există date de utilizare încă.",
          tooltip: "{{label}} · {{size}} ({{percent}}%)",
        },
      },
      record: {
        loading: "Se încarcă înregistrările…",
        emptyState: {
          title: "Înregistrează",
          description:
            "Capturează vorbirea cu transcriere live. Înregistrarea se salvează local și se finalizează când oprești. Apasă butonul de microfon de mai jos pentru a începe.",
        },
        live: {
          placeholder: "Începe să vorbești pentru transcriere live…",
        },
        controls: {
          stopAndSave: "Oprește și salvează",
          discardRecording: "Renunță la înregistrare",
        },
        navGuard: {
          title: "Înregistrare în curs",
          description:
            "Oprește și salvează înregistrarea, renunță la ea sau rămâi aici.",
          stopAndSave: "Oprește și salvează",
        },
        errors: {
          startFailed: "Nu s-a putut începe înregistrarea",
          loadFailed: "Nu s-au putut încărca înregistrările",
          saveFailed: "Nu s-a putut salva înregistrarea",
          desktopRequired: "Înregistrarea necesită aplicația desktop.",
        },
      },
      media: {
        browserOnly: "Redarea media este disponibilă în aplicația desktop.",
        loading: "Se încarcă media…",
        description:
          "Copii audio compacte pentru redare în aplicație. Ștergerea unui fișier eliberează spațiu; transcrierile rămân, dar redarea și sincronizarea segmentelor depind de aceste fișiere.",
        syncedPlayback: "Redare sincronizată",
        emptyState: {
          title: "Audio pentru redare",
          description:
            "Whispr păstrează aici copii compacte ale audio-ului ca să poți asculta în aplicație și urmări segmentele transcrierii cu marcaje temporale.",
          bullet1:
            "Fișierele apar după ce o transcriere se termină sau oprești o înregistrare.",
          bullet2:
            "Ștergerea audio-ului eliberează spațiu. Textul transcrierii rămâne; se elimină doar redarea și sincronizarea segmentelor.",
          hint: "Importă media sau înregistrează din celelalte file ale barei laterale.",
        },
        delete: {
          title: "Ștergi audio-ul pentru redare?",
          willRemove: "{{filename}} va fi eliminat de pe disc.",
          transcriptStays:
            "Textul transcrierii rămâne în Whispr, dar vei pierde redarea în aplicație",
          syncLoss: " și sincronizarea segmentelor cu marcaje temporale",
          retranscribe: " pentru acest element până transcrii din nou sursa.",
          confirm: "Șterge audio",
          thisFile: "Acest fișier",
        },
        errors: {
          loadFailed: "Nu s-a putut încărca media",
          deleteFailed: "Nu s-a putut șterge media",
        },
      },
    },
    backend: {
      jobStatus: {
        pending: "În așteptare",
        processing: "Se procesează",
        completed: "Finalizat",
        failed: "Eșuat",
      },
      pipelineStage: {
        downloading: "Se descarcă",
        extracting: "Se extrage",
        transcribing: "Se transcrie",
        progress: "{{stage}} · {{percent}}%",
      },
      disk: {
        binaries: "Instrumente (ffmpeg, yt-dlp)",
        models: "Modele Whisper",
        audio: "Audio pentru redare",
        database: "Bază de date",
        temp: "Fișiere temporare",
        app_core: "Executabil aplicație",
      },
      sourceType: {
        local: "Fișier local",
        url: "URL",
        record: "Înregistrare",
        urlImport: "Import URL",
        transcription: "Transcriere",
        unknown: "Necunoscut",
      },
    },
  },

  es: {
    common: {
      actions: {
        cancel: "Cancelar",
        delete: "Eliminar",
        discard: "Descartar",
        retry: "Reintentar",
        view: "Ver",
        new: "Nuevo",
        close: "Cerrar",
        back: "Atrás",
        tryAgain: "Intentar de nuevo",
        use: "Usar",
        download: "Descargar",
        browseFiles: "Explorar archivos...",
        addToQueue: "Añadir a la cola",
        checkAgain: "Comprobar de nuevo",
        copyText: "Copiar texto",
        copied: "¡Copiado!",
        translate: "Traducir",
        copy: "Copiar",
      },
      loading: "Cargando",
      loadingEllipsis: "Cargando…",
      deleting: "Eliminando…",
      translating: "Traduciendo…",
      checking: "Comprobando…",
      downloading: "Descargando…",
      installing: "Instalando…",
      or: "o",
      emptyPlaceholder: "—",
      nav: {
        transcriptions: "Transcripciones",
        record: "Grabar",
        media: "Medios",
        settings: "Ajustes",
        whispr: "Whispr",
      },
      theme: {
        light: "Claro",
        dark: "Oscuro",
        system: "Sistema",
        colorTheme: "Tema de color",
        colorThemeDescription: "Elige tema claro, oscuro o el del sistema",
      },
      exportFormats: {
        txt: "Texto plano",
        txtTimestamps: "Texto con marcas de tiempo",
        srt: "Subtítulos SRT",
        pdf: "PDF",
        docx: "Word (DOCX)",
        txtWithExt: "Texto plano (.txt)",
        srtWithExt: "Subtítulos (.srt)",
        pdfWithExt: "PDF (.pdf)",
        docxWithExt: "Word (.docx)",
      },
      dialogFilters: {
        srt: "SRT",
        pdf: "PDF",
        word: "Word",
        text: "Texto",
        videoAudio: "Vídeo y audio",
      },
      models: {
        small: "Pequeño",
        medium: "Mediano",
        large: "Grande",
        smallTitle: "Pequeño (~466 MB)",
        mediumTitle: "Mediano (~1,5 GB)",
        largeTitle: "Grande (~3,1 GB)",
        smallHint: "Buena calidad, más rápido",
        mediumHint: "Recomendado",
        largeHint: "Mejor calidad",
        smallSize: "~466 MB",
        mediumSize: "~1,5 GB",
        largeSize: "~3,1 GB",
        active: "Activo",
        downloaded: "Descargado",
      },
      concurrentJobs: {
        one: "1 trabajo",
        two: "2 trabajos",
        three: "3 trabajos",
      },
      languages: {
        en: "Inglés",
        ru: "Ruso",
        ro: "Rumano",
        es: "Español",
        fr: "Francés",
      },
      translateLanguages: {
        en: "Inglés",
        es: "Español",
        fr: "Francés",
        de: "Alemán",
        it: "Italiano",
        pt: "Portugués",
        ro: "Rumano",
        ru: "Ruso",
        uk: "Ucraniano",
        ja: "Japonés",
        zh: "Chino",
      },
      binaryStatus: {
        installed: "Instalado",
        missing: "Falta",
      },
      playback: {
        play: "Reproducir",
        pause: "Pausa",
        volume: "Volumen",
        rec: "GRAB",
        paused: "En pausa",
        resume: "Reanudar",
      },
      update: {
        available: "Actualización disponible",
        upToDate: "Al día",
        error: "Error",
        updateAndRestart: "Actualizar y reiniciar",
        versionAvailable: "v{{version}} disponible",
        updateAvailableVersion: "Actualización disponible: v{{version}}",
        latestRelease: "Tienes la última versión",
        couldNotCheck: "No se pudieron comprobar las actualizaciones",
        inProgress: "Actualización en curso…",
        installVersion: "Instalar v{{version}}",
        downloadingPercent: "Descargando {{percent}}%",
        installingUpdate: "Instalando actualización…",
        downloadingUpdate: "Descargando actualización… {{percent}}%",
      },
      desktopOnly: {
        sqliteShell:
          "SQLite funciona en la aplicación de escritorio. Usa `bun run tauri dev` en lugar del servidor de desarrollo del navegador.",
        settingsShell:
          "Los ajustes que acceden a tu Mac (binarios, disco, modelos) requieren la app de escritorio. Ejecuta `bun run tauri dev` en lugar del servidor del navegador.",
        recordingShell: "La grabación requiere la aplicación de escritorio.",
        playbackShell:
          "La reproducción de medios está disponible en la aplicación de escritorio.",
      },
      toasts: {
        recordingSaved: "Grabación guardada",
      },
      table: {
        name: "Nombre",
        duration: "Duración",
        date: "Fecha",
        status: "Estado",
        actions: "Acciones",
      },
      details: {
        source: "Origen",
        created: "Creado",
        duration: "Duración",
        model: "Modelo",
        version: "Versión",
        total: "Total",
      },
      sections: {
        actions: "Acciones",
        exportAs: "Exportar como",
        details: "Detalles",
        about: "Acerca de",
        general: "General",
        system: "Sistema",
        storage: "Almacenamiento",
        whisperModels: "Modelos Whisper",
      },
      aria: {
        dismissNotification: "Descartar notificación",
        dismissUpdate: "Descartar aviso de actualización",
        resizeSidebar: "Redimensionar barra lateral",
        rename: "Renombrar",
        editTitle: "Editar título",
        clickToRename: "Clic para renombrar",
        backToTranscriptions: "Volver a transcripciones",
        startRecording: "Iniciar grabación",
        checkingTools: "Comprobando herramientas",
        checkingToolsTitle: "Comprobando herramientas…",
        diskUsageByCategory: "Uso de disco por categoría",
      },
    },
    app: {
      components: {
        sidebar: {
          updateBadge: "Nuevo",
          updateAvailable: "Actualización disponible",
        },
        header: {},
        appShell: { loading: "Cargando…" },
        appFileDropLayer: {
          title: "Suelta para importar",
          subtitle: "Archivos de vídeo o audio",
        },
        themeToggle: {},
        editableFileName: {},
        updatePopover: {},
      },
      dashboard: {
        loading: "Cargando tus transcripciones…",
        emptyState: {
          title: "Aún no hay transcripciones",
          description:
            "Pega un enlace o suelta un archivo abajo. Todo funciona sin conexión en tu Mac, sin claves API.",
        },
        fileList: {},
        fileRow: {},
        transcriptView: {
          recordedBadge: "Grabado",
          translatedTo: "Traducido al {{language}}",
          showOriginal: "Mostrar original",
          showingOriginal: "Mostrando original",
          showTranslation: "Mostrar traducción",
          translationNoText:
            "La traducción no devolvió texto. Inténtalo de nuevo.",
          translationFailed:
            "Error al traducir. Comprueba tu conexión e inténtalo de nuevo.",
        },
        transcriptSidePanel: {},
        transcriptPlayer: {},
        errors: {
          loadTranscriptions: "No se pudieron cargar las transcripciones",
          hint: "Comprueba los permisos de la app o reinicia Whispr.",
        },
      },
      import: {
        modal: {
          title: "Nueva transcripción",
          description:
            "Pega un enlace o arrastra un archivo — todo permanece en tu Mac.",
        },
        urlInput: {
          label: "URL del vídeo",
          placeholder: "Pega una URL de YouTube, Vimeo u otro vídeo",
          errorEmpty: "Pega una URL primero",
          errorInvalid: "No parece una URL válida",
        },
        dropZone: {
          title: "Arrastra y suelta archivos de vídeo o audio",
          formats: "MP4, MOV, MKV, WebM, AVI, MP3, WAV, M4A, FLAC, OGG, AAC",
          chooseTitle: "Elegir vídeo o audio",
        },
        dropMedia: {
          pathWarning:
            "Algunos archivos no se pudieron añadir porque su ruta no estaba disponible. Usa Explorar o suéltalos desde Finder.",
          dialogTitle: "Whispr",
        },
      },
      setup: {
        welcome: {
          title: "Bienvenido a Whispr",
          description:
            "La configuración inicial descarga ffmpeg, yt-dlp y el modelo Whisper elegido. Si whisper-cli no está en tu Mac, Whispr lo instala con Homebrew (necesitas Homebrew desde brew.sh). Puedes cambiar el modelo después en Ajustes.",
          offlineNote:
            "Tras la configuración, la transcripción funciona sin conexión. Internet solo se necesita durante la descarga.",
        },
        model: { chooseLabel: "Elige el modelo (multilingüe)" },
        button: { setup: "Configurar Whispr" },
        loading: {
          title: "Descargando componentes…",
          homebrewNote:
            "El paso de transcripción puede ejecutar Homebrew para instalar whisper-cpp — la primera vez puede tardar varios minutos.",
        },
        component: {
          ffmpeg: "ffmpeg — audio/vídeo",
          ytdlp: "yt-dlp — descarga por URL",
          whisperCli: "whisper-cli — transcripción",
          model: "Modelo Whisper",
        },
      },
      settings: {
        title: "Ajustes",
        browserOnly:
          "Los ajustes que acceden a tu Mac (binarios, disco, modelos) requieren la app de escritorio. Ejecuta `bun run tauri dev` en lugar del servidor del navegador.",
        storageDescription: "Desglose aproximado del uso de disco de esta app",
        general: {
          language: {
            label: "Idioma",
            description: "Elige el idioma de la interfaz de Whispr",
          },
          exportFormat: {
            label: "Formato de exportación predeterminado",
            description:
              "Formato usado al exportar transcripciones desde el panel",
          },
          concurrent: {
            label: "Transcripciones simultáneas",
            description: "Cuántos trabajos pueden ejecutarse a la vez (1–3)",
          },
        },
        about: {},
        binaryStatus: {
          loading: "Cargando…",
          checkingToolStatus: "Comprobando estado de herramientas",
          requiredMissing:
            "Componente obligatorio. Whispr no puede transcribir sin él.",
        },
        modelSelector: {},
        diskBreakdown: {
          noData: "Aún no hay datos de uso.",
          tooltip: "{{label}} · {{size}} ({{percent}}%)",
        },
      },
      record: {
        loading: "Cargando grabaciones…",
        emptyState: {
          title: "Grabar",
          description:
            "Captura voz con transcripción en vivo. La grabación se guarda localmente y se finaliza al detener. Toca el botón del micrófono abajo para empezar.",
        },
        live: {
          placeholder: "Empieza a hablar para ver la transcripción en vivo…",
        },
        controls: {
          stopAndSave: "Detener y guardar",
          discardRecording: "Descartar grabación",
        },
        navGuard: {
          title: "Grabación en curso",
          description:
            "Detén y guarda la grabación, descártala o quédate aquí para continuar.",
          stopAndSave: "Detener y guardar",
        },
        errors: {
          startFailed: "No se pudo iniciar la grabación",
          loadFailed: "No se pudieron cargar las grabaciones",
          saveFailed: "No se pudo guardar la grabación",
          desktopRequired: "La grabación requiere la aplicación de escritorio.",
        },
      },
      media: {
        browserOnly:
          "La reproducción de medios está disponible en la aplicación de escritorio.",
        loading: "Cargando medios…",
        description:
          "Copias de audio compactas para reproducción en la app. Eliminar un archivo libera espacio; las transcripciones permanecen, pero la reproducción y la sincronización de segmentos dependen de estos archivos.",
        syncedPlayback: "Reproducción sincronizada",
        emptyState: {
          title: "Audio para reproducción",
          description:
            "Whispr guarda aquí copias compactas de tu audio para que puedas escuchar en la app y seguir los segmentos de transcripción con marcas de tiempo.",
          bullet1:
            "Los archivos aparecen cuando termina una transcripción o detienes una grabación.",
          bullet2:
            "Eliminar audio libera espacio. El texto de la transcripción permanece; solo se eliminan la reproducción y la sincronización de segmentos.",
          hint: "Importa medios o graba desde las otras pestañas de la barra lateral.",
        },
        delete: {
          title: "¿Eliminar audio de reproducción?",
          willRemove: "{{filename}} se eliminará del disco.",
          transcriptStays:
            "El texto de la transcripción permanece en Whispr, pero perderás la reproducción en la app",
          syncLoss: " y la sincronización de segmentos con marcas de tiempo",
          retranscribe:
            " para este elemento hasta que vuelvas a transcribir la fuente.",
          confirm: "Eliminar audio",
          thisFile: "Este archivo",
        },
        errors: {
          loadFailed: "No se pudieron cargar los medios",
          deleteFailed: "No se pudo eliminar el medio",
        },
      },
    },
    backend: {
      jobStatus: {
        pending: "Pendiente",
        processing: "Procesando",
        completed: "Completado",
        failed: "Fallido",
      },
      pipelineStage: {
        downloading: "Descargando",
        extracting: "Extrayendo",
        transcribing: "Transcribiendo",
        progress: "{{stage}} · {{percent}}%",
      },
      disk: {
        binaries: "Herramientas (ffmpeg, yt-dlp)",
        models: "Modelos Whisper",
        audio: "Audio para reproducción",
        database: "Base de datos",
        temp: "Archivos temporales",
        app_core: "Ejecutable de la app",
      },
      sourceType: {
        local: "Archivo local",
        url: "URL",
        record: "Grabación",
        urlImport: "Importación por URL",
        transcription: "Transcripción",
        unknown: "Desconocido",
      },
    },
  },

  fr: {
    common: {
      actions: {
        cancel: "Annuler",
        delete: "Supprimer",
        discard: "Abandonner",
        retry: "Réessayer",
        view: "Voir",
        new: "Nouveau",
        close: "Fermer",
        back: "Retour",
        tryAgain: "Réessayer",
        use: "Utiliser",
        download: "Télécharger",
        browseFiles: "Parcourir les fichiers...",
        addToQueue: "Ajouter à la file",
        checkAgain: "Vérifier à nouveau",
        copyText: "Copier le texte",
        copied: "Copié !",
        translate: "Traduire",
        copy: "Copier",
      },
      loading: "Chargement",
      loadingEllipsis: "Chargement…",
      deleting: "Suppression…",
      translating: "Traduction…",
      checking: "Vérification…",
      downloading: "Téléchargement…",
      installing: "Installation…",
      or: "ou",
      emptyPlaceholder: "—",
      nav: {
        transcriptions: "Transcriptions",
        record: "Enregistrer",
        media: "Médias",
        settings: "Réglages",
        whispr: "Whispr",
      },
      theme: {
        light: "Clair",
        dark: "Sombre",
        system: "Système",
        colorTheme: "Thème de couleur",
        colorThemeDescription:
          "Choisissez clair, sombre ou l'apparence du système",
      },
      exportFormats: {
        txt: "Texte brut",
        txtTimestamps: "Texte avec horodatage",
        srt: "Sous-titres SRT",
        pdf: "PDF",
        docx: "Word (DOCX)",
        txtWithExt: "Texte brut (.txt)",
        srtWithExt: "Sous-titres (.srt)",
        pdfWithExt: "PDF (.pdf)",
        docxWithExt: "Word (.docx)",
      },
      dialogFilters: {
        srt: "SRT",
        pdf: "PDF",
        word: "Word",
        text: "Texte",
        videoAudio: "Vidéo et audio",
      },
      models: {
        small: "Petit",
        medium: "Moyen",
        large: "Grand",
        smallTitle: "Petit (~466 Mo)",
        mediumTitle: "Moyen (~1,5 Go)",
        largeTitle: "Grand (~3,1 Go)",
        smallHint: "Bonne qualité, plus rapide",
        mediumHint: "Recommandé",
        largeHint: "Meilleure qualité",
        smallSize: "~466 Mo",
        mediumSize: "~1,5 Go",
        largeSize: "~3,1 Go",
        active: "Actif",
        downloaded: "Téléchargé",
      },
      concurrentJobs: {
        one: "1 tâche",
        two: "2 tâches",
        three: "3 tâches",
      },
      languages: {
        en: "Anglais",
        ru: "Russe",
        ro: "Roumain",
        es: "Espagnol",
        fr: "Français",
      },
      translateLanguages: {
        en: "Anglais",
        es: "Espagnol",
        fr: "Français",
        de: "Allemand",
        it: "Italien",
        pt: "Portugais",
        ro: "Roumain",
        ru: "Russe",
        uk: "Ukrainien",
        ja: "Japonais",
        zh: "Chinois",
      },
      binaryStatus: {
        installed: "Installé",
        missing: "Manquant",
      },
      playback: {
        play: "Lecture",
        pause: "Pause",
        volume: "Volume",
        rec: "ENR",
        paused: "En pause",
        resume: "Reprendre",
      },
      update: {
        available: "Mise à jour disponible",
        upToDate: "À jour",
        error: "Erreur",
        updateAndRestart: "Mettre à jour et redémarrer",
        versionAvailable: "v{{version}} disponible",
        updateAvailableVersion: "Mise à jour disponible : v{{version}}",
        latestRelease: "Vous avez la dernière version",
        couldNotCheck: "Impossible de vérifier les mises à jour",
        inProgress: "Mise à jour en cours…",
        installVersion: "Installer v{{version}}",
        downloadingPercent: "Téléchargement {{percent}} %",
        installingUpdate: "Installation de la mise à jour…",
        downloadingUpdate: "Téléchargement de la mise à jour… {{percent}} %",
      },
      desktopOnly: {
        sqliteShell:
          "SQLite fonctionne dans l'application de bureau. Utilisez `bun run tauri dev` au lieu du serveur de développement du navigateur.",
        settingsShell:
          "Les réglages qui accèdent à votre Mac (binaires, disque, modèles) nécessitent l'application de bureau. Lancez `bun run tauri dev` au lieu du serveur navigateur.",
        recordingShell: "L'enregistrement nécessite l'application de bureau.",
        playbackShell:
          "La lecture des médias est disponible dans l'application de bureau.",
      },
      toasts: {
        recordingSaved: "Enregistrement enregistré",
      },
      table: {
        name: "Nom",
        duration: "Durée",
        date: "Date",
        status: "État",
        actions: "Actions",
      },
      details: {
        source: "Source",
        created: "Créé",
        duration: "Durée",
        model: "Modèle",
        version: "Version",
        total: "Total",
      },
      sections: {
        actions: "Actions",
        exportAs: "Exporter en",
        details: "Détails",
        about: "À propos",
        general: "Général",
        system: "Système",
        storage: "Stockage",
        whisperModels: "Modèles Whisper",
      },
      aria: {
        dismissNotification: "Fermer la notification",
        dismissUpdate: "Fermer l'avis de mise à jour",
        resizeSidebar: "Redimensionner la barre latérale",
        rename: "Renommer",
        editTitle: "Modifier le titre",
        clickToRename: "Cliquer pour renommer",
        backToTranscriptions: "Retour aux transcriptions",
        startRecording: "Commencer l'enregistrement",
        checkingTools: "Vérification des outils",
        checkingToolsTitle: "Vérification des outils…",
        diskUsageByCategory: "Utilisation du disque par catégorie",
      },
    },
    app: {
      components: {
        sidebar: {
          updateBadge: "Nouveau",
          updateAvailable: "Mise à jour disponible",
        },
        header: {},
        appShell: { loading: "Chargement…" },
        appFileDropLayer: {
          title: "Déposer pour importer",
          subtitle: "Fichiers vidéo ou audio",
        },
        themeToggle: {},
        editableFileName: {},
        updatePopover: {},
      },
      dashboard: {
        loading: "Chargement de vos transcriptions…",
        emptyState: {
          title: "Aucune transcription pour l'instant",
          description:
            "Collez un lien ou déposez un fichier ci-dessous. Tout fonctionne hors ligne sur votre Mac — sans clés API.",
        },
        fileList: {},
        fileRow: {},
        transcriptView: {
          recordedBadge: "Enregistré",
          translatedTo: "Traduit en {{language}}",
          showOriginal: "Afficher l'original",
          showingOriginal: "Original affiché",
          showTranslation: "Afficher la traduction",
          translationNoText:
            "La traduction n'a renvoyé aucun texte. Réessayez.",
          translationFailed:
            "Échec de la traduction. Vérifiez votre connexion et réessayez.",
        },
        transcriptSidePanel: {},
        transcriptPlayer: {},
        errors: {
          loadTranscriptions: "Impossible de charger les transcriptions",
          hint: "Vérifiez les autorisations de l'app ou redémarrez Whispr.",
        },
      },
      import: {
        modal: {
          title: "Nouvelle transcription",
          description:
            "Collez un lien ou glissez un fichier — tout reste sur votre Mac.",
        },
        urlInput: {
          label: "URL de la vidéo",
          placeholder: "Collez une URL YouTube, Vimeo ou autre vidéo",
          errorEmpty: "Collez d'abord une URL",
          errorInvalid: "Cela ne ressemble pas à une URL valide",
        },
        dropZone: {
          title: "Glissez-déposez des fichiers vidéo ou audio",
          formats: "MP4, MOV, MKV, WebM, AVI, MP3, WAV, M4A, FLAC, OGG, AAC",
          chooseTitle: "Choisir une vidéo ou un audio",
        },
        dropMedia: {
          pathWarning:
            "Certains fichiers n'ont pas pu être ajoutés car leur chemin n'était pas disponible. Utilisez Parcourir ou déposez-les depuis le Finder.",
          dialogTitle: "Whispr",
        },
      },
      setup: {
        welcome: {
          title: "Bienvenue dans Whispr",
          description:
            "La configuration initiale télécharge ffmpeg, yt-dlp et le modèle Whisper choisi. Si whisper-cli n'est pas déjà sur votre Mac, Whispr l'installe via Homebrew (Homebrew requis depuis brew.sh). Vous pourrez changer de modèle plus tard dans les Réglages.",
          offlineNote:
            "Après la configuration, la transcription fonctionne hors ligne. Internet n'est requis que pendant le téléchargement.",
        },
        model: { chooseLabel: "Choisir le modèle (multilingue)" },
        button: { setup: "Configurer Whispr" },
        loading: {
          title: "Téléchargement des composants…",
          homebrewNote:
            "L'étape de transcription peut lancer Homebrew pour installer whisper-cpp — la première fois peut prendre plusieurs minutes.",
        },
        component: {
          ffmpeg: "ffmpeg — audio/vidéo",
          ytdlp: "yt-dlp — téléchargement URL",
          whisperCli: "whisper-cli — transcription",
          model: "Modèle Whisper",
        },
      },
      settings: {
        title: "Réglages",
        browserOnly:
          "Les réglages qui accèdent à votre Mac (binaires, disque, modèles) nécessitent l'application de bureau. Lancez `bun run tauri dev` au lieu du serveur navigateur.",
        storageDescription:
          "Répartition approximative de l'espace disque utilisé",
        general: {
          language: {
            label: "Langue",
            description: "Choisissez la langue de l'interface Whispr",
          },
          exportFormat: {
            label: "Format d'export par défaut",
            description:
              "Format utilisé lors de l'export des transcriptions depuis le tableau de bord",
          },
          concurrent: {
            label: "Transcriptions simultanées",
            description:
              "Nombre de tâches pouvant s'exécuter en parallèle (1–3)",
          },
        },
        about: {},
        binaryStatus: {
          loading: "Chargement…",
          checkingToolStatus: "Vérification de l'état des outils",
          requiredMissing:
            "Composant requis. Whispr ne peut pas transcrire sans lui.",
        },
        modelSelector: {},
        diskBreakdown: {
          noData: "Aucune donnée d'utilisation pour l'instant.",
          tooltip: "{{label}} · {{size}} ({{percent}} %)",
        },
      },
      record: {
        loading: "Chargement des enregistrements…",
        emptyState: {
          title: "Enregistrer",
          description:
            "Capturez la parole avec transcription en direct. L'enregistrement est sauvegardé localement et finalisé à l'arrêt. Appuyez sur le bouton micro ci-dessous pour commencer.",
        },
        live: {
          placeholder:
            "Commencez à parler pour voir la transcription en direct…",
        },
        controls: {
          stopAndSave: "Arrêter et enregistrer",
          discardRecording: "Abandonner l'enregistrement",
        },
        navGuard: {
          title: "Enregistrement en cours",
          description:
            "Arrêtez et enregistrez, abandonnez ou restez ici pour continuer.",
          stopAndSave: "Arrêter et enregistrer",
        },
        errors: {
          startFailed: "Impossible de démarrer l'enregistrement",
          loadFailed: "Impossible de charger les enregistrements",
          saveFailed: "Impossible d'enregistrer l'enregistrement",
          desktopRequired:
            "L'enregistrement nécessite l'application de bureau.",
        },
      },
      media: {
        browserOnly:
          "La lecture des médias est disponible dans l'application de bureau.",
        loading: "Chargement des médias…",
        description:
          "Copies audio compactes pour la lecture dans l'app. Supprimer un fichier libère de l'espace ; les transcriptions restent, mais la lecture et la synchronisation des segments en dépendent.",
        syncedPlayback: "Lecture synchronisée",
        emptyState: {
          title: "Audio de lecture",
          description:
            "Whispr conserve ici des copies compactes de votre audio pour écouter dans l'app et suivre les segments de transcription horodatés.",
          bullet1:
            "Les fichiers apparaissent après une transcription terminée ou l'arrêt d'un enregistrement.",
          bullet2:
            "Supprimer l'audio libère de l'espace. Le texte de la transcription reste ; seuls la lecture et la synchronisation des segments sont supprimées.",
          hint: "Importez des médias ou enregistrez depuis les autres onglets de la barre latérale.",
        },
        delete: {
          title: "Supprimer l'audio de lecture ?",
          willRemove: "{{filename}} sera supprimé du disque.",
          transcriptStays:
            "Le texte de la transcription reste dans Whispr, mais vous perdrez la lecture dans l'app",
          syncLoss: " et la synchronisation des segments horodatés",
          retranscribe:
            " pour cet élément jusqu'à ce que vous transcriviez à nouveau la source.",
          confirm: "Supprimer l'audio",
          thisFile: "Ce fichier",
        },
        errors: {
          loadFailed: "Impossible de charger les médias",
          deleteFailed: "Impossible de supprimer le média",
        },
      },
    },
    backend: {
      jobStatus: {
        pending: "En attente",
        processing: "En cours",
        completed: "Terminé",
        failed: "Échoué",
      },
      pipelineStage: {
        downloading: "Téléchargement",
        extracting: "Extraction",
        transcribing: "Transcription",
        progress: "{{stage}} · {{percent}} %",
      },
      disk: {
        binaries: "Outils (ffmpeg, yt-dlp)",
        models: "Modèles Whisper",
        audio: "Audio de lecture",
        database: "Base de données",
        temp: "Fichiers temporaires",
        app_core: "Exécutable de l'app",
      },
      sourceType: {
        local: "Fichier local",
        url: "URL",
        record: "Enregistrement",
        urlImport: "Import URL",
        transcription: "Transcription",
        unknown: "Inconnu",
      },
    },
  },
};

export const LOCALE_CODES = Object.keys(LOCALES) as Array<keyof typeof LOCALES>;
export const NAMESPACES = ["common", "app", "backend"] as const;
